import db from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sheetId = process.env.VITE_GOOGLE_SHEET_ID;
  if (!sheetId) {
    return res.status(400).json({ message: 'Missing Google Sheet ID in env' });
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`;
  
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with status ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return res.status(200).json({ success: true, message: 'Google Sheet is empty or has only headers' });
    }

    // Parse headers: keys, tookens
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const keyIndex = headers.indexOf('keys');
    const tokenIndex = headers.indexOf('tookens');

    if (keyIndex === -1 || tokenIndex === -1) {
      return res.status(400).json({ message: "Google Sheet must have 'keys' and 'tookens' headers in the first row." });
    }

    const sheetTokens = [];
    const dbTokensStmt = db.prepare('SELECT token FROM InterviewLinks');
    const existingTokens = dbTokensStmt.all().map(r => r.token);

    const insertStmt = db.prepare(`
      INSERT INTO InterviewLinks (candidate_id, candidate_email, role, experience, token, is_enabled, expires_at, link_type)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        role = excluded.role,
        experience = excluded.experience,
        link_type = excluded.link_type,
        is_enabled = 1
    `);

    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const keyVal = row[keyIndex];
      const tokenVal = row[tokenIndex];

      if (tokenVal && keyVal) {
        sheetTokens.push(tokenVal);
        
        // Parse experience from the key
        const lowerKey = keyVal.toLowerCase();
        let exp = '0-1'; // Default to fresher
        if (lowerKey.includes('3y') || lowerKey.includes('3 year') || lowerKey.includes('3_year')) {
          exp = '1-3';
        }
        
        // Parse link_type (meta is campaign, normal is individual)
        let linkType = 'individual';
        if (lowerKey.includes('meta') || lowerKey.includes('campaign')) {
          linkType = 'campaign';
        }

        const mockCandidateId = 'cand_' + tokenVal.substring(0, 6);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        insertStmt.run(mockCandidateId, 'candidate@example.com', keyVal, exp, tokenVal, expiresAt, linkType);
        updatedCount++;
      }
    }

    // Disable any tokens in the database that are NOT in the Google Sheet anymore
    const disableStmt = db.prepare('UPDATE InterviewLinks SET is_enabled = 0 WHERE token = ?');
    let disabledCount = 0;
    
    for (const extToken of existingTokens) {
      if (!sheetTokens.includes(extToken)) {
        disableStmt.run(extToken);
        disabledCount++;
      }
    }

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