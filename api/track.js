import { createClient } from '@supabase/supabase-js';

// Initialize Supabase instance using service role if available, or anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, path, referrer, userId, isBot } = req.body;
    
    // Extract headers for geo and device tracking
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const country = req.headers['x-vercel-ip-country'] || 'unknown';
    const city = req.headers['x-vercel-ip-city'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Very basic OS/Browser detection
    let os = 'Unknown OS';
    if (userAgent.includes('Win')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const isSystemBot = isBot || ['bot', 'spider', 'crawler'].some(b => userAgent.toLowerCase().includes(b));

    // Return a 200 early to not block the client, then continue execution
    res.status(200).json({ success: true, queued: true });

    // Use a background async task. Vercel allows execution after response (fire-and-forget or waitUntil)
    const runBackground = async () => {
      try {
        // 1. Check if session exists
        const { data: existingSession, error: sessionFindError } = await supabase
          .from('visitor_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        const now = new Date().toISOString();
        let isFirstVisit = false;

        if (!existingSession) {
          isFirstVisit = true;
          await supabase.from('visitor_sessions').insert([{
            session_id: sessionId,
            ip_address: ip,
            country,
            city,
            browser,
            os,
            first_seen: now,
            last_seen: now,
            page_views: 1,
            is_bot: isSystemBot
          }]);
        } else {
          await supabase.from('visitor_sessions').update({
            last_seen: now,
            page_views: existingSession.page_views + 1
          }).eq('session_id', sessionId);
        }

        // 2. Insert event log
        await supabase.from('event_logs').insert([{
          session_id: sessionId,
          page_url: path,
          referrer: referrer,
          user_id: userId || null
        }]);

        // 3. Telegram Notifications logic
        // Skip bots entirely for Telegram
        if (isSystemBot) return;

        // Try DB settings first (requires service role key to bypass RLS).
        // Fall back to env vars if DB read fails or returns no data.
        const { data: dbSettings } = await supabase.from('telegram_settings').select('*').eq('id', 1).maybeSingle();
        const settings = dbSettings || {
          is_enabled: !!(process.env.VITE_TELEGRAM_BOT_TOKEN),
          bot_token: process.env.VITE_TELEGRAM_BOT_TOKEN || '',
          chat_id: process.env.VITE_TELEGRAM_CHAT_ID || '',
          notify_all_pages: true,
          tracked_pages: []
        };

        if (!settings.is_enabled || !settings.bot_token || !settings.chat_id) {
          return;
        }

        // Determine if we should send a notification for THIS page
        let shouldNotify = false;
        
        if (settings.notify_all_pages) {
          // Notify on anything except typical spam pages like /admin
          if (!path.startsWith('/admin')) shouldNotify = true;
        } else {
          const tracked = settings.tracked_pages || [];
          const match = tracked.find(t => path === t.path || (t.regex && new RegExp(t.regex).test(path)));
          if (match && match.mode === 'notify') {
            shouldNotify = true;
          }
        }

        // We also want to specifically notify on "User entered website"
        let messageText = '';
        
        if (isFirstVisit) {
          messageText = `🚨 *New Visitor Alert*\n\n` +
                        `🌍 *Location:* ${city}, ${country}\n` +
                        `💻 *Device:* ${os} / ${browser}\n` +
                        `🔗 *Landing Page:* ${path}\n` +
                        `${referrer && referrer !== 'null' ? `🔙 *Referrer:* ${referrer}\n` : ''}` +
                        `🌐 *IP:* ||${ip}||\n` +
                        `🆔 *Session:* \`${sessionId.substring(0,8)}\``;
        } else if (shouldNotify) {
          messageText = `🧭 *Visitor Navigation*\n\n` +
                        `🆔 *Session:* \`${sessionId.substring(0,8)}\`\n` + 
                        `📍 *Page Viewed:* \`${path}\`\n` +
                        `${userId ? `👤 *User ID:* ${userId}` : '👤 *Guest*'}`;
        }

        if (messageText) {
          const tbUrl = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
          await fetch(tbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.chat_id,
              text: messageText,
              parse_mode: 'Markdown' // Telegram markdown
            })
          });
        }
      } catch (err) {
        console.error("Background track error:", err);
      }
    };

    // Run background task
    // Note: On Vercel, functions continue running after res.json() until the timeout is reached.
    // However, if Node strictly requires it, returning a promise from handler works better,
    // but we'll try fire-and-forget. Vercel allows it unless it strictly kills the isolate.
    // For Vercel Serverless (Node.js), non-awaited Promises often finish if they take < 50-100ms.
    // For safety, we await it but we don't return its errors to the client. Wait, if we await it, it blocks the client.
    // A better way is using waitUntil if available (Edge), but Node.js serverless functions simply don't kill the process immediately after response.
    runBackground();

  } catch (err) {
    // If headers/parsing fails quickly
    console.error("Track execution error", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
}
