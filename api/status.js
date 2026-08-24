export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasKey = !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY;
  return res.status(200).json({ live: hasKey, provider: process.env.GROQ_API_KEY ? 'groq' : (process.env.GEMINI_API_KEY ? 'gemini' : 'offline') });
}
