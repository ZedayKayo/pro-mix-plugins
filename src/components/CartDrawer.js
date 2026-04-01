// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Cart Drawer Component (Fix #5)
// Slide-out off-canvas cart drawer
// ═══════════════════════════════════════════════════════

import { getCart, getCartTotal, removeFromCart, on } from '../core/store.js';
import { formatPrice, getPluginImage } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { getProducts } from '../data/products.js';

let drawerEl = null;
let overlayEl = null;
let _isOpen = false;

export function initCartDrawer() {
  // Create drawer DOM
  drawerEl = document.createElement('div');
  drawerEl.id = 'cart-drawer';
  drawerEl.className = 'cart-drawer';
  drawerEl.setAttribute('aria-label', 'Shopping cart');
  drawerEl.setAttribute('role', 'dialog');
  drawerEl.setAttribute('aria-modal', 'true');

  overlayEl = document.createElement('div');
  overlayEl.id = 'cart-drawer-overlay';
  overlayEl.className = 'cart-drawer-overlay';

  document.body.appendChild(overlayEl);
  document.body.appendChild(drawerEl);

  // Close on overlay click
  overlayEl.addEventListener('click', closeCartDrawer);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isOpen) closeCartDrawer();
  });

  // Auto-open when item added
  on('cart:added', () => {
    renderDrawer();
    openCartDrawer();
  });

  // Re-render on cart updates without reopening
  on('cart:updated', () => {
    if (_isOpen) renderDrawer();
  });

  renderDrawer();
}

function renderDrawer() {
  const cart = getCart();
  const total = getCartTotal();
  const products = getProducts();

  drawerEl.innerHTML = `
    <div class="cart-drawer-header">
      <h3>🛒 Cart <span class="cart-drawer-count">(${cart.length})</span></h3>
      <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">✕</button>
    </div>

    <div class="cart-drawer-body">
      ${cart.length === 0 ? `
        <div class="cart-drawer-empty">
          <div style="font-size:48px; opacity:0.3; margin-bottom:12px;">🛒</div>
          <p>Your cart is empty</p>
          <button class="btn btn-primary" id="drawer-browse-btn" style="margin-top:16px;">Browse Plugins</button>
        </div>
      ` : cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const img = product ? getPluginImage(product) : '';
        return `
          <div class="cart-drawer-item" data-item-id="${item.id}">
            <img class="cart-drawer-item-img" src="${img}" alt="${item.name}" />
            <div class="cart-drawer-item-info">
              <div class="cart-drawer-item-name">${item.name}</div>
              <div class="cart-drawer-item-price">${formatPrice(item.price)}</div>
            </div>
            <button class="cart-drawer-item-remove" data-remove="${item.id}" aria-label="Remove ${item.name}">✕</button>
          </div>
        `;
      }).join('')}
    </div>

    ${cart.length > 0 ? `
      <div class="cart-drawer-footer">
        <div class="cart-drawer-total">
          <span>Total</span>
          <span class="cart-drawer-total-price">${formatPrice(total)}</span>
        </div>
        <div class="cart-drawer-trust">
          <span>🔒 Secure</span>
          <span>⚡ Instant Delivery</span>
          <span>₿ Crypto Pay</span>
        </div>
        <button class="btn btn-primary" id="drawer-checkout-btn" style="width:100%; margin-bottom:8px;">
          Proceed to Checkout
        </button>
        <button class="btn btn-ghost" id="drawer-view-cart-btn" style="width:100%;">
          View Full Cart
        </button>
      </div>
    ` : ''}
  `;

  // Events inside drawer
  document.getElementById('cart-drawer-close')?.addEventListener('click', closeCartDrawer);
  document.getElementById('drawer-checkout-btn')?.addEventListener('click', () => {
    closeCartDrawer();
    navigate('/checkout');
  });
  document.getElementById('drawer-view-cart-btn')?.addEventListener('click', () => {
    closeCartDrawer();
    navigate('/cart');
  });
  document.getElementById('drawer-browse-btn')?.addEventListener('click', () => {
    closeCartDrawer();
    navigate('/store');
  });

  drawerEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
      renderDrawer();
    });
  });
}

export function openCartDrawer() {
  _isOpen = true;
  renderDrawer();
  drawerEl.classList.add('open');
  overlayEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeCartDrawer() {
  _isOpen = false;
  drawerEl.classList.remove('open');
  overlayEl.classList.remove('open');
  document.body.style.overflow = '';
}

export function toggleCartDrawer() {
  if (_isOpen) closeCartDrawer();
  else openCartDrawer();
}
