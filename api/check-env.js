export default async function handler(req, res) {
  const envStatus = {
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "Configured" : "Missing",
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID ? "Configured" : "Missing",
    VITE_ATTENDANCE_SHEET_URL: process.env.VITE_ATTENDANCE_SHEET_URL ? "Configured" : "Missing",
    CRM_TOKEN: process.env.CRM_TOKEN ? "Configured" : "Missing",
    BREVO_API_KEY: (process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY) ? "Configured" : "Missing",
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) ? "Configured" : "Missing"
  };

  return res.status(200).json(envStatus);
}
