import { syncGoogleSheet } from './sync-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { updatedCount, disabledCount, sheetTokens } = await syncGoogleSheet();
    return res.status(200).json({
      success: true,
      message: `Successfully synchronized sheet. ${updatedCount} tokens active, ${disabledCount} tokens expired/disabled.`,
      sheet_tokens: sheetTokens
    });
  } catch (error) {
    console.error("Google Sheet Sync Error:", error);
    return res.status(500).json({ message: "Failed to sync Google Sheet", error: error.message });
  }
}