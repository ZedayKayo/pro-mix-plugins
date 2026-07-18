// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Header Component
// Fix #1: Mobile Hamburger Menu
// Fix #5: Cart button opens drawer (not navigates)
// Fix #15: Admin link hidden for non-admin users
// ═══════════════════════════════════════════════════════

import { getCartCount, on, isLoggedIn, isAdmin, toggleTheme, getTheme, getUser } from '../core/store.js';
import { navigate } from '../core/router.js';
import { debounce } from '../core/utils.js';
import { toggleCartDrawer } from './CartDrawer.js';

let isGlobalHeaderEventsBound = false;

export function renderHeader() {
  const cartCount = getCartCount();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();
  const theme = getTheme();

  return `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a href="/" class="header-logo" id="header-logo">
          <img src="/images/logo.png" alt="ProMix" style="height: 38px; width: auto; max-width: none; object-fit: contain; flex-shrink: 0;" />
        </a>

        <nav class="header-nav" id="header-nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/store">Plugins</a>
          <a href="/bundles">Bundles</a>
          <a href="/blog">Blog</a>
          <a href="/support">Support</a>
          <a href="/about">About</a>
          <a href="/affiliates">Affiliates</a>
          ${loggedIn ? `<a href="/dashboard">Dashboard</a>` : ''}
          ${admin ? `<a href="/admin" style="color: var(--neon-orange);">Admin</a>` : ''}
        </nav>

        <div class="header-actions">
          <button class="cart-btn" id="header-search-btn" title="Search" aria-label="Search store">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          <button class="cart-btn" id="header-cart-btn" title="Shopping Cart" aria-label="Open cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span class="cart-badge ${cartCount === 0 ? 'hidden' : ''}" id="cart-badge" aria-live="polite">${cartCount}</span>
          </button>
          
          ${loggedIn ? `
            <div class="user-credits" title="Your Credit Balance">
              <span id="header-credits-display">💵 $${getUser().credits ?? 0}</span>
            </div>
          ` : ''}

          <button class="btn btn-sm ${loggedIn ? 'btn-ghost' : 'btn-primary'}" id="header-auth-btn" style="border-radius: var(--radius-full);">
            ${loggedIn ? 'Account' : 'Sign In'}
          </button>

          <!-- Mobile hamburger -->
          <button class="hamburger-btn" id="hamburger-btn" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>
      </div>
    </header>
 
    <!-- Mobile Navigation Menu -->
    <div class="mobile-menu-overlay" id="mobile-menu-overlay" aria-hidden="true"></div>
    <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" aria-hidden="true">
      <div class="mobile-menu-header">
        <img src="/images/logo.png" alt="ProMix" style="height:28px; width: auto; max-width: none; object-fit: contain; flex-shrink: 0;" />
        <button class="mobile-menu-close" id="mobile-menu-close" aria-label="Close navigation menu">✕</button>
      </div>

      ${loggedIn ? `
        <div class="mobile-user-profile">
          <div class="mobile-user-info">
            <div class="mobile-avatar">${(getUser().name || getUser().email || '?').charAt(0).toUpperCase()}</div>
            <div class="mobile-user-details">
              <h4>${getUser().name || 'Mix Pro'}</h4>
              <p>${getUser().email}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);border-radius:var(--radius-md);">
            <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Available Credits</span>
            <span id="mobile-credits-display" style="font-weight:700;color:var(--neon-green);font-size:16px;">💵 $${getUser().credits ?? 0}</span>
          </div>
        </div>
      ` : ''}

      <div class="mobile-menu-links">
        <a href="/" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">🏠</span> Home
        </a>
        <a href="/store" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">🔌</span> Plugins
        </a>
        <a href="/bundles" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">📦</span> Bundles
        </a>
        <a href="/blog" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">📰</span> Blog
        </a>
        <a href="/support" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">🎧</span> Support
        </a>
        <a href="/affiliates" class="mobile-nav-link">
          <span class="mobile-nav-link-icon">🤝</span> Affiliates
        </a>
        ${loggedIn ? `
          <a href="/dashboard" class="mobile-nav-link">
            <span class="mobile-nav-link-icon">📊</span> Dashboard
          </a>
          ${admin ? `
            <a href="/admin" class="mobile-nav-link" style="color: var(--neon-orange);">
              <span class="mobile-nav-link-icon">⚡</span> Admin
            </a>
          ` : ''}
        ` : ''}
      </div>
      
      <div class="mobile-menu-footer">
        ${loggedIn ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
            <button class="btn btn-ghost" id="mobile-account-btn" style="padding:10px;">👤 Profile</button>
            <button class="btn btn-ghost" id="mobile-logout-btn" style="padding:10px; color:var(--neon-red);">🚪 Logout</button>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
            <button class="btn btn-primary" style="width:100%; height:46px;" id="mobile-signin-btn">Sign In</button>
            <p style="text-align:center; font-size:12px; color:var(--text-muted); margin-top:8px;">
               Professional tools for modern producers.
            </p>
          </div>
        `}
      </div>
    </nav>
  `;
}

export function initHeaderEvents() {
  // Cart button → open drawer
  const cartBtn = document.getElementById('header-cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => toggleCartDrawer());
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

  // Search icon navigation
  const searchBtn = document.getElementById('header-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      navigate('/store');
      // Adding a small timeout ensures the store page is rendered before trying to focus the search bar
      setTimeout(() => document.getElementById('store-search')?.focus(), 100);
    });
  }



  // ── Mobile Menu ──
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-menu-overlay');
  const mobileClose = document.getElementById('mobile-menu-close');

  function openMobileMenu() {
    mobileMenu?.classList.add('open');
    mobileOverlay?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    mobileOverlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    mobileOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openMobileMenu);
  mobileClose?.addEventListener('click', closeMobileMenu);
  mobileOverlay?.addEventListener('click', closeMobileMenu);

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.getElementById('mobile-signin-btn')?.addEventListener('click', () => {
    closeMobileMenu();
    navigate('/login');
  });

  document.getElementById('mobile-account-btn')?.addEventListener('click', () => {
    closeMobileMenu();
    navigate('/dashboard');
  });

  document.getElementById('mobile-logout-btn')?.addEventListener('click', () => {
    closeMobileMenu();
    logoutUser();
  });

  // ESC closes mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // ── Reactive updates ──
  // Ensure global event listeners are only bound ONCE during the app lifecycle
  if (!isGlobalHeaderEventsBound) {
    on('cart:updated', (cart) => {
      const badge = document.getElementById('cart-badge');
      if (badge) {
        badge.textContent = cart.length;
        badge.classList.toggle('hidden', cart.length === 0);
      }
    });

    on('user:updated', (user) => {
      const creditDisplay = document.getElementById('header-credits-display');
      if (creditDisplay && user) {
        creditDisplay.innerHTML = `💵 $${user.credits ?? 0}`;
      }
      // also patch the mobile menu credit display
      const mobileCredits = document.getElementById('mobile-credits-display');
      if (mobileCredits && user) {
        mobileCredits.innerHTML = `💵 $${user.credits ?? 0}`;
      }
    });

    on('user:login', () => {
      const container = document.getElementById('header-container');
      if (container) {
        container.innerHTML = renderHeader();
        initHeaderEvents();
      }
    });

    on('user:logout', () => {
      const container = document.getElementById('header-container');
      if (container) {
        container.innerHTML = renderHeader();
        initHeaderEvents();
      }
    });

    // ── Scroll Reactive Header ──
    const handleScroll = () => {
      const siteHeader = document.getElementById('site-header');
      if (siteHeader) {
        if (window.scrollY > 20) {
          siteHeader.classList.add('scrolled');
        } else {
          siteHeader.classList.remove('scrolled');
        }
      }
    };
    handleScroll();
    window.addEventListener('scroll', debounce(handleScroll, 10), { passive: true });
    
    isGlobalHeaderEventsBound = true;
  }
}
