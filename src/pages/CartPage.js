// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Cart Page
// ═══════════════════════════════════════════════════════

import { getCart, removeFromCart, getCartTotal, clearCart } from '../core/store.js';
import { formatPrice, getPluginImage } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';
import { getProducts } from '../data/products.js';

export function renderCartPage() {
  const container = document.getElementById('page-content');
  
  function render() {
    const cart = getCart();
    const total = getCartTotal();
    const isEmpty = cart.length === 0;

    container.innerHTML = `
      <div class="section">
        <div class="container">
          <h1 style="margin-bottom: var(--space-xl); font-size: var(--text-2xl);">🛒 Shopping Cart ${!isEmpty ? `<span class="text-sm text-muted">(${cart.length} item${cart.length > 1 ? 's' : ''})</span>` : ''}</h1>

          ${isEmpty ? `
            <div class="cart-empty animate-fade-in-up">
              <div class="cart-empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Browse our collection of professional audio plugins.</p>
              <button class="btn btn-primary" id="cart-browse-btn" style="margin-top: var(--space-lg);">Browse Plugins</button>
            </div>
          ` : `
            <div class="cart-layout">
              <div class="cart-items" id="cart-items">
                ${cart.map(item => {
                  const product = getProducts().find(p => p.id === item.id);
                  const img = product ? getPluginImage(product) : '';
                  return `
                    <div class="cart-item animate-fade-in-up" data-cart-item="${item.id}">
                      <img class="cart-item-image" src="${img}" alt="${item.name}" />
                      <div class="cart-item-info">
                        <h4><a href="/product/${item.slug}" style="color:var(--text-primary);text-decoration:none;">${item.name}</a></h4>
                        <p class="text-muted">${item.category} plugin • Digital download</p>
                      </div>
                      <div class="cart-item-price">${formatPrice(item.price)}</div>
                      <button class="cart-item-remove" data-remove="${item.id}" title="Remove">✕</button>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="order-summary animate-fade-in-up delay-2">
                <h3>Order Summary</h3>
                <div class="order-line">
                  <span>Subtotal</span>
                  <span>${formatPrice(total)}</span>
                </div>
                <div class="order-line">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div class="order-line">
                  <span>Discount</span>
                  <span style="color: var(--neon-green);">-$0.00</span>
                </div>
                <div class="order-line total">
                  <span>Total</span>
                  <span>${formatPrice(total)}</span>
                </div>

                <div class="promo-input">
                  <input type="text" class="input" placeholder="Promo code" />
                  <button class="btn btn-ghost">Apply</button>
                </div>

                <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-bottom:var(--space-md);">
                  <span>🔒 Secure</span>
                  <span>⚡ Instant Delivery</span>
                  <span>🔄 Guarantee</span>
                </div>

                <button class="btn btn-primary" id="checkout-btn" style="width:100%;">
                  Proceed to Checkout
                </button>

                <div style="text-align:center; margin-top: var(--space-md);">
                  <button class="text-sm text-muted" id="clear-cart-btn" style="cursor:pointer; text-decoration: underline;">Clear Cart</button>
                </div>

                <div style="margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-primary);">
                  <div class="text-xs text-muted" style="text-align:center;">
                    <p>We accept</p>
                    <div class="flex justify-center gap-sm" style="margin-top: var(--space-xs);">
                      <span class="crypto-icon" style="color: #f7931a;">₿</span>
                      <span class="crypto-icon" style="color: #627eea;">Ξ</span>
                      <span class="crypto-icon" style="color: #26a17b;">₮</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    // Events
    document.getElementById('cart-browse-btn')?.addEventListener('click', () => navigate('/store'));
    document.getElementById('checkout-btn')?.addEventListener('click', () => navigate('/checkout'));
    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
      clearCart();
      showToast('Cart cleared', 'info');
      render();
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.remove;
        removeFromCart(id);
        showToast('Item removed from cart', 'info');
        render();
      });
    });
  }

  render();
}
