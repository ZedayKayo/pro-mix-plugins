// ═══════════════════════════════════════════════════════
// PRO-MIX — Wishlist & Recently Viewed (localStorage)
// ═══════════════════════════════════════════════════════

const WL_KEY = 'pmx_wishlist';
const RV_KEY = 'pmx_recent';

// ── Wishlist ─────────────────────────────────────────
export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
  catch { return []; }
}

export function isWishlisted(id) {
  return getWishlist().includes(id);
}

export function toggleWishlist(id) {
  const wl = getWishlist();
  const idx = wl.indexOf(id);
  if (idx === -1) { wl.push(id); }
  else { wl.splice(idx, 1); }
  localStorage.setItem(WL_KEY, JSON.stringify(wl));
  return idx === -1; // true = was added
}

// ── Recently Viewed ───────────────────────────────────
export function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}

export function addRecentlyViewed(id) {
  const rv = getRecentlyViewed().filter(x => x !== id);
  rv.unshift(id);
  localStorage.setItem(RV_KEY, JSON.stringify(rv.slice(0, 8)));
}
