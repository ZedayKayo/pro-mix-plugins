// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Global State Store (Supabase + localStorage cache)
// ═══════════════════════════════════════════════════════

const STORAGE_KEYS = {
  CART: 'promix_cart',
  USER: 'promix_user',
  PURCHASES: 'promix_purchases',
  THEME: 'promix_theme',
  CUSTOM_PRODUCTS: 'promix_custom_products',
  HIDDEN_PRODUCTS: 'promix_hidden_products',
};

// Import Supabase service
import { fetchProducts, insertProduct, updateProduct, removeProduct } from '../services/productService.js';
import { fetchUserCart, syncUserCart, linkSessionCartToUser, fetchUserOrders, fetchSessionProfile, loginUserAuth, loginWithGoogleAuth, registerUserAuth, logoutUserAuth, resetPasswordAuth, processSecureCheckout } from '../services/dbService.js';
import { supabase } from '../lib/supabase.js';
import { loadDiscount } from '../services/discountService.js';

// Supabase is the single source of truth — no static defaults

const listeners = {};
let memoryInventory = [];
let memoryCart = [];
let memoryUser = null;
let memoryPurchases = [];
let initDone = false;

function emit(event, data) {
  if (listeners[event]) {
    listeners[event].forEach(fn => fn(data));
  }
}

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter(fn => fn !== callback);
  };
}

// ── Session ──
function getSessionId() {
  let sid = localStorage.getItem('promix_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + Math.random().toString(36).substring(2);
    localStorage.setItem('promix_session', sid);
  }
  return sid;
}

// ── Inventory Management (Supabase) ──
export async function loadInventory() {
  try {
    const data = await fetchProducts();
    // Supabase is the single source of truth — no auto-seeding from static files
    memoryInventory = data;
    emit('inventory:updated', memoryInventory);
  } catch (err) {
    console.error("Failed to load inventory from Supabase", err);
  }
}

export function getInventory() {
  return memoryInventory;
}

export async function saveProduct(product) {
  const isExisting = memoryInventory.some(p => p.id == product.id);
  // Snapshot for rollback — capture the original product before overwriting
  const originalProduct = isExisting ? memoryInventory.find(p => p.id == product.id) : null;

  if (isExisting) {
    memoryInventory = memoryInventory.map(p => p.id == product.id ? product : p);
  } else {
    memoryInventory = [product, ...memoryInventory];
  }
  emit('inventory:updated', memoryInventory);

  try {
    if (isExisting) {
      await updateProduct(product);
    } else {
      await insertProduct(product);
    }
  } catch (err) {
    console.error("Failed to save product to Supabase", err);
    // Rollback the optimistic update — restore prior state for both create and edit
    if (isExisting && originalProduct) {
      // Edit failed — restore the original product data
      memoryInventory = memoryInventory.map(p => p.id == product.id ? originalProduct : p);
    } else if (!isExisting) {
      // Create failed — remove the optimistically added product
      memoryInventory = memoryInventory.filter(p => p.id != product.id);
    }
    emit('inventory:updated', memoryInventory);
    throw err;
  }
}

export async function deleteProduct(productId) {
  // Snapshot for rollback in case Supabase delete fails
  const snapshot = [...memoryInventory];

  memoryInventory = memoryInventory.filter(p => p.id != productId);
  removeFromCart(productId);
  emit('inventory:updated', memoryInventory);

  try {
    await removeProduct(productId);
  } catch (err) {
    console.error("Failed to delete product from Supabase", err);
    // Rollback the optimistic removal so UI stays in sync with DB
    memoryInventory = snapshot;
    emit('inventory:updated', memoryInventory);
    throw err; // propagate so the admin panel can show an error toast
  }
}

// ── Cart ──
export function getCart() {
  if (!initDone) {
    try { memoryCart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || []; } catch { memoryCart = []; }
  }
  return memoryCart;
}

export function addToCart(product) {
  const cart = getCart();
  if (cart.find(item => item.id === product.id)) return false;

  cart.push({
    id: product.id, name: product.name, slug: product.slug,
    price: product.salePrice || product.price, originalPrice: product.price,
    image: product.images[0], category: product.category, cryptoPrices: product.cryptoPrices,
  });
  
  memoryCart = cart;
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  
  const user = getUser();
  syncUserCart(user ? user.id : getSessionId(), cart, !user).catch(console.error);

  emit('cart:updated', cart);
  emit('cart:added', product);
  return true;
}

export function removeFromCart(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  memoryCart = cart;
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  
  const user = getUser();
  syncUserCart(user ? user.id : getSessionId(), cart, !user).catch(console.error);
  
  emit('cart:updated', cart);
  return cart;
}

export function clearCart() {
  memoryCart = [];
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  const user = getUser();
  syncUserCart(user ? user.id : getSessionId(), [], !user).catch(console.error);
  emit('cart:updated', []);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price, 0);
}

export function getCartCount() {
  return getCart().length;
}

export function isInCart(productId) {
  return getCart().some(item => item.id === productId);
}

// ── User ──
export function getUser() {
  if (!initDone && !memoryUser) {
    try { memoryUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)); } catch { memoryUser = null; }
  }
  return memoryUser;
}

export async function loginUserAsync(email, password) {
  const userProfile = await loginUserAuth(email, password);
  return await handleUserHydration(userProfile);
}

export function loginUser(email, password) {
  return loginUserAsync(email, password);
}

export async function loginWithGoogleUser() {
  return await loginWithGoogleAuth();
}

export async function registerUserAsync(email, password, name) {
  const userProfile = await registerUserAuth(email, password, name);
  return await handleUserHydration(userProfile);
}

export function registerUser(email, password, name) {
  return registerUserAsync(email, password, name);
}

export async function resetPasswordUser(email) {
  return await resetPasswordAuth(email);
}

async function handleUserHydration(userProfile) {
  if (!userProfile) return null;
  memoryUser = userProfile;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));

  const mergedCart = await linkSessionCartToUser(getSessionId(), userProfile.id);
  const dbCart = mergedCart || await fetchUserCart(userProfile.id, false);
  if (dbCart) {
    memoryCart = dbCart;
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(dbCart));
    emit('cart:updated', dbCart);
  }

  const orders = await fetchUserOrders(userProfile.id);
  if (orders) {
    memoryPurchases = orders;
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(orders));
    emit('purchases:updated', orders);
  }

  emit('user:login', userProfile);
  return userProfile;
}

export function deductCredits(amount) {
  // Handled entirely by processSecureCheckout now!
  return false;
}

export function clearLocalUser() {
  if (!memoryUser) return;
  memoryUser = null;
  memoryCart = [];
  memoryPurchases = [];
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
  emit('user:logout', null);
  emit('cart:updated', []);
  emit('purchases:updated', []);
}

export async function logoutUserAuthAsync() {
  // Race Supabase signOut against a 4s timeout.
  // If Supabase hangs (network issue, stale session), we force-clear locally
  // and let onAuthStateChange clean up when connectivity returns.
  try {
    await Promise.race([
      logoutUserAuth(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('signout timeout')), 4000))
    ]);
  } catch (err) {
    // Timeout or network error — clear locally anyway so the user isn't stuck
    console.warn('Supabase signout fallback (forced clear):', err.message);
  }
  clearLocalUser();
}

export function logoutUser() {
  logoutUserAuthAsync();
}

export function isLoggedIn() {
  return !!getUser();
}

export function isAdmin() {
  const user = getUser();
  if (!user) return false;
  return user.role === 'admin' || user.is_admin === true;
}


// ── Purchases & Licenses ──
export function getPurchases() {
  if (!initDone && memoryPurchases.length === 0) {
    try { memoryPurchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || []; } catch { memoryPurchases = []; }
  }
  return memoryPurchases;
}

export function getLicenses() {
  return [];
}

export async function addPurchaseAsync(items, paymentMethod, useCredits) {
  const user = getUser();
  if (!user) throw new Error('Must be logged in to purchase');

  const result = await processSecureCheckout(user.id, items, paymentMethod, useCredits);

  if (result.success) {
    // Re-fetch fresh profile from Supabase so credits balance is immediately accurate
    const freshProfile = await fetchSessionProfile();
    if (freshProfile) {
      memoryUser = freshProfile;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshProfile));
      emit('user:updated', freshProfile);  // updates header credit badge instantly
    }

    // Refresh orders list
    const orders = await fetchUserOrders(user.id);
    if (orders) {
      memoryPurchases = orders;
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(orders));
      emit('purchases:updated', orders);
    }

    emit('purchase:completed', result);
    return result;
  }
  throw new Error('Checkout failed');
}

export function hasPurchased(productId) {
  return memoryPurchases.some(p =>
    (p.items || []).some(i => i.id === productId)
  );
}

// ── Theme ──
export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  document.documentElement.setAttribute('data-theme', theme);
  emit('theme:changed', theme);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// ── Init ──
export async function initStore() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  // Load discount % first so all pricing calculations are correct
  await loadDiscount();

  await loadInventory();

  // Load existing state from DB via Auth session
  const profile = await fetchSessionProfile();
  if (profile) {
    try {
      await handleUserHydration(profile);
    } catch (e) {
      console.error("Error hydrating state from Supabase on init", e);
    }
  } else {
    // load anon cart
    try {
      const anonCart = await fetchUserCart(getSessionId(), true);
      if (anonCart && anonCart.length > 0) {
        memoryCart = anonCart;
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(anonCart));
      }
    } catch(e) {}
  }

  // Set up auth state listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      const p = await fetchSessionProfile();
      if (p) await handleUserHydration(p);
    } else if (event === 'SIGNED_OUT') {
      clearLocalUser();
    }
  });

  initDone = true;
  emit('store:ready');
}

// Trigger initial prep logic on first load immediately
// (The actual async parts resolve later without blocking)
const initialTheme = getTheme();
document.documentElement.setAttribute('data-theme', initialTheme);
