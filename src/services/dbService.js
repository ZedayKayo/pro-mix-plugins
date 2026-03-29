import { supabase } from '../lib/supabase.js';

// ── AUTH & PROFILES ──
export const loginUserAuth = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return await fetchUserProfile(data.user.id);
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
  if (error) { console.error("Error fetching orders:", error); return []; }
  return data;
};

export const fetchUserLicenses = async (userId) => {
  const { data, error } = await supabase.from('licenses').select('*, products(name, images)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error("Error fetching licenses:", error); return []; }
  return data;
};

// Instead of insertOrder, we use the secure RPC checkout checkout_cart
export const processSecureCheckout = async (userId, items, paymentMethod, useCredits) => {
  const { data, error } = await supabase.rpc('checkout_cart', {
    p_user_id: userId,
    p_items: items,
    p_payment_method: paymentMethod,
    p_use_credits: useCredits
  });
  
  if (error) throw error;
  return data;
};
