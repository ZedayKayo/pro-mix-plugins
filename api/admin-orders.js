import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return res.status(200).json({ orders: orders || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
