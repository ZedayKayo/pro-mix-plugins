// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Global Discount Service
// Single source of truth for the site-wide discount %
// READ  — direct Supabase (public table, anon key fine)
// WRITE — via /api/admin-product (service role, no RLS hangs)
// ═══════════════════════════════════════════════════════

import { supabase } from '../lib/supabase.js';

const LS_KEY = 'promix_discount_pct';
const DEFAULT_DISCOUNT = 70;

let _discountPct = null;
const _listeners = [];

export function onDiscountChanged(fn) {
  _listeners.push(fn);
  return () => { const i = _listeners.indexOf(fn); if (i > -1) _listeners.splice(i, 1); };
}
function _emit(pct) { _listeners.forEach(fn => fn(pct)); }

// ── Getters ────────────────────────────────────────────
export function getDiscountPct() {
  if (_discountPct !== null) return _discountPct;
  const cached = localStorage.getItem(LS_KEY);
  if (cached !== null) return parseFloat(cached) || DEFAULT_DISCOUNT;
  return DEFAULT_DISCOUNT;
}
export function getDiscountMultiplier() { return (100 - getDiscountPct()) / 100; }
export function applyDiscount(msrp) {
  if (!msrp) return 0;
  return Math.round(msrp * getDiscountMultiplier());
}

// ── Load from Supabase (READ — anon key is fine) ───────
export async function loadDiscount() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('discount_pct')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;

    const pct = data?.discount_pct ?? DEFAULT_DISCOUNT;
    _discountPct = pct;
    localStorage.setItem(LS_KEY, String(pct));
    return pct;
  } catch (err) {
    console.warn('[DiscountService] Could not load from Supabase, using cached/default:', err.message);
    _discountPct = parseFloat(localStorage.getItem(LS_KEY)) || DEFAULT_DISCOUNT;
    return _discountPct;
  }
}

// ── Save to Supabase (WRITE — via API, service role) ───
export async function saveDiscount(pct) {
  const clamped = Math.max(1, Math.min(99, Math.round(pct)));

  const res = await fetch('/api/admin-product', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'save-discount', pct: clamped }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

  _discountPct = clamped;
  localStorage.setItem(LS_KEY, String(clamped));
  _emit(clamped);
  return clamped;
}

// ── Bulk-update all product sale prices (WRITE — via API) ─
export async function bulkUpdateSalePrices(discountPct) {
  const pct = Math.max(1, Math.min(99, Math.round(discountPct)));

  const res = await fetch('/api/admin-product', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'bulk-update-prices', pct }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

  return { updated: json.updated ?? 0, skipped: 0 };
}
