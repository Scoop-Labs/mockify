export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { first_name, last_name, phone, email_id, source, score } = req.body;

  if (!first_name || !email_id || !phone) {
    return res.status(400).json({ message: 'Missing required fields: first_name, email_id, phone' });
  }

  const token = process.env.CRM_TOKEN;
  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing CRM_TOKEN in environment' });
  }

  const payload = {
    first_name,
    last_name: last_name || '',
    phone,
    email_id,
    source: source || 'ai-interview',
    score: score !== undefined ? String(score) : '0.0'
  };

  try {
    const response = await fetch('https://crm.scooplabs.in/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("CRM API responded with error:", data);
      return res.status(response.status).json({
        message: data.message || `CRM Sync failed with status: ${response.status}`,
        error: data
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Internal CRM Sync error:", error);
    return res.status(500).json({ message: "Failed to sync to CRM", error: error.message });
  }
}
