// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Card (Full-featured)
// ═══════════════════════════════════════════════════════

import { formatPrice, renderStars, getPluginImage, getCategoryName, sanitizeHTML, calculateDiscount } from '../core/utils.js';
import { addToCart, isInCart } from '../core/store.js';
import { navigate } from '../core/router.js';
import { showToast } from './Toast.js';
import { isWishlisted, toggleWishlist } from '../core/wishlist.js';

const CAT_GRADIENTS = {
  eq:         'linear-gradient(135deg,#00ff88 0%,#0090cc 100%)',
  compressor: 'linear-gradient(135deg,#ff6b2b 0%,#ff3b5c 100%)',
  reverb:     'linear-gradient(135deg,#00d4ff 0%,#a855f7 100%)',
  delay:      'linear-gradient(135deg,#a855f7 0%,#ff3b5c 100%)',
  synth:      'linear-gradient(135deg,#e040fb 0%,#00e5ff 100%)',
  distortion: 'linear-gradient(135deg,#ff8f5e 0%,#facc15 100%)',
  mastering:  'linear-gradient(135deg,#00b4d8 0%,#0077b6 100%)',
  bundle:     'linear-gradient(135deg,#f9c74f 0%,#f3722c 100%)',
  utility:    'linear-gradient(135deg,#4cc9f0 0%,#4361ee 100%)',
};

export function renderProductCard(product, animDelay = 0) {
  const img        = getPluginImage(product);
  const salePrice  = product.salePrice;
  const origPrice  = product.price;
  const dispPrice  = salePrice || origPrice;
  const inCart     = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);
  const grad       = CAT_GRADIENTS[product.category] || 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.5))';

  // One badge — SALE wins over NEW
  let badge = '';
  if (salePrice && salePrice < origPrice) {
    badge = `<span class="pc-badge pc-badge-sale">SALE −${calculateDiscount(origPrice, salePrice)}%</span>`;
  } else if (product.isNew) {
    badge  = `<span class="pc-badge pc-badge-new">NEW</span>`;
  }
  if (product.isTrending && !badge) {
    badge = `<span class="pc-badge pc-badge-hot">🔥 HOT</span>`;
  }

  const starsHtml = product.reviews > 0
    ? `<div class="pc-rating">
        <span class="pc-stars">${renderStars(product.rating)}</span>
        <span class="pc-reviews">${product.reviews}</span>
       </div>`
    : '<div></div>';

  return `
    <div class="product-card animate-fade-in-up delay-${animDelay % 8 + 1}"
         data-product-id="${product.id}"
         data-slug="${product.slug}">

      <div class="pc-image" style="--cat-grad:${grad}">
        <div class="pc-img-bg"></div>
        <img src="${img}" alt="${sanitizeHTML(product.name)}" loading="lazy" class="pc-img" />

        ${badge ? `<div class="pc-badges">${badge}</div>` : ''}

        <!-- Hover overlay: top-right actions -->
        <div class="pc-hover-overlay">
          <div class="pc-actions">
            <button class="pc-action-btn pc-wish-btn ${wishlisted ? 'active' : ''}"
                    title="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                    data-wishlist="${product.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button class="pc-action-btn" title="Quick View" data-quickview="${product.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="pc-action-btn pc-compare-btn" title="Add to Compare" data-compare="${product.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Slide-up cart button -->
        <div class="pc-cart-slide">
          <button class="pc-cart-btn ${inCart ? 'in-cart' : ''}"
                  data-add-cart="${product.id}"
                  ${inCart ? 'disabled' : ''}>
            ${inCart ? '✓ In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <div class="pc-body">
        <div class="pc-category">${getCategoryName(product.category)}</div>
        <div class="pc-title">
          <a href="/product/${product.slug}">${sanitizeHTML(product.name)}</a>
        </div>
        <div class="pc-developer">${product.brand || product.developer || 'Pro-Mix'}</div>

        <div class="pc-footer">
          ${starsHtml}
          <div class="pc-price-group">
            <div class="pc-price">${formatPrice(dispPrice)}</div>
            ${salePrice && salePrice < origPrice
              ? `<div class="pc-original-price">${formatPrice(origPrice)}</div>`
              : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initProductCardEvents(container) {
  if (!container) return;

  container.addEventListener('click', async (e) => {

    // ── Quick View ──────────────────────────────
    const qvBtn = e.target.closest('[data-quickview]');
    if (qvBtn) {
      e.preventDefault(); e.stopPropagation();
      const id = qvBtn.dataset.quickview;
      const { getProducts } = await import('../data/products.js');
      const product = getProducts().find(p => p.id === id);
      if (product) {
        const { openQuickView } = await import('./QuickViewModal.js');
        openQuickView(product);
      }
      return;
    }

    // ── Wishlist ────────────────────────────────
    const wishBtn = e.target.closest('[data-wishlist]');
    if (wishBtn) {
      e.preventDefault(); e.stopPropagation();
      const id = wishBtn.dataset.wishlist;
      const added = toggleWishlist(id);
      wishBtn.classList.toggle('active', added);
      wishBtn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
      wishBtn.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
      showToast(added ? '❤️ Added to wishlist' : 'Removed from wishlist', 'info');
      // Refresh wishlist count bubble if exists
      document.dispatchEvent(new CustomEvent('wishlist:updated'));
      return;
    }

    // ── Compare ─────────────────────────────────
    const cmpBtn = e.target.closest('[data-compare]');
    if (cmpBtn) {
      e.preventDefault(); e.stopPropagation();
      const id = cmpBtn.dataset.compare;
      let compareList = JSON.parse(sessionStorage.getItem('pmx_compare') || '[]');
      if (compareList.includes(id)) {
        showToast('Already in compare list', 'info'); return;
      }
      if (compareList.length >= 3) {
        showToast('Max 3 plugins to compare', 'info'); return;
      }
      compareList.push(id);
      sessionStorage.setItem('pmx_compare', JSON.stringify(compareList));
      cmpBtn.classList.add('active');
      showToast(`Added to compare (${compareList.length}/3)`, 'success');
      document.dispatchEvent(new CustomEvent('compare:updated', { detail: compareList }));
      return;
    }

    // ── Add to Cart ─────────────────────────────
    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn && !addBtn.disabled) {
      e.preventDefault(); e.stopPropagation();
      const id = addBtn.dataset.addCart;
      const { getProducts } = await import('../data/products.js');
      const product = getProducts().find(p => p.id === id);
      if (product) {
        const added = addToCart(product);
        if (added) {
          showToast(`${product.name} added to cart!`, 'success');
          addBtn.textContent = '✓ In Cart';
          addBtn.disabled = true;
          addBtn.classList.add('in-cart');
        } else {
          showToast('Already in your cart', 'info');
        }
      }
      return;
    }

    // ── Navigate on image click ──────────────────
    const imgArea = e.target.closest('.pc-image');
    if (imgArea && !e.target.closest('.pc-action-btn') && !e.target.closest('.pc-cart-btn')) {
      const slug = imgArea.closest('.product-card')?.dataset.slug;
      if (slug) navigate(`/product/${slug}`);
      return;
    }

    // ── Navigate on title click ──────────────────
    const titleLink = e.target.closest('.pc-title a');
    if (titleLink) {
      e.preventDefault();
      const slug = titleLink.closest('.product-card')?.dataset.slug;
      if (slug) navigate(`/product/${slug}`);
    }
  });
}
