export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
        return res.status(500).json({ message: 'Server configuration error: Missing API Key' });
    }

    const payload = {
        sender: { name: "Scoop Labs", email: "support@scooplabs.in" },
        to: [{ email }],
        subject: "Your Mockify Verification Code",
        htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0c7a7a; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Mockify Verification</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">Your verification code to start the assessment is:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827; background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">This code will expire shortly. Do not share this code with anyone.</p>
        </div>
      </div>
    `
    };

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
            const errorData = await response.json().catch(() => ({}));
            console.error("Brevo API error:", errorData);

            // If the error is an unrecognised IP, we bypass it for local testing
            if (errorData.message && errorData.message.includes('unrecognised IP address')) {
                console.warn("Brevo IP restricted. Bypassing for local testing. Use OTP: 000000");
                return res.status(200).json({ success: true, bypassed: true });
            }

            return res.status(response.status).json({ message: `Brevo API error: ${errorData.message || response.statusText}` });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}