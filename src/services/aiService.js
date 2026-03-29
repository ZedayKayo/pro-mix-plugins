// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — AI Data Population Service
// DEV:  Calls Gemini directly using VITE_GEMINI_API_KEY from .env
// PROD: Proxies through the secure Vercel /api/extract-plugin function

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
    shortDesc: { type: "STRING" },
    description: { type: "STRING" },
    features: { type: "ARRAY", items: { type: "STRING" } },
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
- images: ONLY include image URLs explicitly present in the content (ending in .jpg, .png, .webp, .gif). If none found, return [].
- FOR ALL OTHER FIELDS: If missing from the text, use your world knowledge to estimate realistic values. Never return empty strings or 0 for price.
- KEEP IT CONCISE: shortDesc must be 1-2 sentences max (150 chars). description must be max 3 paragraphs. Ignore forum chatter and installation tutorials.

RUTRACKER RULES:
- Title format: "Developer - Plugin Name vX.X.X [VST3/AU/AAX] [WIN/MAC/x64]"
- "Разработчик" = Developer, "что нового" = What's new, "системные требования" = System Requirements
- Images: look for [IMAGE: url] markers from fastpic.org, radikal, imgur, etc.
- Magnet links: extract into specs.download_win (Windows) or specs.download_mac (macOS).
- If proxies failed and you received NO page content: set images to [] and estimate specs from your knowledge.
`;

/**
 * Detect RuTracker URL
 */
function isRuTrackerUrl(input) {
  return input.includes('rutracker.org');
}

/**
 * Given a plugin name, any URL, or a RuTracker link, uses Gemini AI to return structured plugin data.
 * @param {string} input
 * @returns {Promise<Object>}
 */
export async function autoFillPluginData(input) {
  let promptContext = input;
  const isRuTracker = isRuTrackerUrl(input);

  // Try to fetch page content via CORS proxies
  if (input.startsWith('http') || input.startsWith('https')) {
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(input)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(input)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(input)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') || '';
        let rawContent = '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          rawContent = data.contents || data.body || '';
        } else {
          rawContent = await response.text();
        }

        if (rawContent && rawContent.length > 500) {
          const textContent = extractTextFromHtml(rawContent);
          const snippet = textContent.substring(0, 14000);
          promptContext = snippet;
          console.log(`✅ Fetched page via proxy: ${proxyUrl}`);
          break;
        }
      } catch (e) {
        console.warn(`Proxy failed: ${proxyUrl} —`, e.message);
      }
    }
  }

  // ── DUAL MODE ──────────────────────────────────────────────
  // DEV (npm run dev):  Call Gemini directly from the browser.
  //                     Vite cannot run /api serverless functions.
  // PROD (Vercel):      Use the secure /api/extract-plugin proxy.
  // ───────────────────────────────────────────────────────────
  if (import.meta.env.DEV) {
    return await callGeminiDirect(promptContext, isRuTracker);
  } else {
    return await callVercelProxy(promptContext, isRuTracker);
  }
}

/** Calls Gemini API directly – only used in local dev mode */
async function callGeminiDirect(promptContext, isRuTracker) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('Missing VITE_GEMINI_API_KEY in .env file');

  const userMessage = isRuTracker
    ? `Extract and translate all plugin details from this content. Translate all Russian text to English:\n\n${promptContext}`
    : `Extract plugin details from the following:\n\n${promptContext}`;

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
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
    throw new Error(err.error?.message || 'Gemini API Error');
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!rawText) throw new Error('Empty response from Gemini');

  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

/** Proxies through the Vercel serverless function – used in production */
async function callVercelProxy(promptContext, isRuTracker) {
  const response = await fetch('/api/extract-plugin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptContext, isRuTracker })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`AI processing error: ${data.error || response.statusText}`);
  }

  return data;
}

/**
 * Strips HTML tags and scripts to readable text,
 * preserving image URLs as [IMAGE: url] text markers.
 */
function extractTextFromHtml(html) {
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Replace <img> tags with text markers
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src) img.replaceWith(` [IMAGE: ${src}] `);
    });

    // Remove noisy structural elements
    doc.querySelectorAll('script, style, noscript, svg, nav, footer, .header, #page_header, #page_footer, .bottom_info, .pagination').forEach(el => el.remove());

    // For RuTracker: isolate first post body to prevent reading "similar topics" sidebar
    const postBody = doc.querySelector('.post_body, #topic_main .post_wrap:first-child');
    if (postBody) {
      return (postBody.textContent || '').replace(/\s+/g, ' ').trim();
    }

    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Regex fallback
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, ' [IMAGE: $1] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
