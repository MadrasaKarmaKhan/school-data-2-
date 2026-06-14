import express from 'express';
import path from 'path';
import multer from 'multer';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper to construct Google API auth client
function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Replace actual literal newlines if it's stored exactly as a string
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); 

  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required.');
  }

  return new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ]
  );
}

// API Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const file = req.file;

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!sheetId || !driveFolderId) {
      return res.status(500).json({ error: 'System configuration missing (Sheet or Drive Folder ID)' });
    }

    const auth = getGoogleAuth();
    
    // 1. Upload File to Google Drive
    let fileUrl = '';
    if (file) {
      const drive = google.drive({ version: 'v3', auth });
      const fileMetadata = {
        name: file.originalname,
        parents: [driveFolderId]
      };
      
      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path)
      };

      const uploadedFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      fileUrl = uploadedFile.data.webViewLink || uploadedFile.data.id || '';
      
      // Cleanup locally uploaded file
      fs.unlinkSync(file.path);
    }

    // 2. Append Data to Google Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    
    // We append a row with: Timestamp, Name, Email, Role, File URL
    const timestamp = new Date().toISOString();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1', // Adjust to your actual sheet name 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, role, fileUrl]]
      }
    });

    res.json({ success: true, message: 'Data saved to Google Sheets and Drive successfully!' });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during upload' });
    
    // Clean up local file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
