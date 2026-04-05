// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Bundles Page
// ═══════════════════════════════════════════════════════

import { getProducts } from '../data/products.js';
import { navigate } from '../core/router.js';
import { formatPrice } from '../core/utils.js';
import { addToCart } from '../core/store.js';
import { getDiscountPct } from '../services/discountService.js';

const BUNDLE_ACCENTS = [
  'linear-gradient(135deg, #00ff88, #00d4ff)',
  'linear-gradient(135deg, #ff6b2b, #ff3b5c)',
  'linear-gradient(135deg, #a855f7, #00d4ff)',
  'linear-gradient(135deg, #f9c74f, #f3722c)',
  'linear-gradient(135deg, #4cc9f0, #4361ee)',
  'linear-gradient(135deg, #e040fb, #00e5ff)',
];

const BUNDLE_EMOJIS = ['📦', '🎛️', '🎚️', '🔊', '🎹', '⚡'];

export function renderBundlesPage() {
  const container = document.getElementById('page-content');
  const discountPct = getDiscountPct();

  const all = getProducts();
  const bundles = all.filter(p => p.category === 'bundle');

  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Save More
        </span>
        <h1>Plugin Bundles</h1>
        <p>Get multiple industry-standard plugins in one deal — already ${discountPct}% off retail, bundles save you even more.</p>
      </div>
    </div>

    <!-- Trust bar -->
    <div style="background:var(--bg-secondary);border-top:1px solid var(--border-primary);border-bottom:1px solid var(--border-primary);padding:var(--space-md) 0;margin-bottom:var(--space-3xl);">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-2xl);flex-wrap:wrap;">
          ${[
            ['⚡', 'Instant Digital Delivery'],
            ['🔐', 'Lifetime License Included'],
            ['✅', 'All Formats: VST3, AU, AAX'],
            ['🌍', 'Works with Any Major DAW'],
          ].map(([icon, label]) => `
          <span style="display:flex;align-items:center;gap:8px;font-size:var(--text-sm);color:var(--text-secondary);font-weight:500;">
            <span>${icon}</span> ${label}
          </span>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="section" style="padding-top:0;">
      <div class="container">

        ${bundles.length === 0 ? `
        <div style="text-align:center;padding:var(--space-3xl);">
          <div style="font-size:64px;margin-bottom:var(--space-lg);">📦</div>
          <h2 style="margin-bottom:var(--space-md);">Bundles Coming Soon</h2>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);">We're putting together some incredible bundles. Check back soon or browse individual plugins.</p>
          <a href="/store" class="btn btn-primary">Browse All Plugins</a>
        </div>
        ` : `
        <div class="bundles-grid" id="bundles-grid">
          ${bundles.map((bundle, i) => {
            const accent = BUNDLE_ACCENTS[i % BUNDLE_ACCENTS.length];
            const emoji = BUNDLE_EMOJIS[i % BUNDLE_EMOJIS.length];
            const salePrice = bundle.salePrice ?? bundle.price;
            const originalPrice = bundle.price;
            const savePct = originalPrice > 0 ? Math.round((1 - salePrice / originalPrice) * 100) : 0;
            const pluginCount = bundle.shortDesc || 'Multiple plugins';
            return `
            <div class="bundle-card animate-fade-in-up" data-slug="${bundle.slug}" style="--bundle-accent:${accent};">
              <div class="bundle-card-img" style="background:linear-gradient(135deg,rgba(0,255,136,0.05),rgba(0,0,0,0.5));">
                <span style="font-size:72px;position:relative;z-index:2;">${emoji}</span>
              </div>
              <div class="bundle-card-body">
                <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-xs);">
                  <span class="badge badge-orange">Bundle</span>
                  ${savePct > 0 ? `<span class="bundle-save-badge">Save ${savePct}%</span>` : ''}
                </div>
                <div class="bundle-card-title">${bundle.name}</div>
                <div class="bundle-card-sub">${pluginCount}</div>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-md);">${bundle.shortDesc || bundle.description?.slice(0, 120) || 'Complete plugin bundle for professional audio production.'}</p>
                <div class="bundle-card-plugins">
                  <span class="bundle-plugin-tag">VST3</span>
                  <span class="bundle-plugin-tag">AU</span>
                  <span class="bundle-plugin-tag">AAX</span>
                  <span class="bundle-plugin-tag">Win + Mac</span>
                  <span class="bundle-plugin-tag">Lifetime License</span>
                </div>
                <div class="bundle-card-footer">
                  <div class="bundle-price-block">
                    ${originalPrice > 0 && originalPrice !== salePrice ? `<div class="bundle-price-original">${formatPrice(originalPrice)} retail</div>` : ''}
                    <div class="bundle-price-sale">${salePrice > 0 ? formatPrice(salePrice) : 'Free'}</div>
                  </div>
                  <div style="display:flex;gap:var(--space-sm);">
                    <button class="btn btn-ghost btn-sm bundle-details-btn" data-slug="${bundle.slug}">Details</button>
                    <button class="btn btn-primary btn-sm bundle-cart-btn" data-slug="${bundle.slug}">Add to Cart</button>
                  </div>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
        `}

        <!-- Value CTA -->
        <div style="margin-top:var(--space-3xl);background:linear-gradient(135deg,rgba(255,107,43,0.07),rgba(255,59,92,0.04));border:1px solid rgba(255,107,43,0.15);border-radius:var(--radius-xl);padding:var(--space-3xl);text-align:center;">
          <span style="font-size:48px;display:block;margin-bottom:var(--space-md);">💡</span>
          <h2 style="margin-bottom:var(--space-md);">Don't see the bundle you need?</h2>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);max-width:500px;margin-left:auto;margin-right:auto;">Browse our full catalog of 200+ individual plugins and build your own collection at up to ${discountPct}% off retail.</p>
          <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap;">
            <a href="/store" class="btn btn-primary">Browse All Plugins</a>
            <a href="/contact" class="btn btn-ghost">Request a Custom Bundle</a>
          </div>
        </div>

      </div>
    </div>
  `;

  // Bundle navigation events
  document.querySelectorAll('.bundle-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate(`/product/${btn.dataset.slug}`);
    });
  });

  document.querySelectorAll('.bundle-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bundle = getProducts().find(p => p.slug === btn.dataset.slug);
      if (bundle) {
        addToCart(bundle);
        import('../components/Toast.js').then(({ showToast }) => {
          showToast(`${bundle.name} added to cart!`, 'success');
        });
      }
    });
  });

  document.querySelectorAll('.bundle-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      navigate(`/product/${card.dataset.slug}`);
    });
  });
}
