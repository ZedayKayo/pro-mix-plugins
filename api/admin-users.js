import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Fetch all profiles (service role bypasses RLS)
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, name, email, credits, created_at')
        .order('created_at', { ascending: false });

      if (profilesErr) throw profilesErr;

      // Fetch order counts + totals per user in one query
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('user_id, total, status, created_at');

      if (ordersErr) throw ordersErr;

      // Merge: attach order stats to each profile
      const orderMap = {};
      (orders || []).forEach(o => {
        if (!orderMap[o.user_id]) {
          orderMap[o.user_id] = { count: 0, total: 0, lastOrder: null };
        }
        orderMap[o.user_id].count += 1;
        orderMap[o.user_id].total += parseFloat(o.total) || 0;
        if (!orderMap[o.user_id].lastOrder || o.created_at > orderMap[o.user_id].lastOrder) {
          orderMap[o.user_id].lastOrder = o.created_at;
        }
      });

      const users = (profiles || []).map(p => ({
        ...p,
        orderCount: orderMap[p.id]?.count || 0,
        totalSpent: orderMap[p.id]?.total || 0,
        lastOrder: orderMap[p.id]?.lastOrder || null,
      }));

      return res.status(200).json({ users });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, userId, amount } = req.body;
      if (action === 'add_credits') {
        if (!userId || typeof amount !== 'number') return res.status(400).json({ error: 'Missing userId or invalid amount' });

        // Retrieve current credits explicitly since Supabase `rpc` might be needed for true atomic increments,
        // but since we are Admin using Server Role, we can fetch, evaluate, and patch.
        const { data: profile, error: getErr } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        if (getErr) throw getErr;

        const newCredits = (profile.credits || 0) + amount;

        const { error: updErr } = await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
        if (updErr) throw updErr;

        return res.status(200).json({ success: true, newCredits });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
