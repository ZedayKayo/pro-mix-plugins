import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

  if (req.method === 'PUT') {
    try {
      const { order_id, status } = req.body;
      if (!order_id || !status) return res.status(400).json({ error: 'Missing order_id or status' });

      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order_id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, order: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
