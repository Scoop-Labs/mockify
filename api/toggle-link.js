import db from '../helpers/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, target, value } = req.body;
  if (!token || !target || value === undefined) {
    return res.status(400).json({ message: 'Missing token, target, or value' });
  }

  try {
    if (target === 'sheet') {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO SimulatedGoogleSheet (token, mode)
        VALUES (?, ?)
      `);
      stmt.run(token, value);
    } else if (target === 'database') {
      const stmt = db.prepare(`
        UPDATE InterviewLinks 
        SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE token = ?
      `);
      stmt.run(value, token);
    } else {
      return res.status(400).json({ message: 'Invalid target. Must be "sheet" or "database"' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error toggling link state:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
