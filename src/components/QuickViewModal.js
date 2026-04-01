// ═══════════════════════════════════════════════════════
// PRO-MIX — Quick View Modal Component
// ═══════════════════════════════════════════════════════

import { formatPrice, renderStars, getCategoryName, sanitizeHTML, getPluginImage } from '../core/utils.js';
import { addToCart, isInCart } from '../core/store.js';
import { showToast } from './Toast.js';
import { navigate } from '../core/router.js';
import { isWishlisted, toggleWishlist } from '../core/wishlist.js';

let currentProduct = null;

export function initQuickViewModal() {
  if (document.getElementById('quick-view-modal')) return; // already exists
  const modal = document.createElement('div');
  modal.id = 'quick-view-modal';
  modal.className = 'qv-modal';
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Quick view');
  modal.innerHTML = `
    <div class="qv-backdrop"></div>
    <div class="qv-panel">
      <button class="qv-close" id="qv-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="qv-body" id="qv-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close on backdrop / ESC
  modal.querySelector('.qv-backdrop').addEventListener('click', closeQuickView);
  document.getElementById('qv-close').addEventListener('click', closeQuickView);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuickView(); });
}

export function openQuickView(product) {
  currentProduct = product;
  const modal = document.getElementById('quick-view-modal');
  const body  = document.getElementById('qv-body');
  if (!modal || !body) return;

  const img     = getPluginImage(product);
  const price   = product.salePrice || product.price;
  const inCart  = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);

  const CAT_COLORS = {
    eq:'linear-gradient(135deg,#00ff88,#0090cc)',
    compressor:'linear-gradient(135deg,#ff6b2b,#ff3b5c)',
    reverb:'linear-gradient(135deg,#00d4ff,#a855f7)',
    delay:'linear-gradient(135deg,#a855f7,#ff3b5c)',
    synth:'linear-gradient(135deg,#e040fb,#00e5ff)',
    distortion:'linear-gradient(135deg,#ff8f5e,#facc15)',
    mastering:'linear-gradient(135deg,#00b4d8,#0077b6)',
    bundle:'linear-gradient(135deg,#f9c74f,#f3722c)',
    utility:'linear-gradient(135deg,#4cc9f0,#4361ee)',
  };
  const grad = CAT_COLORS[product.category] || 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.5))';

  body.innerHTML = `
    <div class="qv-img-wrap" style="background: ${grad}">
      <img src="${img}" alt="${sanitizeHTML(product.name)}" class="qv-img" />
    </div>
    <div class="qv-info">
      <div class="qv-category">${getCategoryName(product.category)}</div>
      <h2 class="qv-title">${sanitizeHTML(product.name)}</h2>
      <div class="qv-developer">${product.brand || product.developer || 'Pro-Mix'}</div>

      <div class="qv-rating">
        <span class="qv-stars">${renderStars(product.rating)}</span>
        <span class="qv-reviews">${product.reviews} reviews</span>
      </div>

      <p class="qv-desc">${sanitizeHTML(product.shortDesc || product.description?.slice(0, 200) || 'Premium audio plugin for professional producers.')}</p>

      ${product.features?.length ? `
        <ul class="qv-features">
          ${product.features.slice(0, 4).map(f => `<li>${sanitizeHTML(f)}</li>`).join('')}
        </ul>
      ` : ''}

      ${product.specs ? `
        <div class="qv-specs">
          ${Object.entries(product.specs).filter(([,v])=>v&&v!=='—').slice(0,4).map(([k,v])=>`
            <div class="qv-spec-row"><span class="qv-spec-key">${k}</span><span class="qv-spec-val">${v}</span></div>
          `).join('')}
        </div>
      ` : ''}

      <div class="qv-pricing">
        <div class="qv-price">${formatPrice(price)}</div>
        ${product.salePrice && product.salePrice < product.price
          ? `<div class="qv-original">${formatPrice(product.price)}</div>
             <div class="qv-discount">−70% OFF</div>`
          : ''}
      </div>

      <div class="qv-actions">
        <button class="qv-cart-btn ${inCart ? 'in-cart' : ''}" id="qv-cart-btn" ${inCart ? 'disabled' : ''}>
          ${inCart ? '✓ In Cart' : 'Add to Cart'}
        </button>
        <button class="qv-wish-btn ${wishlisted ? 'active' : ''}" id="qv-wish-btn" title="Wishlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button class="qv-view-btn" id="qv-view-btn">View Full Details →</button>
      </div>

      <div class="qv-trust">
        <span>🔐 Secure Payment</span>
        <span>⚡ Instant Delivery</span>
        <span>♾️ Lifetime License</span>
      </div>
    </div>
  `;

  // Show modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Cart button
  document.getElementById('qv-cart-btn')?.addEventListener('click', () => {
    if (!currentProduct) return;
    const added = addToCart(currentProduct);
    if (added) {
      showToast(`${currentProduct.name} added to cart!`, 'success');
      const btn = document.getElementById('qv-cart-btn');
      if (btn) { btn.textContent = '✓ In Cart'; btn.disabled = true; btn.classList.add('in-cart'); }
    } else {
      showToast('Already in your cart', 'info');
    }
  });

  // Wishlist button
  document.getElementById('qv-wish-btn')?.addEventListener('click', function() {
    if (!currentProduct) return;
    const added = toggleWishlist(currentProduct.id);
    this.classList.toggle('active', added);
    this.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
    showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'info');
    // Update the card on the grid too
    const cardHeart = document.querySelector(`[data-product-id="${currentProduct.id}"] .pc-wish-btn`);
    if (cardHeart) cardHeart.classList.toggle('active', added);
  });

  // View full details
  document.getElementById('qv-view-btn')?.addEventListener('click', () => {
    closeQuickView();
    if (currentProduct) navigate(`/product/${currentProduct.slug}`);
  });
}

export function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  currentProduct = null;
}
