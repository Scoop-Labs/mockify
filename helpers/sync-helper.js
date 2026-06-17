import db from './db.js';

export async function syncGoogleSheet() {
  const sheetId = process.env.VITE_GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('Missing Google Sheet ID in env');
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets responded with status ${response.status}`);
  }
  const csvText = await response.text();
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return { updatedCount: 0, disabledCount: 0, sheetTokens: [] };
  }

  // Parse headers: keys, tookens
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const keyIndex = headers.indexOf('keys');
  let tokenIndex = headers.indexOf('tokens');
  if (tokenIndex === -1) {
    tokenIndex = headers.indexOf('tookens');
  }

  if (keyIndex === -1 || tokenIndex === -1) {
    throw new Error("Google Sheet must have 'keys' and 'tokens' (or 'tookens') headers in the first row.");
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
    let tokenVal = row[tokenIndex];

    if (!tokenVal && keyVal) {
      tokenVal = keyVal.replace(/\s+/g, '_');
    }

    if (tokenVal && keyVal) {
      sheetTokens.push(tokenVal);
      
      // Parse experience from the key
      const lowerKey = keyVal.toLowerCase();
      let exp = '0-1'; // Default to fresher
      if (lowerKey.includes('3y') || lowerKey.includes('3 year') || lowerKey.includes('3_year') || lowerKey.includes('intermediate') || lowerKey.includes('3')) {
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

  return { updatedCount, disabledCount, sheetTokens };
}
