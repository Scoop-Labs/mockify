import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, phone, email, marks, subject, experience, token } = req.body;

  if (!name || !phone || !email || marks === undefined || !subject || !experience) {
    return res.status(400).json({ message: 'Missing required candidate details' });
  }

  const serviceAccountEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || process.env.VITE_ATTENDANCE_SHEET_URL;

  // Extract Google Spreadsheet ID if it's passed as a full URL
  if (spreadsheetId && spreadsheetId.startsWith('http')) {
    const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      spreadsheetId = match[1];
    }
  }

  // FALLBACK: If they configured Apps Script Web App URL in VITE_ATTENDANCE_SHEET_URL
  const attendanceUrl = process.env.VITE_ATTENDANCE_SHEET_URL || process.env.ATTENDANCE_SHEET_URL;
  const isAppsScriptUrl = attendanceUrl && attendanceUrl.startsWith('https://script.google.com');

  if (isAppsScriptUrl) {
    console.log("Using legacy Apps Script URL for logging...");
    try {
      const response = await fetch(attendanceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, marks, subject, experience, token }),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const result = await response.json();
      if (result.result === 'error') throw new Error(result.error);
      return res.status(200).json({ success: true, message: 'Logged via Apps Script fallback' });
    } catch (err) {
      console.error("Apps Script Fallback error:", err);
      return res.status(500).json({ message: 'Failed to log via Apps Script fallback', error: err.message });
    }
  }

  // Google Sheets API via Service Account
  if (!serviceAccountEnv) {
    return res.status(500).json({ message: 'Server configuration error: Missing GOOGLE_SERVICE_ACCOUNT_JSON' });
  }
  if (!spreadsheetId) {
    return res.status(500).json({ message: 'Server configuration error: Missing or invalid GOOGLE_SPREADSHEET_ID' });
  }

  try {
    const credentials = JSON.parse(serviceAccountEnv);
    
    // Generate JWT Assertion
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const base64url = (str) => Buffer.from(str).toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signInput = `${encodedHeader}.${encodedClaim}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signInput);
    
    // Google private key needs to have newlines replaced properly if they got double-escaped
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');
    const signature = sign.sign(privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${signInput}.${signature}`;

    // Get OAuth Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token generation error:", errorText);
      throw new Error(`Google OAuth error: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Check if headers exist in A1:H1
    let hasHeaders = false;
    let needsTokenHeader = false;
    try {
      const checkResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:H1`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.values && checkData.values.length > 0 && checkData.values[0][0]) {
          hasHeaders = true;
          // Check if token header is missing in A1:H1
          if (checkData.values[0].length < 8 || !checkData.values[0].some(h => String(h).trim().toLowerCase() === 'token')) {
            needsTokenHeader = true;
          }
        }
      }
    } catch (e) {
      console.warn("Could not check headers status:", e);
    }

    if (!hasHeaders) {
      console.log("Headers not found. Creating headers in A1:H1...");
      try {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("A1:H1")}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              range: "A1:H1",
              majorDimension: "ROWS",
              values: [["time", "name", "phone_num", "mail", "score", "subject", "year", "token"]]
            })
          }
        );
      } catch (e) {
        console.warn("Failed to write headers:", e);
      }
    } else if (needsTokenHeader) {
      console.log("Adding 'token' header to H1...");
      try {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("H1")}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              range: "H1",
              majorDimension: "ROWS",
              values: [["token"]]
            })
          }
        );
      } catch (e) {
        console.warn("Failed to write token header to H1:", e);
      }
    }

    // Format phone number to prevent Google Sheets from parsing it as a formula (starts with '+')
    const phoneStr = String(phone);
    const formattedPhone = phoneStr.startsWith('+') ? `'${phoneStr}` : phoneStr;

    // Append to Sheet (using range "A:H" which targets the first sheet tab)
    const range = "A:H";
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: range,
          majorDimension: "ROWS",
          values: [[
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
            name,
            formattedPhone,
            email,
            marks + "%",
            subject,
            experience,
            token || 'N/A'
          ]]
        })
      }
    );

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      console.error("Append values error:", errorText);
      throw new Error(`Google Sheets append error: ${appendResponse.statusText}`);
    }

    const appendData = await appendResponse.json();
    return res.status(200).json({ success: true, message: 'Logged to Google Sheet via Sheets API', updatedRange: appendData.tableRange });

  } catch (error) {
    console.error("Google Sheets API error:", error);
    return res.status(500).json({ message: "Failed to log to Google Sheets", error: error.message });
  }
}
