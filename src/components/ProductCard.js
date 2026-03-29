// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Card Component
// ═══════════════════════════════════════════════════════

import { formatPrice, renderStars, getPluginImage, getCategoryName, sanitizeHTML } from '../core/utils.js';
import { addToCart, isInCart } from '../core/store.js';
import { navigate } from '../core/router.js';
import { showToast } from './Toast.js';

export function renderProductCard(product, animDelay = 0) {
  const img = getPluginImage(product);
  const price = product.salePrice || product.price;
  const inCart = isInCart(product.id);

  return `
    <div class="product-card animate-fade-in-up delay-${animDelay % 8 + 1}" data-product-id="${product.id}" data-slug="${product.slug}">
      <div class="product-card-image">
        <img src="${img}" alt="${sanitizeHTML(product.name)}" loading="lazy" />
        <div class="product-card-badges">
          ${product.isNew ? '<span class="badge badge-green">New</span>' : ''}
          ${product.salePrice ? '<span class="badge badge-orange">Sale</span>' : ''}
          ${product.isTrending ? '<span class="badge badge-blue">Trending</span>' : ''}
        </div>
        <div class="product-card-quick-actions">
          <button class="quick-action-btn" title="Quick view" data-quickview="${product.slug}">👁</button>
          <button class="quick-action-btn" title="Play demo" data-demo="${product.slug}">▶</button>
        </div>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${getCategoryName(product.category)}</div>
        <div class="product-card-title">
          <a href="/product/${product.slug}">${sanitizeHTML(product.name)}</a>
        </div>
        <div class="product-card-meta">
          <div class="product-card-rating">
            <span class="stars">${renderStars(product.rating)}</span>
            <span class="text-xs text-muted">(${product.reviews})</span>
          </div>
          <div class="product-card-daws">
            ${(product.dawCompat || []).slice(0, 3).map(d => `<span class="daw-tag">${d.split('-')[0].toUpperCase()}</span>`).join('')}
            ${(product.dawCompat || []).length > 3 ? `<span class="daw-tag">+${product.dawCompat.length - 3}</span>` : ''}
          </div>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">
            ${formatPrice(price)}
            ${product.salePrice ? `<span class="original" style="text-decoration: line-through; font-size: 0.8em; color: var(--text-muted); margin-left: 4px;">${formatPrice(product.price)}</span> <span style="color: var(--neon-orange); font-size: 0.7em; margin-left: 4px; border: 1px solid var(--neon-orange); border-radius: 4px; padding: 0 4px;">-70%</span>` : ''}
          </div>
          <button class="add-to-cart-btn" data-add-cart="${product.id}" ${inCart ? 'disabled style="opacity:0.5"' : ''}>
            ${inCart ? '✓ In Cart' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initProductCardEvents(container) {
  if (!container) return;
  
  container.addEventListener('click', (e) => {
    // ── QUICK VIEW / CARD CLICK ──
    const quickViewBtn = e.target.closest('[data-quickview]');
    const imgClick = e.target.closest('.product-card-image');
    
    if (quickViewBtn || (imgClick && !e.target.closest('.quick-action-btn'))) {
      e.preventDefault();
      const slug = quickViewBtn ? quickViewBtn.dataset.quickview : imgClick.closest('.product-card').dataset.slug;
      if (slug) navigate(`/product/${slug}`);
      return;
    }

    // ── ADD TO CART ──
    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      e.preventDefault();
      const productId = addBtn.dataset.addCart;
      
      // Look up from live inventory (works for Supabase + admin-added products)
      import('../data/products.js').then(({ getProductBySlug, getProducts }) => {
        const product = getProducts().find(p => p.id === productId);
        if (product) {
          const added = addToCart(product);
          if (added) {
            showToast(`${product.name} added to cart!`, 'success');
            addBtn.textContent = '✓ In Cart';
            addBtn.disabled = true;
            addBtn.style.opacity = '0.5';
          } else {
            showToast('Already in your cart', 'info');
          }
        }
      });
    }
  });
}
