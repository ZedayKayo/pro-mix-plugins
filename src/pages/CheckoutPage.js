// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Checkout Page
// Payment Method Selection: Crypto vs Card (separate premium cards)
// ═══════════════════════════════════════════════════════

import { getCart, getCartTotal, clearCart, addPurchaseAsync, getUser, isLoggedIn } from '../core/store.js';
import { formatPrice, formatCrypto } from '../core/utils.js';
import { wallets, supportedCoins, generateQRCodeSVG, getPaymentInstructions } from '../data/crypto.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';

export function renderCheckoutPage() {
  const container = document.getElementById('page-content');
  const cart = getCart();
  const total = getCartTotal();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="section" style="text-align:center; padding: var(--space-4xl);">
        <div style="font-size:56px;margin-bottom:var(--space-lg);">🛒</div>
        <h2 style="margin-bottom:var(--space-md);">Nothing to checkout</h2>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);">Your cart is empty.</p>
        <a href="/store" class="btn btn-primary">Browse Store</a>
      </div>
    `;
    return;
  }

  // ── State ──
  let paymentMethod = null; // null | 'crypto' | 'card'
  let selectedCoin = 'BTC';
  let useCredits = false;
  let appliedPromo = sessionStorage.getItem('pm_promo_code') || null;
  let guestEmailValue = sessionStorage.getItem('pm_guest_email') || '';

  function render() {
    const user = getUser();
    const availableCredits = user ? (user.credits || 0) : 0;
    
    // Apply discount
    let cartTotal = getCartTotal();
    const discountAmount = appliedPromo === 'WELCOME5' ? cartTotal * 0.05 : 0;
    const discountedTotal = Math.max(0, cartTotal - discountAmount);
    
    const canCoverWithCredits = availableCredits >= discountedTotal;
    const finalTotalStr = useCredits ? formatPrice(0) : formatPrice(discountedTotal);
    
    let finalCryptoTotal = useCredits ? 0 : cart.reduce((sum, item) => sum + (item.cryptoPrices?.[selectedCoin] || 0), 0);
    if (appliedPromo === 'WELCOME5') finalCryptoTotal *= 0.95;
    
    const cardTotalWithFee = discountedTotal * 1.049;

    container.innerHTML = `
      <div class="co-page">
        <div class="co-container">

          <!-- ── PAGE HEADER ── -->
          <div class="co-page-header animate-fade-in-up">
            <div class="co-page-header-left">
              <h1 class="co-page-title">Checkout</h1>
              <p class="co-page-subtitle">Secure · Instant digital delivery</p>
            </div>
            <div class="co-secure-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor" opacity="0.7"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              </svg>
              256-bit SSL
            </div>
          </div>

          <div class="co-layout">

            <!-- ══════════════ LEFT: ORDER SUMMARY ══════════════ -->
            <div class="co-left animate-fade-in-up">

              <!-- Order Items Card -->
              <div class="co-card" style="margin-bottom: var(--space-lg);">
                <div class="co-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  Order Summary
                </div>
                <div class="co-items">
                  ${cart.map(item => `
                    <div class="co-item">
                      <div class="co-item-thumb">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : `<div class="co-item-thumb-placeholder">🎛</div>`}
                      </div>
                      <div class="co-item-info">
                        <div class="co-item-name">${item.name}</div>
                        <div class="co-item-meta">Digital plugin · Instant delivery</div>
                      </div>
                      <div class="co-item-price">${formatPrice(item.price)}</div>
                    </div>
                  `).join('')}
                </div>

                ${availableCredits > 0 ? `
                <div class="co-credits-row">
                  <div class="co-credits-info">
                    <div class="co-credits-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#00ff88" stroke-width="1.8"/>
                        <path d="M12 6v6l4 2" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      Store Credits — <strong style="color:var(--neon-green)">$${availableCredits}</strong> available
                    </div>
                    <div class="co-credits-sub">$1 credit = $1 off your order</div>
                  </div>
                  ${canCoverWithCredits ? `
                    <label class="toggle-switch">
                      <input type="checkbox" id="use-credits-toggle" ${useCredits ? 'checked' : ''} />
                      <span class="toggle-slider"></span>
                    </label>
                  ` : `<span class="co-credits-insufficient">Not enough</span>`}
                </div>
                ` : ''}

                <!-- Promo Code -->
                <div class="co-promo-row" style="margin-top:var(--space-md); padding-top:var(--space-md); border-top:1px solid var(--border-primary);">
                  ${appliedPromo ? `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.2); padding:8px 12px; border-radius:var(--radius-md);">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:var(--neon-green)">✓</span>
                        <span style="font-weight:600">${appliedPromo}</span>
                      </div>
                      <button class="btn btn-ghost btn-sm" id="co-promo-remove" style="padding:4px 8px; font-size:12px;">Remove</button>
                    </div>
                  ` : `
                    <form id="co-promo-form" style="display:flex; gap:8px;">
                      <input type="text" id="co-promo-input" class="input" placeholder="Promo code" style="flex:1;" />
                      <button type="submit" class="btn btn-ghost" id="co-promo-apply">Apply</button>
                    </form>
                  `}
                </div>

                ${discountAmount > 0 ? `
                <div class="co-total-row" style="padding-top:var(--space-md); margin-top:var(--space-md); border-top:none;">
                  <span class="co-total-label">Subtotal</span>
                  <span class="co-total-amount" style="font-weight:normal; font-size:16px;">${formatPrice(cartTotal)}</span>
                </div>
                <div class="co-total-row" style="margin-top:4px;">
                  <span class="co-total-label" style="color:var(--neon-green);">Discount (${appliedPromo})</span>
                  <span class="co-total-amount" style="color:var(--neon-green); font-weight:normal; font-size:16px;">-${formatPrice(discountAmount)}</span>
                </div>
                ` : ''}

                <div class="co-total-row" style="padding-top:var(--space-md); ${discountAmount === 0 ? 'margin-top:var(--space-md); border-top:1px solid var(--border-primary);' : ''}">
                  <span class="co-total-label">Total</span>
                  <span class="co-total-amount">${finalTotalStr}</span>
                </div>
              </div>

              <!-- Crypto How-to (shows when crypto is active and not using credits) -->
              ${paymentMethod === 'crypto' && !useCredits ? `
              <div class="co-card co-howto animate-fade-in-up">
                <div class="co-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  How to pay with ${wallets[selectedCoin].name}
                </div>
                <div class="co-steps-list">
                  ${getPaymentInstructions(selectedCoin).steps.map((step, i) => `
                    <div class="co-step-item">
                      <span class="co-step-num">${i + 1}</span>
                      <span class="co-step-text">${step}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="co-waiting-pill">
                  <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span>
                  Waiting for payment confirmation...
                </div>
              </div>
              ` : ''}
            </div>

            <!-- ══════════════ RIGHT: PAYMENT METHOD ══════════════ -->
            <div class="co-right animate-fade-in-up delay-2">

              ${useCredits ? `
              <!-- ── CREDITS ONLY FLOW ── -->
              <div class="co-credits-only-card">
                <div class="co-summary-box animate-fade-in-up delay-2">
                <h3 style="margin-bottom: var(--space-md);">Order Summary</h3>
                
                ${!user ? `
                  <div style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-primary); padding-bottom: var(--space-md);">
                    <label style="display:block; font-size:12px; margin-bottom:6px; color:var(--text-secondary); font-weight:600;">Where should we send your download links?</label>
                    <input type="email" id="co-guest-email" class="input" placeholder="you@email.com" value="${guestEmailValue}" style="width:100%; border-color:var(--border-secondary);" required />
                  </div>
                ` : ''}

                <div class="co-items-list">
                <div style="font-size:40px;margin-bottom:var(--space-md);">🎁</div>
                <h3 style="margin-bottom:var(--space-sm);">Pay with Store Credits</h3>
                <p class="text-secondary text-sm" style="margin-bottom:var(--space-xl);">
                  Your credits fully cover this order. No payment method needed.
                </p>
                <button class="btn btn-primary" id="simulate-payment-btn" style="width:100%;">
                  🎁 Complete Order with Credits
                </button>
                <div id="checkout-status-msg" style="margin-top:var(--space-md);text-align:center;display:none;"></div>
              </div>

              ` : paymentMethod === null ? `

              <!-- ── PAYMENT METHOD CHOOSER ── -->
              <div class="co-choose-label">Choose your payment method</div>

              <div class="co-pm-grid">

                <!-- ── CRYPTO CARD ── -->
                <button class="co-pm-card co-pm-crypto" id="pm-choose-crypto" aria-label="Pay with cryptocurrency">
                  <div class="co-pm-card-glow"></div>
                  <div class="co-pm-card-inner" style="padding: 16px 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap: 16px;">
                        <div class="co-pm-icon co-pm-icon-crypto" style="width:40px; height:40px; margin:0;">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                          </svg>
                        </div>
                        <div style="text-align: left;">
                          <div class="co-pm-title" style="font-size: 16px; margin-bottom: 2px;">Pay with Crypto</div>
                          <div style="font-size: 12px; color: var(--neon-green); font-weight: 600;">Zero fees • Instant</div>
                        </div>
                      </div>
                      <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span class="co-pm-badge-rec" style="margin: 0 0 6px 0; font-size: 10px; padding: 3px 8px;">⚡ Recommended</span>
                        <div style="font-size:12px; color:var(--text-secondary); font-weight:600;">Select →</div>
                      </div>
                    </div>
                  </div>
                </button>

              </div>

              <div class="co-method-footer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/></svg>
                All payments are secured with 256-bit SSL encryption
              </div>

              ` : paymentMethod === 'crypto' ? `

              <!-- ── CRYPTO PAYMENT WIDGET ── -->
              <div class="co-crypto-widget animate-fade-in-up">
                <div class="co-crypto-widget-header">
                  <button class="co-back-btn" id="back-to-chooser">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                  <h3 class="co-crypto-title">Pay with Crypto</h3>
                  <div class="co-crypto-secure">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="#00ff88"/></svg>
                  </div>
                </div>

                <!-- Coin selector tabs -->
                <div class="co-coin-tabs" id="coin-tabs">
                  ${supportedCoins.map(coin => `
                    <button
                      class="co-coin-tab ${coin === selectedCoin ? 'active' : ''}"
                      data-coin="${coin}"
                      style="--coin-color:${wallets[coin].color};"
                    >
                      <span class="co-coin-icon" style="color:${wallets[coin].color};">${wallets[coin].icon}</span>
                      <span class="co-coin-name">${coin}</span>
                    </button>
                  `).join('')}
                </div>

                <!-- Amount display -->
                <div class="co-amount-box">
                  <div class="co-amount-label">Amount to Send</div>
                  <div class="co-amount-value" style="color:${wallets[selectedCoin].color};">
                    ${formatCrypto(finalCryptoTotal, selectedCoin)}
                  </div>
                  <div class="co-amount-usd">≈ ${finalTotalStr}</div>
                </div>

                <!-- Network info badge -->
                <div class="co-network-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>
                  Network: <strong>${wallets[selectedCoin].network}</strong>
                  &nbsp;·&nbsp; Est. time: <strong>${wallets[selectedCoin].estimatedTime}</strong>
                </div>

                <!-- QR Code -->
                <div class="co-qr-wrap">
                  <div class="co-qr-box" style="box-shadow:0 0 40px ${wallets[selectedCoin].color}30;">
                    ${generateQRCodeSVG(wallets[selectedCoin].address)}
                  </div>
                </div>

                <!-- Wallet address -->
                <div class="co-address-box">
                  <div class="co-address-text" id="wallet-address">${wallets[selectedCoin].address}</div>
                  <button class="co-copy-btn" id="copy-address-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/></svg>
                    Copy
                  </button>
                </div>

                <!-- Confirm payment button -->
                <button class="btn btn-primary" id="simulate-payment-btn" style="width:100%;margin-top:var(--space-md);">
                  ✅ I've Sent the Payment
                </button>
                <div id="checkout-status-msg" style="margin-top:var(--space-md);text-align:center;display:none;"></div>

                <div class="co-crypto-footer">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  Send the exact amount shown. Include network fees in your wallet settings.
                </div>
              </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    attachEvents();
  }

  // ── Events ──
  function attachEvents() {
    // Promo code
    document.getElementById('co-promo-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const val = document.getElementById('co-promo-input').value.trim().toUpperCase();
      if (val === 'WELCOME5') {
        appliedPromo = val;
        sessionStorage.setItem('pm_promo_code', val);
        showToast('Promo code applied!', 'success');
        render();
      } else if (val) {
        showToast('Invalid or expired promo code.', 'error');
      }
    });

    document.getElementById('co-promo-remove')?.addEventListener('click', () => {
      appliedPromo = null;
      sessionStorage.removeItem('pm_promo_code');
      render();
    });

    // Credits toggle
    document.getElementById('use-credits-toggle')?.addEventListener('change', e => {
      useCredits = e.target.checked;
      render();
    });

    // Back to chooser
    document.getElementById('back-to-chooser')?.addEventListener('click', () => {
      paymentMethod = null;
      render();
    });

    // Choose crypto
    document.getElementById('pm-choose-crypto')?.addEventListener('click', () => {
      paymentMethod = 'crypto';
      render();
    });

    // Nudge — go back to crypto
    document.getElementById('nudge-go-back')?.addEventListener('click', () => {
      nudgeVisible = false;
      paymentMethod = 'crypto';
      render();
    });

    // Nudge overlay click
    document.getElementById('nudge-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'nudge-overlay') {
        nudgeVisible = false;
        paymentMethod = 'crypto';
        render();
      }
    });

    document.getElementById('nudge-confirm-card')?.addEventListener('click', () => {
      nudgeVisible = false;
      render();
    });

    // Coin tabs
    document.querySelectorAll('#coin-tabs .co-coin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        selectedCoin = tab.dataset.coin;
        render();
      });
    });

    // Copy address
    document.getElementById('copy-address-btn')?.addEventListener('click', () => {
      const address = document.getElementById('wallet-address').textContent;
      navigator.clipboard?.writeText(address).then(() => {
        showToast('Address copied!', 'success');
        const btn = document.getElementById('copy-address-btn');
        if (btn) {
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Copied!`;
          setTimeout(() => {
            if (btn) btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/></svg> Copy`;
          }, 2000);
        }
      }).catch(() => showToast('Failed to copy', 'error'));
    });

    // Verify crypto payment / credits
    document.getElementById('simulate-payment-btn')?.addEventListener('click', () => {
      let guestEmail = null;
      if (!getUser()) {
        const mailInput = document.getElementById('co-guest-email');
        if (!mailInput || !mailInput.value.includes('@')) {
          showToast('Please provide a valid email for your receipt.', 'error');
          return;
        }
        guestEmail = mailInput.value;
      }

      const simBtn = document.getElementById('simulate-payment-btn');
      const statusMsg = document.getElementById('checkout-status-msg');
      simBtn.disabled = true;
      simBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;margin-right:8px;"></span> Processing...';
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'payment-status waiting';
        statusMsg.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Confirming transaction...';
      }
      setTimeout(async () => {
        try {
          const result = await addPurchaseAsync(cart, useCredits ? 'credits' : selectedCoin, useCredits, guestEmail);
          const purchasedCart = [...cart];
          clearCart();

          // Save order details for the success page to read
          sessionStorage.setItem('pm_last_order', JSON.stringify({
            items: purchasedCart.map(i => ({ id: i.id, name: i.name })),
            orderId: result?.order_id,
            method: useCredits ? 'credits' : selectedCoin,
            instant: useCredits,
            guestEmail: guestEmail
          }));

          showToast(useCredits ? '🎉 Order complete! Email sending...' : '📨 Order submitted! Processing delivery...', 'success');
          navigate('/order-success');
        } catch (err) {
          showToast(err.message || 'Payment failed. Please try again.', 'error');
          if (simBtn) {
            simBtn.disabled = false;
            simBtn.innerHTML = useCredits ? '🎁 Complete Order with Credits' : '✅ I\'ve Sent the Payment';
          }
          if (statusMsg) statusMsg.style.display = 'none';
        }
      }, 1200);
    });

    // Save guest email to session storage dynamically
    document.getElementById('co-guest-email')?.addEventListener('input', (e) => {
      guestEmailValue = e.target.value;
      sessionStorage.setItem('pm_guest_email', guestEmailValue);
    });
  }

  render();
}
