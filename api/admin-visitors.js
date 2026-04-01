import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: sessions, error } = await supabase
      .from('visitor_sessions')
      .select('*')
      .eq('is_bot', false)
      .order('last_seen', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Get page view stats
    const { data: events } = await supabase
      .from('event_logs')
      .select('page_url, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    // Aggregate page counts
    const pageCounts = {};
    (events || []).forEach(e => {
      const key = e.page_url || '/';
      pageCounts[key] = (pageCounts[key] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    return res.status(200).json({ sessions: sessions || [], topPages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
