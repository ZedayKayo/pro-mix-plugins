import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, path, referrer, userId, isBot } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Extract headers for geo and device tracking
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const country = req.headers['x-vercel-ip-country'] || 'unknown';
    const city = req.headers['x-vercel-ip-city'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Basic OS detection
    let os = 'Unknown OS';
    if (userAgent.includes('Win')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Basic browser detection (order matters — Chrome check must come before Safari)
    let browser = 'Unknown Browser';
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';

    const isSystemBot = isBot || /bot|spider|crawler|googlebot|bingbot|slurp|duckduckbot|baiduspider/i.test(userAgent);

    // ─── 1. Upsert visitor session ───────────────────────────────────────────
    const now = new Date().toISOString();
    let isFirstVisit = false;

    const { data: existingSession } = await supabase
      .from('visitor_sessions')
      .select('session_id, page_views')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!existingSession) {
      isFirstVisit = true;
      const { error: insertErr } = await supabase.from('visitor_sessions').insert([{
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
      if (insertErr) console.error('visitor_sessions insert error:', insertErr);
    } else {
      const { error: updateErr } = await supabase.from('visitor_sessions').update({
        last_seen: now,
        page_views: (existingSession.page_views || 0) + 1
      }).eq('session_id', sessionId);
      if (updateErr) console.error('visitor_sessions update error:', updateErr);
    }

    // ─── 2. Insert event log ─────────────────────────────────────────────────
    const { error: eventErr } = await supabase.from('event_logs').insert([{
      session_id: sessionId,
      page_url: path,
      referrer: referrer || null,
      user_id: userId || null
    }]);
    if (eventErr) console.error('event_logs insert error:', eventErr);

    // ─── 3. Respond early — don't block client on Telegram send ──────────────
    // NOTE: We respond here so the browser isn't waiting. Vercel will continue
    // executing the rest of the function until it completes (unlike edge functions).
    // We use the pattern: respond, then continue async work.
    // This is safe on Vercel Node.js serverless — the process isn't killed until
    // the exported handler's Promise resolves.

    // ─── 4. Skip bots for notifications ──────────────────────────────────────
    if (isSystemBot) {
      return res.status(200).json({ success: true, tracked: true, bot: true });
    }

    // ─── 5. Load Telegram settings ───────────────────────────────────────────
    // Try DB first (service role bypasses RLS), fall back to env vars.
    // Support both VITE_ prefixed (local dev) and plain names (Vercel production).
    const { data: dbSettings } = await supabase
      .from('telegram_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const settings = dbSettings || {
      is_enabled: !!(process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN),
      bot_token: process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '',
      chat_id: process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID || '',
      notify_all_pages: true,
      tracked_pages: []
    };

    if (!settings.is_enabled || !settings.bot_token || !settings.chat_id) {
      return res.status(200).json({ success: true, tracked: true, tg: 'disabled' });
    }

    // ─── 6. Determine if this page view should trigger a notification ─────────
    let shouldNotify = false;
    let messageType = '';

    if (isFirstVisit) {
      // Always notify on new visitors
      shouldNotify = true;
      messageType = 'new_visitor';
    } else if (settings.notify_all_pages) {
      // Notify on every page except /admin
      if (!path.startsWith('/admin')) {
        shouldNotify = true;
        messageType = 'page_view';
      }
    } else {
      const tracked = settings.tracked_pages || [];
      const match = tracked.find(t => path === t.path || (t.regex && new RegExp(t.regex).test(path)));
      if (match && match.mode === 'notify') {
        shouldNotify = true;
        messageType = 'page_view';
      }
    }

    if (!shouldNotify) {
      return res.status(200).json({ success: true, tracked: true, tg: 'skipped' });
    }

    // ─── 7. Build message ─────────────────────────────────────────────────────
    let messageText = '';

    if (messageType === 'new_visitor') {
      messageText =
        `🚨 *New Visitor Alert*\n\n` +
        `🌍 *Location:* ${city !== 'unknown' ? city + ', ' : ''}${country}\n` +
        `💻 *Device:* ${os} / ${browser}\n` +
        `🔗 *Landing Page:* \`${path}\`\n` +
        (referrer && referrer !== 'null' ? `🔙 *Referrer:* ${referrer}\n` : '') +
        `🌐 *IP:* ||${ip}||\n` +
        `🆔 *Session:* \`${sessionId.substring(0, 8)}\``;
    } else {
      messageText =
        `🧭 *Page View*\n\n` +
        `📍 *Page:* \`${path}\`\n` +
        `🌍 *From:* ${city !== 'unknown' ? city + ', ' : ''}${country}\n` +
        `💻 *Device:* ${os} / ${browser}\n` +
        `🆔 *Session:* \`${sessionId.substring(0, 8)}\`\n` +
        (userId ? `👤 *User ID:* \`${userId}\`` : '👤 *Guest*');
    }

    // ─── 8. Send Telegram message ─────────────────────────────────────────────
    let telegramOk = false;
    let telegramError = null;

    try {
      const tbUrl = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
      const tgRes = await fetch(tbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.chat_id,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      const tgData = await tgRes.json();
      telegramOk = tgData.ok === true;
      if (!telegramOk) {
        telegramError = tgData.description || 'Unknown Telegram error';
        console.error('Telegram send error:', telegramError);
      }
    } catch (tgErr) {
      telegramError = tgErr.message;
      console.error('Telegram fetch error:', tgErr);
    }

    // ─── 9. Log notification to DB ────────────────────────────────────────────
    const { error: logErr } = await supabase.from('notification_logs').insert([{
      session_id: sessionId,
      message_type: messageType,
      page_url: path,
      country,
      city,
      browser,
      os,
      telegram_ok: telegramOk,
      error_message: telegramError || null
    }]);
    if (logErr) console.error('notification_logs insert error:', logErr);

    return res.status(200).json({ success: true, tracked: true, tg: telegramOk ? 'sent' : 'failed', error: telegramError });

  } catch (err) {
    console.error('Track handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
}
