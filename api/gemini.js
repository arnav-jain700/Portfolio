export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://arnavjaindev.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

  const groqApiKey = process.env.GROQ_API_KEY || req.headers['x-groq-key'];
  const geminiApiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];

  const { messages, payload, model, temperature, max_tokens, json } = req.body || {};

  // 1. Try Groq (Primary High-Speed LPU Engine)
  if (groqApiKey) {
    try {
      const groqModel = model || "llama-3.3-70b-versatile";
      const groqMessages = messages || (payload ? [
        ...(payload.systemInstruction ? [{ role: "system", content: payload.systemInstruction.parts?.[0]?.text || "" }] : []),
        ...(payload.contents || []).map(c => ({
          role: c.role === "model" ? "assistant" : "user",
          content: c.parts?.[0]?.text || ""
        }))
      ] : [{ role: "user", content: "Hello" }]);

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: groqModel,
          messages: groqMessages,
          temperature: temperature !== undefined ? temperature : 0.7,
          max_tokens: max_tokens || 500,
          response_format: json ? { type: "json_object" } : undefined
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const outputText = groqData.choices?.[0]?.message?.content || "";
        return res.status(200).json({ text: outputText, raw: groqData });
      }
      const errText = await groqRes.text();
      console.warn("Groq API error in proxy:", errText);
    } catch (e) {
      console.warn("Groq fetch failed:", e);
    }
  }

  // 2. Try Gemini (Fallback)
  if (geminiApiKey && payload) {
    const customModel = payload.model || "gemini-1.5-flash";
    const models = [customModel, "gemini-1.5-flash-latest", "gemini-2.0-flash"];
    const versions = ["v1", "v1beta"];
    
    for (const ver of versions) {
      for (const mod of models) {
        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return res.status(200).json({ text: outputText, raw: data });
          }
        } catch (e) {}
      }
    }
  }

  return res.status(500).json({ 
    error: 'No valid AI API key is configured. Please provide your free Groq API key in the Admin Console or set GROQ_API_KEY in Vercel environment variables.' 
  });
}
