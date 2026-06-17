export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, firstName, score, attachmentBase64 } = req.body;

  if (!email || !firstName || score === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.error("Missing BREVO_API_KEY on the backend server.");
    return res.status(500).json({ message: 'Server configuration error: Missing API Key' });
  }

  const payload = {
    sender: { name: "Scoop Labs", email: "support@scooplabs.in" },
    to: [{ email, name: firstName }],
    subject: `Interview Update: ${firstName}`,
    htmlContent: `
      <div style="font-family: 'Inter', system-ui, sans-serif; padding: 40px; background-color: #ffffff; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>
        
        <p style="font-size: 16px; margin-bottom: 16px;">Thank you for actively participating in the interview. Your time and effort are greatly appreciated.</p>
        
        <p style="font-size: 16px; margin-bottom: 32px;">Wishing you all the best in your future endeavors. Have a great day!</p>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; color: #1e293b; line-height: 1.8;">
          <p style="margin: 0 0 1.5em 0; font-size: 16px;">Best regards,</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold;">Team Scoop Labs</p>
          <div style="margin: 16px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Contact No:</strong> +91 98444 00550</p>
            <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> <a href="mailto:info@scooplabs.in" style="color: #3b82f6; text-decoration: none;">info@scooplabs.in</a></p>
            <p style="margin: 0; font-size: 16px;"><strong>Website:</strong> <a href="https://www.scooplabs.in" style="color: #1e293b; text-decoration: none;">www.scooplabs.in</a></p>
          </div>
          <div style="margin-top: 24px;">
            <img src="https://crm.scooplabs.in/images/logo.png" alt="Scoop Labs" style="max-height: 40px; display: block;" />
            <p style="margin: 8px 0 0 0; font-size: 16px; color: #f27d26;">-Innovative Labs for Tech Learning-</p>
          </div>
        </div>
      </div>
    `
  };

  if (attachmentBase64) {
    payload.attachment = [{
      name: `${firstName}_Certificate.png`,
      content: attachmentBase64
    }];
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error:", errorText);
      return res.status(response.status).json({ message: `Brevo API error: ${response.statusText}`, error: errorText });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
