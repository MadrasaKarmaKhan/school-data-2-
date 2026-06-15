import express from 'express';
import path from 'path';
import multer from 'multer';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { Readable } from 'stream';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads in memory (Zaroori hai Vercel ke liye)
const upload = multer({ storage: multer.memoryStorage() });

// Helper to construct Google API auth client
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
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  });
}

// API Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const file = req.file;

    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      return res.status(500).json({ error: 'System configuration missing (Sheet ID)' });
    }

    const auth = getGoogleAuth();
    
    // 1. Upload File to Cloudinary
    let fileUrl = '';
    if (file) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'website-uploads' },
          (error: any, result: any) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        Readable.from(file.buffer).pipe(uploadStream);
      });

      fileUrl = (uploadResult as any).secure_url;
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

    res.json({ success: true, message: 'Data saved to Google Sheets and Cloudinary successfully!' });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during upload' });
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

// Vercel serverless functions support
export default app;
