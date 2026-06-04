export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, phone, email, marks, subject, experience } = req.body;

  if (!name || !phone || !email || marks === undefined || !subject || !experience) {
    return res.status(400).json({ message: 'Missing required candidate details' });
  }

  const attendanceUrl = process.env.VITE_ATTENDANCE_SHEET_URL || process.env.ATTENDANCE_SHEET_URL;

  if (!attendanceUrl) {
    console.warn("Missing attendance sheet URL environment variable. Logging to console instead:", req.body);
    return res.status(200).json({ success: true, message: 'Logged to console (no sheet URL configured)' });
  }

  try {
    const response = await fetch(attendanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, phone, email, marks, subject, experience }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apps Script Error Response:", errorText);
      throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const result = await response.json();
    if (result.result === 'error') {
      throw new Error(result.error || 'Unknown Apps Script error');
    }

    return res.status(200).json({ success: true, message: 'Attendance logged successfully' });
  } catch (error) {
    console.error("Attendance Logging Error:", error);
    return res.status(500).json({ message: 'Failed to log attendance', error: error.message });
  }
}
