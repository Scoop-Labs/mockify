import db from '../helpers/db.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { candidate_email, role, experience, expires_at, link_type } = req.body;

  if (!role || !experience || !expires_at || !link_type) {
    return res.status(400).json({ message: 'Missing required fields: role, experience, expires_at, link_type' });
  }

  if (link_type === 'individual' && !candidate_email) {
    return res.status(400).json({ message: 'Candidate email is required for individual invites' });
  }

  const token = 'tk_' + crypto.randomBytes(8).toString('hex');
  const candidate_id = link_type === 'individual' ? 'cand_' + crypto.randomBytes(6).toString('hex') : 'campaign';

  try {
    // Insert into InterviewLinks table
    const stmt = db.prepare(`
      INSERT INTO InterviewLinks (candidate_id, candidate_email, role, experience, token, expires_at, link_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(candidate_id, candidate_email || null, role, experience, token, expires_at, link_type);

    // Populate SimulatedGoogleSheet table with mode=1
    const sheetStmt = db.prepare(`
      INSERT OR REPLACE INTO SimulatedGoogleSheet (token, mode)
      VALUES (?, 1)
    `);
    sheetStmt.run(token);

    let emailSent = false;
    const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
    
    if (candidate_email && BREVO_API_KEY) {
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
      const startUrl = `${origin}/?token=${token}`;

      const payload = {
        sender: { name: "Scoop Labs", email: "support@scooplabs.in" },
        to: [{ email: candidate_email }],
        subject: "Your Mockify Technical Interview Invitation",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0c7a7a; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Mockify Invitation</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">Hello,</p>
              <p style="font-size: 16px; color: #374151;">You have been invited to complete a <strong>${role}</strong> assessment on Mockify.</p>
              <p style="font-size: 16px; color: #374151;">Experience Level: ${experience} years</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${startUrl}" style="background-color: #f27d26; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">Start Assessment</a>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">This link is secure and can only be used once. Do not forward this email.</p>
            </div>
          </div>
        `
      };

      const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      emailSent = emailResponse.ok;
    }

    return res.status(200).json({
      success: true,
      token,
      candidate_id,
      emailSent
    });
  } catch (error) {
    console.error("Error creating interview link:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}