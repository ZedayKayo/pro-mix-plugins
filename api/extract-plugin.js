const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    brand: { type: "STRING" },
    developer: { type: "STRING" },
    category: { type: "STRING" },
    subcategory: { type: "STRING" },
    type: { type: "ARRAY", items: { type: "STRING" } },
    dawCompat: { type: "ARRAY", items: { type: "STRING" } },
    images: { type: "ARRAY", items: { type: "STRING" } },
    videoDemo: { type: "STRING" },
    productPage: { type: "STRING" },
    price: { type: "NUMBER" },
    shortDesc: { type: "STRING", description: "A strict 1-2 sentence marketing hook. Maximum 150 characters." },
    description: { type: "STRING", description: "A concise summary (max 3 paragraphs). Ignore forum chatter, user comments, and installation tutorials." },
    features: { type: "ARRAY", items: { type: "STRING" }, description: "List of key features. Keep each feature concise." },
    specs: {
      type: "OBJECT",
      properties: {
        Format: { type: "STRING" },
        OS: { type: "STRING" },
        "CPU Usage": { type: "STRING" },
        Download: { type: "STRING" },
        Version: { type: "STRING" },
        download_win: { type: "STRING" },
        download_mac: { type: "STRING" }
      }
    },
    systemReqs: {
      type: "OBJECT",
      properties: {
        os: { type: "STRING" },
        ram: { type: "STRING" },
        cpu: { type: "STRING" },
        disk: { type: "STRING" }
      }
    }
  },
  required: ["name", "brand", "developer", "category", "subcategory", "type", "dawCompat", "images", "videoDemo", "productPage", "price", "shortDesc", "description", "features"]
};

const SYSTEM_PROMPT = `
You are an expert audio plugin database assistant. Extract details for audio plugins from any input — plugin names, website content, or Russian-language RuTracker forum posts.
RULES:
- Translate ALL Russian content to English.
- category must be one of: eq, compressor, reverb, delay, synth, distortion, mastering, bundle, utility
- type array: lowercase strings like "vst3", "au", "aax"
- dawCompat array: use slugs like "fl-studio", "ableton", "logic", "pro-tools", "cubase", "studio-one"
- images: ONLY include image URLs that were explicitly present in the provided content (ending in .jpg, .png, .webp, .gif). If none found or you are using world knowledge, return an EMPTY array [].
- FOR ALL OTHER FIELDS (price, descriptions, features, system requirements): If the information is missing from the provided text, DO NOT return empty strings or 0. You MUST use your vast world knowledge of this plugin to estimate a realistic MSRP price in USD, write compelling marketing shortDesc and description, create realistic features, and fill out ALL system requirements and specs realistically.
- KEEP IT CONCISE: The 'shortDesc' MUST be a brief 1-2 sentence hook. The 'description' MUST be a concise summary (max 3 paragraphs). DO NOT translate or include user forum comments, installation tutorials, or generic chatter. Ignore any text that isn't the core product description.

RUTRACKER RULES:
- Title format: "Developer - Plugin Name vX.X.X [VST3/AU/AAX] [WIN/MAC/x64]"
- "Разработчик" = Developer, "что нового" = What's new, "системные требования" = System Requirements
- "Год выпуска" = Release year, "Интерфейс" = Interface language
- Images: look for [IMAGE: url] markers in the content from fastpic.org, radikal, imgur, etc.
- Magnet links: if you see a magnet link (starts with magnet:?), extract it into specs.download_win for Windows, and specs.download_mac for macOS. If platform is unclear, put it in both.
- If proxies failed and you received NO page content: set images to [] and estimate specs from your knowledge.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptContext, isRuTracker } = req.body;
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing VITE_GEMINI_API_KEY environment variable in Vercel.' });
    }

    const userMessage = isRuTracker
      ? `Extract and translate all plugin details from this content. Translate all Russian text to English:\n\n${promptContext}`
      : `Extract plugin details from the following:\n\n${promptContext}`;

    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API Error' });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) return res.status(500).json({ error: "Empty response from Gemini" });

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = JSON.parse(cleaned);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
