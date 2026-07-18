// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Affiliate Click Tracker (Vercel)
// POST /api/affiliate-track
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const {
    ref_code, landing_page, referrer_url, session_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  } = req.body || {};

  if (!ref_code) {
    return res.status(400).json({ error: 'ref_code is required' });
  }

  // Extract IP
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '';

  // Parse User-Agent for device/browser/OS
  const ua = req.headers['user-agent'] || '';
  const device  = detectDevice(ua);
  const browser = detectBrowser(ua);
  const os      = detectOS(ua);

  // Geo-locate IP (free, no API key needed)
  let country = '', city = '';
  try {
    if (ip && ip !== '::1' && !ip.startsWith('127.')) {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, {
        signal: AbortSignal.timeout(2000),
      });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === 'success') {
          country = geo.country || '';
          city    = geo.city    || '';
        }
      }
    }
  } catch {
    // Geo lookup is optional — continue without it
  }

  // Call the RPC to record the click
  const { data, error } = await supabase.rpc('track_affiliate_click', {
    p_ref_code:     ref_code,
    p_ip_address:   ip,
    p_country:      country,
    p_city:         city,
    p_device:       device,
    p_browser:      browser,
    p_os:           os,
    p_referrer_url: referrer_url || '',
    p_landing_page: landing_page || '',
    p_utm_source:   utm_source   || null,
    p_utm_medium:   utm_medium   || null,
    p_utm_campaign: utm_campaign || null,
    p_utm_content:  utm_content  || null,
    p_utm_term:     utm_term     || null,
    p_session_id:   session_id   || null,
  });

  if (error) {
    console.error('affiliate-track RPC error:', error);
    return res.status(200).json({ success: false, error: error.message });
  }

  return res.status(200).json(data || { success: false });
}

// ── User-Agent parsers ──

function detectDevice(ua) {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua) {
  if (/edg\//i.test(ua))     return 'Edge';
  if (/opr\//i.test(ua))     return 'Opera';
  if (/chrome/i.test(ua))    return 'Chrome';
  if (/firefox/i.test(ua))   return 'Firefox';
  if (/safari/i.test(ua))    return 'Safari';
  if (/msie|trident/i.test(ua)) return 'IE';
  return 'Other';
}

function detectOS(ua) {
  if (/windows/i.test(ua))  return 'Windows';
  if (/macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua))    return 'Linux';
  if (/android/i.test(ua))  return 'Android';
  if (/iphone|ipad/i.test(ua)) return 'iOS';
  return 'Other';
}
