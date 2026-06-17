import db from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, status, score, email } = req.body;
  if (!token || !status) {
    return res.status(400).json({ message: 'Missing token or status' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE InterviewLinks 
      SET interview_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE token = ?
    `);
    const result = stmt.run(status, token);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Interview link not found' });
    }

    // Update the corresponding audit logs or add a completion log
    if (score !== undefined) {
      const getEmailStmt = db.prepare('SELECT candidate_email FROM InterviewLinks WHERE token = ?');
      const link = getEmailStmt.get(token);
      
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      const logStmt = db.prepare(`
        INSERT INTO AuditLogs (token, candidate_email, ip_address, browser, status_checked, result_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      logStmt.run(token, email || (link && link.candidate_email) || 'campaign', ip, userAgent, 'completed', score);
    }

    return res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error("Error updating interview status:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
