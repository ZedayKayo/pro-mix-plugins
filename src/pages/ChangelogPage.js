// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Changelog / Release Notes Page
// ═══════════════════════════════════════════════════════

const RELEASES = [
  {
    version: 'v2.4.0',
    date: 'April 3, 2026',
    type: 'major',
    dotColor: 'green',
    headline: 'Navigation & Content Expansion',
    added: [
      'Blog & Tutorials section with mixing and production guides',
      'Dedicated Bundles showcase page with savings breakdown',
      'Affiliates program page with sign-up form',
      'Changelog & release notes page (this page)',
      'Fully redesigned About, FAQ, and Support pages',
    ],
    improved: [
      'Navigation restructured with all key pages surfaced',
      'Info-pages CSS overhaul for consistent premium styling',
      'Mobile nav updated with all new routes',
    ],
    fixed: [
      'About page previously showed minimal placeholder content',
      'FAQ lacked accordion interaction and category filtering',
    ],
    removed: [],
  },
  {
    version: 'v2.3.0',
    date: 'March 28, 2026',
    type: 'major',
    dotColor: 'green',
    headline: 'Responsive Storefront & Checkout',
    added: [
      'Full mobile responsiveness across all core pages',
      'Media queries for Product, Store, Dashboard, Cart, and Order Success',
      'Order success page complete redesign with animated confirmation',
    ],
    improved: [
      'Cart drawer now fully responsive on mobile',
      'Header hamburger menu animations smoothed',
      'DAW-themed dark aesthetic consistent across checkout flow',
    ],
    fixed: [
      'Checkout page layout breaking on screens < 480px',
      'Cart badge overlapping on small viewports',
      'Product image aspect ratio inconsistency on grid view',
    ],
    removed: [],
  },
  {
    version: 'v2.2.0',
    date: 'March 20, 2026',
    type: 'major',
    dotColor: 'green',
    headline: 'Professional Credit Card Checkout',
    added: [
      'Multi-step card checkout with contact, card details, and 3DS verification',
      'Real-time card number formatting and Luhn validation',
      'Stripe-inspired payment method selection UI',
      'Declined / Success result page variants',
      'Credit balance display in header and mobile menu',
    ],
    improved: [
      'Checkout flow now unified under dark DAW theme',
      'Payment method switching between crypto and card',
    ],
    fixed: [
      'Card input masking incorrectly triggering on backspace',
      'Expiry date validation allowing past dates',
    ],
    removed: [],
  },
  {
    version: 'v2.1.0',
    date: 'March 12, 2026',
    type: 'minor',
    dotColor: 'blue',
    headline: 'Plugin Comparison Tool',
    added: [
      'Side-by-side plugin comparison (up to 3 plugins)',
      'Compare bar floating at bottom of store grid',
      'Comparison detail page with spec tables and rating diff',
    ],
    improved: [
      'Store page filter bar with sticky behavior',
      'Product cards include a "compare" toggle button',
    ],
    fixed: [
      'Compare session state not persisting between page navigations',
    ],
    removed: [],
  },
  {
    version: 'v2.0.0',
    date: 'February 28, 2026',
    type: 'major',
    dotColor: 'green',
    headline: 'Full Platform Relaunch',
    added: [
      'Complete SPA rewrite using Vite + Vanilla JS',
      'Supabase backend with real-time inventory sync',
      'Google OAuth and email authentication',
      'Admin panel with user management, orders, and analytics tabs',
      'Crypto checkout with BTC, ETH, USDT support',
      'MoonPay / Coinbase Commerce integration',
      'Telegram bot notifications for new orders',
      'Visitor analytics with session tracking',
    ],
    improved: [
      'Full dark DAW-inspired design system with CSS variables',
      'Product catalog expanded to 200+ plugins from top developers',
    ],
    fixed: [],
    removed: [
      'Legacy PHP backend',
      'Static HTML pages',
    ],
  },
  {
    version: 'v1.3.2',
    date: 'January 15, 2026',
    type: 'patch',
    dotColor: 'orange',
    headline: 'Bug Fixes & Performance',
    added: [],
    improved: [
      'Page load time reduced by ~40% via lazy loading',
    ],
    fixed: [
      'Product images failing to load on slow connections',
      'Cart quantity not persisting after page refresh',
      'Footer links pointing to wrong anchors',
    ],
    removed: [],
  },
];

const TYPE_MAP = {
  major: { label: 'Major Release', cls: 'major' },
  minor: { label: 'Minor Release', cls: 'minor' },
  patch: { label: 'Patch', cls: 'patch' },
};

export function renderChangelogPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          What's New
        </span>
        <h1>Platform Changelog</h1>
        <p>Every update, improvement, and bug fix — transparent and versioned.</p>
      </div>
    </div>

    <div class="section">
      <div class="container container-narrow">
        <div class="changelog-timeline animate-fade-in-up">
          ${RELEASES.map(release => {
            const type = TYPE_MAP[release.type];
            return `
            <div class="changelog-entry">
              <div class="changelog-dot ${release.dotColor}"></div>
              <div class="changelog-header">
                <span class="changelog-version">${release.version}</span>
                <span class="changelog-date">${release.date}</span>
                <span class="changelog-type-badge ${type.cls}">${type.label}</span>
              </div>
              ${release.headline ? `<p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-md);">${release.headline}</p>` : ''}
              <div class="changelog-body">
                ${release.added.length ? `
                <div class="changelog-section">
                  <div class="changelog-section-label added">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Added
                  </div>
                  <ul class="changelog-items">
                    ${release.added.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
                ${release.improved.length ? `
                <div class="changelog-section">
                  <div class="changelog-section-label improved">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    Improved
                  </div>
                  <ul class="changelog-items">
                    ${release.improved.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
                ${release.fixed.length ? `
                <div class="changelog-section">
                  <div class="changelog-section-label fixed">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    Fixed
                  </div>
                  <ul class="changelog-items">
                    ${release.fixed.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
                ${release.removed.length ? `
                <div class="changelog-section">
                  <div class="changelog-section-label removed">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Removed
                  </div>
                  <ul class="changelog-items">
                    ${release.removed.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <div style="text-align:center;margin-top:var(--space-3xl);padding:var(--space-xl);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);">
          <p style="color:var(--text-secondary);margin-bottom:var(--space-md);">Found a bug or have a feature request?</p>
          <a href="/support" class="btn btn-primary">Contact Support</a>
        </div>
      </div>
    </div>
  `;
}
