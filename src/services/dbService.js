import { supabase } from '../lib/supabase.js';

// ── AUTH & PROFILES ──
export const loginUserAuth = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return await fetchUserProfile(data.user.id);
};

export const loginWithGoogleAuth = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` }
  });
  if (error) throw error;
};

export const registerUserAuth = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } }
  });
  if (error) throw error;
  // Let the trigger create the profile, wait a heartbeat to fetch
  await new Promise(r => setTimeout(r, 500));
  return await fetchUserProfile(data.user?.id);
};

export const logoutUserAuth = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPasswordAuth = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
};

export const fetchUserProfile = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) console.error("Error fetching profile:", error);
  return data;
};

export const fetchSessionProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return await fetchUserProfile(session.user.id);
  }
  return null;
};

// ── CARTS ──
export const fetchUserCart = async (userIdOrSessionId, isSession = false) => {
  const field = isSession ? 'session_id' : 'user_id';
  const { data, error } = await supabase
    .from('user_carts')
    .select('items')
    .eq(field, userIdOrSessionId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching cart:", error);
  }
  return data ? data.items : [];
};

export const syncUserCart = async (userIdOrSessionId, items, isSession = false) => {
  const field = isSession ? 'session_id' : 'user_id';
  
  const { data } = await supabase.from('user_carts').select('id').eq(field, userIdOrSessionId).maybeSingle();

  if (data) {
    await supabase.from('user_carts').update({ items, updated_at: new Date().toISOString() }).eq(field, userIdOrSessionId);
  } else {
    let insertData = { items };
    insertData[field] = userIdOrSessionId;
    await supabase.from('user_carts').insert([insertData]);
  }
};

export const linkSessionCartToUser = async (sessionId, userId) => {
  const sessionItems = await fetchUserCart(sessionId, true);
  if (sessionItems.length > 0) {
    const userItems = await fetchUserCart(userId, false);
    const merged = [...userItems];
    sessionItems.forEach(item => {
      if (!merged.find(i => i.id === item.id)) merged.push(item);
    });
    await syncUserCart(userId, merged, false);
    await supabase.from('user_carts').delete().eq('session_id', sessionId);
    return merged;
  }
  return null;
};

// ── ORDERS & LICENSES ──
export const fetchUserOrders = async (userId) => {
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('Error fetching orders:', error); return []; }
  return data;
};


// Direct order insert — no RPC, no license keys (we sell digital downloads, not licensed software)
export const processSecureCheckout = async (userId, items, paymentMethod, useCredits) => {
  // Calculate total from item prices
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  let finalTotal = total;
  // credits column is INTEGER — round total up to nearest whole dollar
  const totalInt = Math.ceil(total);

  // Deduct credits if used (1 credit = $1)
  if (useCredits) {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const credits = profile?.credits ?? 0;
    if (credits < totalInt) throw new Error(`Not enough credits. You have $${credits} but need $${totalInt}.`);

    // Deduct — result is always an integer since both are integers
    const { error: deductErr } = await supabase
      .from('profiles')
      .update({ credits: credits - totalInt })
      .eq('id', userId);

    if (deductErr) throw deductErr;
    finalTotal = 0;
  }

  // Insert order (total stored as NUMERIC so we use original float precision)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{
      user_id: userId,
      total: finalTotal,
      payment_method: paymentMethod,
      status: useCredits ? 'completed' : 'pending',
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price }))
    }])
    .select()
    .single();

  if (orderErr) throw orderErr;

  return { success: true, order_id: order.id, total_charged: finalTotal };
};


// ── TELEGRAM SETTINGS ──
export const fetchTelegramSettings = async () => {
  const { data, error } = await supabase.from('telegram_settings').select('*').eq('id', 1).maybeSingle();
  if (error) console.error("Error fetching telegram settings:", error);
  return data || null;
};

export const updateTelegramSettings = async (settings) => {
  const { data, error } = await supabase.from('telegram_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw error;
  return data;
};
