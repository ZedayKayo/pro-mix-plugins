// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Header Component
// ═══════════════════════════════════════════════════════

import { getCartCount, on, isLoggedIn, toggleTheme, getTheme, getUser } from '../core/store.js';
import { navigate } from '../core/router.js';
import { debounce } from '../core/utils.js';

export function renderHeader() {
  const cartCount = getCartCount();
  const loggedIn = isLoggedIn();
  const theme = getTheme();

  return `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a href="/" class="header-logo" id="header-logo">
          <img src="/images/logo.png" alt="ProMix" style="height: 38px; width: auto;" />
        </a>

        <nav class="header-nav" id="header-nav">
          <a href="/">Home</a>
          <a href="/store">Store</a>
          <a href="/compare">Compare</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/admin" style="color: var(--neon-orange);">Admin</a>
        </nav>

        <div class="header-search">
          <div class="input-group">
            <span class="search-input-icon">🔍</span>
            <input type="text" class="input search-input" id="header-search-input" placeholder="Search plugins..." />
          </div>
        </div>

        <div class="header-actions">
          <button class="theme-toggle" id="theme-toggle" data-tooltip="Toggle theme" title="Toggle theme">
            ${theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <button class="cart-btn" id="header-cart-btn" title="Shopping Cart">
            🛒
            <span class="cart-badge ${cartCount === 0 ? 'hidden' : ''}" id="cart-badge">${cartCount}</span>
          </button>
          
          ${loggedIn ? `
            <div class="user-credits" title="Your Credit Balance" style="display:flex; align-items:center; gap:4px; font-weight:600; font-size:14px; padding:0 12px; background:var(--bg-tertiary); border:1px solid var(--border-primary); border-radius:var(--radius-md); height:34px; color:var(--neon-green);">
              <span id="header-credits-display">🎁 ${getUser().credits || 0} Credits</span>
            </div>
          ` : ''}

          <button class="btn btn-sm ${loggedIn ? 'btn-ghost' : 'btn-primary'}" id="header-auth-btn">
            ${loggedIn ? '👤 Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  `;
}

export function initHeaderEvents() {
  // Cart button
  const cartBtn = document.getElementById('header-cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => navigate('/cart'));
  }

  // Auth button
  const authBtn = document.getElementById('header-auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      navigate(isLoggedIn() ? '/dashboard' : '/login');
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  // Search
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    const handleSearch = debounce((e) => {
      const query = e.target.value.trim();
      if (query) {
        navigate(`/store?search=${encodeURIComponent(query)}`);
      }
    }, 400);
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          navigate(`/store?search=${encodeURIComponent(query)}`);
        }
      }
    });
  }

  // Listen for cart updates
  on('cart:updated', (cart) => {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = cart.length;
      badge.classList.toggle('hidden', cart.length === 0);
    }
  });

  // Listen for user updates (e.g. credits deducted)
  on('user:updated', (user) => {
    const creditDisplay = document.getElementById('header-credits-display');
    if (creditDisplay && user) {
      creditDisplay.innerHTML = `🎁 ${user.credits || 0} Credits`;
    }
  });
}
