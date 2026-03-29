// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — AI Data Population Service




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

  // Call Vercel Serverless Function to securely handle AI generation
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
