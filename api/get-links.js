import db from '../helpers/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const linksStmt = db.prepare('SELECT * FROM InterviewLinks ORDER BY created_at DESC');
    const links = linksStmt.all();

    const auditStmt = db.prepare('SELECT * FROM AuditLogs ORDER BY access_time DESC LIMIT 150');
    const auditLogs = auditStmt.all();

    const sheetStmt = db.prepare('SELECT * FROM SimulatedGoogleSheet');
    const simulatedSheet = sheetStmt.all();

    return res.status(200).json({
      success: true,
      links,
      auditLogs,
      simulatedSheet
    });
  } catch (error) {
    console.error("Error retrieving admin dashboard data:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
