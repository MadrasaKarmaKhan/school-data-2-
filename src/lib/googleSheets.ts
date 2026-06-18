import { getAccessToken } from './googleAuth';
import { Result } from '../types';

const SHEET_TITLE = "Madarsa Results Database";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Google access token missing");

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response.text();
    console.error("Google API Error:", err);
    throw new Error(`Google API Error: ${response.statusText}`);
  }
  return response;
}

export async function getOrCreateSpreadsheet(): Promise<string> {
  const cachedId = localStorage.getItem("google_sheets_sync_id");
  if (cachedId) return cachedId;

  // Search if we already created it
  const searchRes = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(SHEET_TITLE)}' and trashed=false&fields=files(id,name)`);
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    const id = searchData.files[0].id;
    localStorage.setItem("google_sheets_sync_id", id);
    return id;
  }

  // Create new spreadsheet
  const createRes = await fetchWithAuth('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: SHEET_TITLE
      },
      sheets: [
        {
          properties: { title: "Results" },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: "ID" } },
                { userEnteredValue: { stringValue: "Roll No" } },
                { userEnteredValue: { stringValue: "Class" } },
                { userEnteredValue: { stringValue: "Student Name" } },
                { userEnteredValue: { stringValue: "Father Name" } },
                { userEnteredValue: { stringValue: "Mother Name" } },
                { userEnteredValue: { stringValue: "Total Marks" } },
                { userEnteredValue: { stringValue: "Percentage" } },
                { userEnteredValue: { stringValue: "Status" } },
                { userEnteredValue: { stringValue: "Exam Type" } },
                { userEnteredValue: { stringValue: "Passing Year" } }
              ]
            }]
          }]
        }
      ]
    })
  });
  
  const createData = await createRes.json();
  const newId = createData.spreadsheetId;
  localStorage.setItem("google_sheets_sync_id", newId);
  return newId;
}

export async function appendResultToSheet(result: Result) {
  const spreadsheetId = await getOrCreateSpreadsheet();
  
  const values = [
    [
      result.id,
      result.rollNo.toString(),
      result.className,
      result.studentName,
      result.fatherName || "",
      result.motherName || "",
      result.totalMarks.toString(),
      result.percentage.toFixed(2) + "%",
      result.isPassed ? "PASS" : "FAIL",
      result.examType || "",
      result.passingYear.toString()
    ]
  ];

  await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Results!A:K:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    body: JSON.stringify({
      values
    })
  });
}
