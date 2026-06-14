import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// VERCEL SPECIFIC: Disable default body parsing so multer can handle the file
export const config = {
  api: {
    bodyParser: false,
  },
};

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Replace actual literal newlines if it's stored exactly as a string
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); 

  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required.');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ]
  });
}

// Ensure the path matches exactly what frontend calls
app.post('*', upload.single('file'), async (req, res) => {
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
        body: Readable.from(file.buffer)
      };

      const uploadedFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
        supportsAllDrives: true
      });

      fileUrl = uploadedFile.data.webViewLink || uploadedFile.data.id || '';
    }

    // 2. Append Data to Google Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    const timestamp = new Date().toISOString();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1', 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, role, fileUrl]]
      }
    });

    res.json({ success: true, message: 'Data saved to Google Sheets and Drive successfully!' });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during upload' });
  }
});

// For Vercel Serverless Function entry point
export default app;
