import db from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM InterviewLinks WHERE token = ?');
    const link = stmt.get(token);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const logStmt = db.prepare(`
      INSERT INTO AuditLogs (token, candidate_email, ip_address, browser, status_checked)
      VALUES (?, ?, ?, ?, ?)
    `);

    if (!link) {
      logStmt.run(token, 'unknown', ip, userAgent, 'invalid_token');
      return res.status(200).json({ valid: false, reason: 'invalid_token', message: 'Invalid Interview Link' });
    }

    // Check enabled status
    if (!link.is_enabled) {
      logStmt.run(token, link.candidate_email || 'campaign', ip, userAgent, 'disabled');
      return res.status(200).json({ valid: false, reason: 'disabled', message: 'Interview Link Expired/Disabled' });
    }

    // Check expiry
    if (link.expires_at) {
      const expiresDate = new Date(link.expires_at);
      if (new Date() > expiresDate) {
        logStmt.run(token, link.candidate_email || 'campaign', ip, userAgent, 'expired');
        return res.status(200).json({ valid: false, reason: 'expired', message: 'Interview Link Expired' });
      }
    }

    // Check status (only for individual invites, campaigns are multi-use)
    if (link.link_type === 'individual' && link.interview_status === 'completed') {
      logStmt.run(token, link.candidate_email, ip, userAgent, 'already_submitted');
      return res.status(200).json({ valid: false, reason: 'already_submitted', message: 'Interview Already Submitted' });
    }

    logStmt.run(token, link.candidate_email || 'campaign', ip, userAgent, 'valid');
    
    return res.status(200).json({
      valid: true,
      role: link.role,
      experience: link.experience,
      candidate_email: link.candidate_email,
      link_type: link.link_type
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}