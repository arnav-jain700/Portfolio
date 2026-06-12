export default async function handler(req, res) {
  // Set CORS headers for security
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Vercel settings.' });
  }

  const { action, payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Missing payload in request body.' });
  }

  const customModel = payload.model || "gemini-1.5-flash";
  const models = [customModel, "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
  const versions = ["v1", "v1beta"];
  
  const urls = [];
  versions.forEach(ver => {
    models.forEach(mod => {
      urls.push(`https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${apiKey}`);
    });
  });

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
      const errText = await response.text();
      lastError = new Error(`Gemini API Error: ${response.status} ${errText} at ${url}`);
    } catch (e) {
      lastError = e;
    }
  }

  return res.status(500).json({ error: lastError?.message || 'All Gemini API endpoints failed.' });
}
