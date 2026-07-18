// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Affiliate Service
// All Supabase queries for the affiliate program
// ═══════════════════════════════════════════════════════

import { supabase } from '../lib/supabase.js';

// ── AFFILIATE PROFILE ──

export const fetchAffiliateByUserId = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('fetchAffiliateByUserId:', error);
  return data;
};

export const fetchAffiliateById = async (affiliateId) => {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*, profiles(name, email)')
    .eq('id', affiliateId)
    .maybeSingle();
  if (error) console.error('fetchAffiliateById:', error);
  return data;
};

export const applyForAffiliate = async ({
  userId, username, bio, websiteUrl, promotionChannel, socialLinks
}) => {
  // Check if already applied
  const existing = await fetchAffiliateByUserId(userId);
  if (existing) return { data: existing, error: null, alreadyApplied: true };

  // Generate unique ref code
  const refCode = await generateUniqueRefCode(username);

  const { data, error } = await supabase
    .from('affiliates')
    .insert([{
      user_id: userId,
      username: username || null,
      ref_code: refCode,
      bio,
      website_url: websiteUrl,
      promotion_channel: promotionChannel,
      social_links: socialLinks || {},
      status: 'pending'
    }])
    .select()
    .single();
  return { data, error };
};

export const updateAffiliateProfile = async (affiliateId, updates) => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ ...updates })
    .eq('id', affiliateId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── STATS ──

export const fetchAffiliateDashboardStats = async (affiliateId) => {
  const { data, error } = await supabase.rpc('get_affiliate_stats', {
    p_affiliate_id: affiliateId
  });
  if (error) { console.error('fetchAffiliateDashboardStats:', error); return null; }
  return data;
};

// ── CLICKS ──

export const fetchAffiliateClicks = async (affiliateId, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('clicked_at, country, device, browser, is_unique, is_flagged, utm_source, referrer_url')
    .eq('affiliate_id', affiliateId)
    .gte('clicked_at', since)
    .order('clicked_at', { ascending: false });
  if (error) { console.error('fetchAffiliateClicks:', error); return []; }
  return data || [];
};

// ── COMMISSIONS ──

export const fetchAffiliateCommissions = async (affiliateId, page = 0, limit = 20) => {
  const { data, error, count } = await supabase
    .from('affiliate_commissions')
    .select('*', { count: 'exact' })
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  if (error) { console.error('fetchAffiliateCommissions:', error); return { data: [], count: 0 }; }
  return { data: data || [], count };
};

// ── PAYOUTS ──

export const fetchAffiliatePayouts = async (affiliateId) => {
  const { data, error } = await supabase
    .from('affiliate_payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAffiliatePayouts:', error); return []; }
  return data || [];
};

// ── NOTIFICATIONS ──

export const fetchAffiliateNotifications = async (affiliateId, limit = 20) => {
  const { data, error } = await supabase
    .from('affiliate_notifications')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchAffiliateNotifications:', error); return []; }
  return data || [];
};

export const markNotificationsRead = async (affiliateId) => {
  await supabase
    .from('affiliate_notifications')
    .update({ is_read: true })
    .eq('affiliate_id', affiliateId)
    .eq('is_read', false);
};

// ── MARKETING ASSETS ──

export const fetchAffiliateAssets = async (type = null) => {
  let query = supabase.from('affiliate_assets').select('*').eq('is_active', true);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { console.error('fetchAffiliateAssets:', error); return []; }
  return data || [];
};

// ── COUPON ──

export const fetchAffiliateCoupon = async (affiliateId) => {
  const { data, error } = await supabase
    .from('affiliate_coupons')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) console.error('fetchAffiliateCoupon:', error);
  return data;
};

export const lookupCouponAffiliate = async (code) => {
  const { data, error } = await supabase
    .from('affiliate_coupons')
    .select('*, affiliates(id, ref_code, commission_pct)')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  if (error) console.error('lookupCouponAffiliate:', error);
  return data;
};

// ── REFERRAL ATTRIBUTION ──

export const attributeSale = async ({
  orderId, affiliateId, orderAmount, productNames, customerEmail, clickId, couponCode
}) => {
  const { data, error } = await supabase.rpc('attribute_affiliate_sale', {
    p_order_id:       orderId,
    p_affiliate_id:   affiliateId,
    p_order_amount:   orderAmount,
    p_product_names:  productNames || null,
    p_customer_email: customerEmail || null,
    p_click_id:       clickId || null,
    p_coupon_code:    couponCode || null,
  });
  if (error) { console.error('attributeSale:', error); return null; }
  return data;
};

// ── CLICK TRACKING ──

export const trackClick = async ({ refCode, landingPage, referrerUrl, utmParams = {}, sessionId }) => {
  try {
    // Use the Vercel API route so we can capture IP server-side
    const res = await fetch('/api/affiliate-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref_code:     refCode,
        landing_page: landingPage,
        referrer_url: referrerUrl,
        session_id:   sessionId,
        ...utmParams,
      })
    });
    const json = await res.json().catch(() => ({}));
    return json;
  } catch (err) {
    // Fail silently — tracking should never break the user experience
    console.warn('affiliate trackClick failed:', err);
    return null;
  }
};

// ── AFFILIATE SETTINGS ──

export const fetchAffiliateSettings = async () => {
  const { data, error } = await supabase
    .from('affiliate_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) console.error('fetchAffiliateSettings:', error);
  return data;
};

export const updateAffiliateSettings = async (settings) => {
  const { data, error } = await supabase
    .from('affiliate_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── ADMIN: ALL AFFILIATES ──

export const fetchAllAffiliates = async ({ status = null, search = '', page = 0, limit = 25 } = {}) => {
  let query = supabase
    .from('affiliates')
    .select('*, profiles(name, email)', { count: 'exact' })
    .order('applied_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (status) query = query.eq('status', status);
  if (search) query = query.or(`username.ilike.%${search}%,ref_code.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) { console.error('fetchAllAffiliates:', error); return { data: [], count: 0 }; }
  return { data: data || [], count };
};

export const approveAffiliate = async (affiliateId) => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null })
    .eq('id', affiliateId)
    .select('*, profiles(email, name)')
    .single();
  if (error) throw error;

  // Notify affiliate
  await supabase.from('affiliate_notifications').insert([{
    affiliate_id: affiliateId,
    type:    'commission_approved',
    title:   '✅ Application Approved!',
    message: 'Congratulations! Your affiliate application has been approved. Start sharing your referral link now.',
  }]);

  return data;
};

export const rejectAffiliate = async (affiliateId, reason = '') => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', affiliateId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('affiliate_notifications').insert([{
    affiliate_id: affiliateId,
    type:    'commission_rejected',
    title:   '❌ Application Not Approved',
    message: reason || 'Your affiliate application was not approved at this time.',
  }]);

  return data;
};

export const suspendAffiliate = async (affiliateId, notes = '') => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status: 'suspended', fraud_notes: notes })
    .eq('id', affiliateId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAffiliateCommissionOverride = async (affiliateId, commissionPct) => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ commission_pct: commissionPct === '' ? null : parseFloat(commissionPct) })
    .eq('id', affiliateId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── ADMIN: COMMISSIONS ──

export const fetchAllCommissions = async ({ status = null, page = 0, limit = 25 } = {}) => {
  let query = supabase
    .from('affiliate_commissions')
    .select('*, affiliates(username, ref_code, profiles(name, email))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) { console.error('fetchAllCommissions:', error); return { data: [], count: 0 }; }
  return { data: data || [], count };
};

export const approveCommission = async (commissionId) => {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', commissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const rejectCommission = async (commissionId, note = '') => {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .update({ status: 'rejected', admin_note: note })
    .eq('id', commissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── ADMIN: PAYOUTS ──

export const processAffiliatePayout = async (affiliateId, commissionIds, txHash = '') => {
  // Calculate total
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('commission_amt')
    .in('id', commissionIds);

  const total = commissions?.reduce((sum, c) => sum + parseFloat(c.commission_amt), 0) || 0;

  // Get affiliate payment info
  const { data: aff } = await supabase
    .from('affiliates')
    .select('payment_method, payment_address')
    .eq('id', affiliateId)
    .single();

  // Create payout record
  const { data: payout, error } = await supabase
    .from('affiliate_payouts')
    .insert([{
      affiliate_id:   affiliateId,
      amount:         total,
      currency:       aff?.payment_method || 'USDT',
      wallet_address: aff?.payment_address || '',
      tx_hash:        txHash,
      commission_ids: commissionIds,
      status:         'sent',
      sent_at:        new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;

  // Mark commissions as paid
  await supabase
    .from('affiliate_commissions')
    .update({ status: 'paid', payout_id: payout.id, paid_at: new Date().toISOString() })
    .in('id', commissionIds);

  // Notify affiliate
  await supabase.from('affiliate_notifications').insert([{
    affiliate_id: affiliateId,
    type:    'payout_sent',
    title:   '💸 Payout Sent!',
    message: `$${total.toFixed(2)} has been sent to your ${aff?.payment_method} wallet.`,
  }]);

  return payout;
};

// ── ADMIN: LEADERBOARD ──

export const fetchAffiliateLeaderboard = async (limit = 10) => {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select(`
      affiliate_id,
      affiliates(username, ref_code, profiles(name))
    `)
    .in('status', ['approved', 'paid'])
    .limit(500);

  if (error) { console.error('fetchAffiliateLeaderboard:', error); return []; }

  // Aggregate in JS
  const map = {};
  (data || []).forEach(c => {
    const id = c.affiliate_id;
    if (!map[id]) {
      map[id] = {
        affiliate_id: id,
        name: c.affiliates?.profiles?.name || c.affiliates?.username || 'Unknown',
        username: c.affiliates?.username || c.affiliates?.ref_code,
        total_revenue: 0,
        total_commissions: 0,
        order_count: 0,
      };
    }
    map[id].order_count++;
  });

  // Get aggregated commission amounts
  const { data: agg } = await supabase
    .from('affiliate_commissions')
    .select('affiliate_id, commission_amt, order_amount')
    .in('status', ['approved', 'paid']);

  (agg || []).forEach(c => {
    const id = c.affiliate_id;
    if (map[id]) {
      map[id].total_revenue += parseFloat(c.order_amount) || 0;
      map[id].total_commissions += parseFloat(c.commission_amt) || 0;
    }
  });

  return Object.values(map)
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
};

// ── ADMIN: CLICK LOGS ──

export const fetchAllClickLogs = async ({ affiliateId = null, flaggedOnly = false, page = 0, limit = 50 } = {}) => {
  let query = supabase
    .from('affiliate_clicks')
    .select('*, affiliates(username, ref_code)', { count: 'exact' })
    .order('clicked_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (affiliateId) query = query.eq('affiliate_id', affiliateId);
  if (flaggedOnly) query = query.eq('is_flagged', true);

  const { data, error, count } = await query;
  if (error) { console.error('fetchAllClickLogs:', error); return { data: [], count: 0 }; }
  return { data: data || [], count };
};

// ── ADMIN: ASSETS ──

export const createAffiliateAsset = async (asset) => {
  const { data, error } = await supabase
    .from('affiliate_assets')
    .insert([asset])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAffiliateAsset = async (assetId) => {
  const { error } = await supabase
    .from('affiliate_assets')
    .delete()
    .eq('id', assetId);
  if (error) throw error;
};

// ── ADMIN: COUPONS ──

export const createAffiliateCoupon = async ({ affiliateId, code, discountPct, usageLimit }) => {
  const { data, error } = await supabase
    .from('affiliate_coupons')
    .insert([{
      affiliate_id: affiliateId,
      code:         code.toUpperCase(),
      discount_pct: discountPct || 10,
      usage_limit:  usageLimit || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── HELPERS ──

async function generateUniqueRefCode(username = '') {
  // Try username-based code first
  if (username && username.length >= 3) {
    const slug = username.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    const { data } = await supabase.from('affiliates').select('id').eq('ref_code', slug).maybeSingle();
    if (!data) return slug;
  }
  // Fallback: AFF + 6 random chars
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let tries = 0;
  do {
    code = 'AFF' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const { data } = await supabase.from('affiliates').select('id').eq('ref_code', code).maybeSingle();
    if (!data) break;
    tries++;
  } while (tries < 10);
  return code;
}

// ── COOKIE HELPERS ──

export function getAffiliateCookie() {
  const match = document.cookie.match(/(?:^|;\s*)pmx_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAffiliateCookie(refCode, durationDays = 30) {
  const expires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `pmx_ref=${encodeURIComponent(refCode)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearAffiliateCookie() {
  document.cookie = 'pmx_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// ── EXPORT HELPERS ──

export function exportCommissionsCSV(commissions) {
  const headers = ['Date', 'Order ID', 'Products', 'Order Amount', 'Commission %', 'Commission $', 'Status'];
  const rows = commissions.map(c => [
    new Date(c.created_at).toLocaleDateString(),
    c.order_id || '',
    c.product_names || '',
    c.order_amount,
    c.commission_pct + '%',
    c.commission_amt,
    c.status,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `promix-commissions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAffiliatesCSV(affiliates) {
  const headers = ['Username', 'Ref Code', 'Email', 'Status', 'Applied At', 'Commission Override', 'Payment Method'];
  const rows = affiliates.map(a => [
    a.username || '',
    a.ref_code || '',
    a.profiles?.email || '',
    a.status,
    new Date(a.applied_at).toLocaleDateString(),
    a.commission_pct ? a.commission_pct + '%' : 'Global',
    a.payment_method || '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `promix-affiliates-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
