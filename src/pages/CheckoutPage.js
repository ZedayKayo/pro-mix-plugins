// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Checkout Page
// Payment Method Selection: Crypto vs Card (separate premium cards)
// ═══════════════════════════════════════════════════════

import { getCart, getCartTotal, clearCart, addPurchaseAsync, getUser } from '../core/store.js';
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
  let nudgeVisible = false;

  function render() {
    const user = getUser();
    const availableCredits = user ? (user.credits || 0) : 0;
    const cartTotal = getCartTotal();
    const canCoverWithCredits = availableCredits >= cartTotal;
    const finalTotalStr = useCredits ? formatPrice(0) : formatPrice(cartTotal);
    const finalCryptoTotal = useCredits ? 0 : cart.reduce((sum, item) => sum + (item.cryptoPrices?.[selectedCoin] || 0), 0);
    const cardTotalWithFee = cartTotal * 1.049;

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

                <div class="co-total-row">
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
                  <div class="co-pm-card-inner">
                    <div class="co-pm-header">
                      <div class="co-pm-icon co-pm-icon-crypto">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div>
                        <div class="co-pm-title">Pay with Crypto</div>
                        <div class="co-pm-sub">BTC · ETH · USDT</div>
                      </div>
                      <span class="co-pm-badge-rec">⚡ Recommended</span>
                    </div>

                    <div class="co-pm-coins">
                      <div class="co-pm-coin" style="background:rgba(247,147,26,0.12);border-color:rgba(247,147,26,0.3);">
                        <span style="color:#f7931a;font-size:16px;">₿</span>
                        <span>Bitcoin</span>
                      </div>
                      <div class="co-pm-coin" style="background:rgba(98,126,234,0.12);border-color:rgba(98,126,234,0.3);">
                        <span style="color:#627eea;font-size:16px;">Ξ</span>
                        <span>Ethereum</span>
                      </div>
                      <div class="co-pm-coin" style="background:rgba(38,161,123,0.12);border-color:rgba(38,161,123,0.3);">
                        <span style="color:#26a17b;font-size:14px;">₮</span>
                        <span>Tether</span>
                      </div>
                    </div>

                    <div class="co-pm-perks">
                      <div class="co-pm-perk">✅ Zero extra fees</div>
                      <div class="co-pm-perk">✅ No ID required</div>
                      <div class="co-pm-perk">✅ Instant & private</div>
                      <div class="co-pm-perk">✅ Global payments</div>
                    </div>

                    <div class="co-pm-cta">
                      Pay with Crypto
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </div>
                  </div>
                </button>

                <!-- ── CARD CARD ── -->
                <button class="co-pm-card co-pm-card-method" id="pm-choose-card" aria-label="Pay with credit card">
                  <div class="co-pm-card-inner">
                    <div class="co-pm-header">
                      <div class="co-pm-icon co-pm-icon-card">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/>
                          <rect x="5" y="14" width="4" height="2" rx="1" fill="currentColor"/>
                        </svg>
                      </div>
                      <div>
                        <div class="co-pm-title">Pay with Card</div>
                        <div class="co-pm-sub">Visa · Mastercard · Amex</div>
                      </div>
                    </div>

                    <div class="co-pm-brands">
                      <div class="co-pm-brand-logo">
                        <svg viewBox="0 0 780 500" width="52" height="33"><rect width="780" height="500" rx="40" fill="#1A1F71"/><text x="390" y="320" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" fill="#fff" letter-spacing="-8">VISA</text></svg>
                      </div>
                      <div class="co-pm-brand-logo">
                        <svg viewBox="0 0 131.4 86" width="52" height="33"><rect width="131.4" height="86" rx="8" fill="#252525"/><circle cx="45.7" cy="43" r="27.9" fill="#EB001B"/><circle cx="85.7" cy="43" r="27.9" fill="#F79E1B"/><path d="M65.7 20.8a27.9 27.9 0 0 1 0 44.4 27.9 27.9 0 0 1 0-44.4z" fill="#FF5F00"/></svg>
                      </div>
                      <div class="co-pm-brand-logo">
                        <svg viewBox="0 0 131.4 86" width="52" height="33"><rect width="131.4" height="86" rx="8" fill="#2E77BC"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="#fff" letter-spacing="2">AMEX</text></svg>
                      </div>
                      <div class="co-pm-brand-logo">
                        <svg viewBox="0 0 131.4 86" width="52" height="33"><rect width="131.4" height="86" rx="8" fill="#fff"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#FF6600" letter-spacing="1">DISCOVER</text></svg>
                      </div>
                    </div>

                    <div class="co-pm-perks co-pm-perks-muted">
                      <div class="co-pm-perk co-pm-perk-warn">⚠️ +4.9% processing fee</div>
                      <div class="co-pm-perk co-pm-perk-warn">⚠️ KYC may be required</div>
                      <div class="co-pm-perk co-pm-perk-ok">✅ Familiar checkout flow</div>
                      <div class="co-pm-perk co-pm-perk-ok">✅ 3D Secure verified</div>
                    </div>

                    <div class="co-pm-warning-total">
                      Total with fee: <strong>${formatPrice(cardTotalWithFee)}</strong>
                    </div>

                    <div class="co-pm-cta co-pm-cta-card">
                      Pay with Card
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
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

              ` : `

              <!-- ── CARD REDIRECT PANEL ── -->
              <div class="co-card-redirect animate-fade-in-up">
                <div class="co-crypto-widget-header">
                  <button class="co-back-btn" id="back-to-chooser">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                  <h3 class="co-crypto-title">Pay by Card</h3>
                </div>

                <div class="co-card-brands-row">
                  <div class="co-card-brand-lg"><svg viewBox="0 0 780 500" width="62" height="40"><rect width="780" height="500" rx="40" fill="#1A1F71"/><text x="390" y="320" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" fill="#fff" letter-spacing="-8">VISA</text></svg></div>
                  <div class="co-card-brand-lg"><svg viewBox="0 0 131.4 86" width="62" height="40"><rect width="131.4" height="86" rx="8" fill="#252525"/><circle cx="45.7" cy="43" r="27.9" fill="#EB001B"/><circle cx="85.7" cy="43" r="27.9" fill="#F79E1B"/><path d="M65.7 20.8a27.9 27.9 0 0 1 0 44.4 27.9 27.9 0 0 1 0-44.4z" fill="#FF5F00"/></svg></div>
                  <div class="co-card-brand-lg"><svg viewBox="0 0 131.4 86" width="62" height="40"><rect width="131.4" height="86" rx="8" fill="#2E77BC"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="#fff" letter-spacing="2">AMEX</text></svg></div>
                </div>

                <div class="co-card-redirect-total">
                  <div class="co-crt-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                  <div class="co-crt-row co-crt-fee">
                    <span>Processing fee (4.9%)</span>
                    <span style="color:var(--neon-orange);">+${formatPrice(total * 0.049)}</span>
                  </div>
                  <div class="co-crt-row co-crt-total">
                    <span>Total due</span>
                    <span>${formatPrice(cardTotalWithFee)}</span>
                  </div>
                </div>

                <div class="co-card-warnings">
                  <div class="co-card-warn-item">
                    <span class="co-card-warn-icon">⚠️</span>
                    <span>Identity verification (KYC) may be required by your bank</span>
                  </div>
                  <div class="co-card-warn-item">
                    <span class="co-card-warn-icon">⚠️</span>
                    <span>Some banks block plugin / software purchases</span>
                  </div>
                  <div class="co-card-warn-item">
                    <span class="co-card-warn-icon">⚠️</span>
                    <span>Card processing is slower than direct crypto</span>
                  </div>
                </div>

                <button class="co-card-proceed-btn" id="go-to-card-checkout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="2"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/></svg>
                  Continue to Secure Card Checkout
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>

                <div class="co-card-redirect-notice">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/></svg>
                  Secured by 3D Secure 2.0 · 256-bit SSL · Mock Stripe
                </div>

                <div class="co-crypto-switch-nudge">
                  ⚡ Save 4.9% — <button class="co-nudge-switch-btn" id="switch-to-crypto">Switch to crypto instead</button>
                </div>
              </div>
              `}

            </div>
          </div>
        </div>
      </div>

      <!-- ── NUDGE MODAL ── -->
      ${nudgeVisible ? `
      <div class="nudge-modal-overlay" id="nudge-overlay">
        <div class="nudge-modal">
          <div class="nudge-modal-icon">⚡</div>
          <h3 class="nudge-modal-title">Crypto is faster & cheaper</h3>
          <p class="nudge-modal-body">
            Direct crypto payment has <strong>zero extra fees</strong>, no KYC, and instant delivery.
            Card payments add 4.9% and may require identity verification.
          </p>
          <div class="nudge-comparison">
            <div class="nudge-col nudge-col-crypto">
              <div class="nudge-col-title">🟢 Crypto</div>
              <div class="nudge-col-item">✅ Zero extra fees</div>
              <div class="nudge-col-item">✅ No ID needed</div>
              <div class="nudge-col-item">✅ Instant settlement</div>
            </div>
            <div class="nudge-col nudge-col-card">
              <div class="nudge-col-title">🟡 Card</div>
              <div class="nudge-col-item">⚠️ +4.9% fee</div>
              <div class="nudge-col-item">⚠️ KYC may apply</div>
              <div class="nudge-col-item">⚠️ Slower process</div>
            </div>
          </div>
          <div class="nudge-modal-actions">
            <button class="btn btn-primary" id="nudge-go-back" style="width:100%;">← Stay with Crypto (Save ${formatPrice(total * 0.049)})</button>
            <button class="btn btn-ghost nudge-continue-btn" id="nudge-confirm-card">Continue with Card anyway</button>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    attachEvents();
  }

  // ── Events ──
  function attachEvents() {
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

    // Choose card — show nudge first
    document.getElementById('pm-choose-card')?.addEventListener('click', () => {
      nudgeVisible = true;
      paymentMethod = 'card';
      render();
    });

    // Switch to crypto from card panel
    document.getElementById('switch-to-crypto')?.addEventListener('click', () => {
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

    // Nudge — confirmed card
    document.getElementById('nudge-confirm-card')?.addEventListener('click', () => {
      nudgeVisible = false;
      render();
    });

    // Go to full card checkout
    document.getElementById('go-to-card-checkout')?.addEventListener('click', () => {
      navigate('/checkout/card');
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
      const simBtn = document.getElementById('simulate-payment-btn');
      const statusMsg = document.getElementById('checkout-status-msg');
      const cartTotal = getCartTotal();
      simBtn.disabled = true;
      simBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;margin-right:8px;"></span> Processing...';
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'payment-status waiting';
        statusMsg.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Confirming transaction...';
      }
      setTimeout(async () => {
        try {
          const result = await addPurchaseAsync(cart, useCredits ? 'credits' : selectedCoin, useCredits);
          const purchasedCart = [...cart]; // snapshot before clearCart
          clearCart();

          if (statusMsg) {
            statusMsg.className = 'payment-status confirmed';
            statusMsg.innerHTML = useCredits ? '✓ Order Confirmed!' : '🕒 Awaiting Block Confirmation';
          }

          // Build per-item download cards
          const itemCards = purchasedCart.map(item => {
            const licenseKey = result?.licenses?.find?.(l => l.product_id === item.id)?.serial_key || null;
            const dlAvailable = useCredits; // only instant for credits; crypto pending admin verification
            return `
              <div style="background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.15);border-radius:12px;padding:var(--space-md) var(--space-lg);margin-bottom:var(--space-sm);">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-md);flex-wrap:wrap;">
                  <div>
                    <div style="font-weight:600;font-size:0.95rem;">${item.name}</div>
                    ${licenseKey ? `
                      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                        <code style="font-size:0.78rem;background:rgba(0,0,0,0.4);padding:3px 10px;border-radius:6px;letter-spacing:1px;color:var(--neon-green);">${licenseKey}</code>
                        <button class="co-copy-key-btn" data-key="${licenseKey}" style="font-size:0.72rem;padding:2px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:var(--text-muted);cursor:pointer;">Copy</button>
                      </div>
                    ` : `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">License key generates after payment confirmation</div>`}
                  </div>
                  ${dlAvailable
                    ? `<a href="/dashboard" class="btn btn-primary btn-sm" style="white-space:nowrap;">⬇ Download</a>`
                    : `<span style="font-size:0.8rem;color:var(--neon-orange);white-space:nowrap;">⏳ Pending</span>`
                  }
                </div>
              </div>`;
          }).join('');

          const successEl = document.createElement('div');
          successEl.className = 'co-success-banner animate-fade-in-up';
          successEl.innerHTML = `
            <div class="co-success-icon">🎉</div>
            <h3 style="color:var(--neon-green);margin-bottom:var(--space-sm);">
              ${useCredits ? 'Access Unlocked!' : 'Order Submitted!'}
            </h3>
            <p class="text-secondary text-sm" style="margin-bottom:var(--space-lg);">
              ${useCredits
                ? 'Your plugins are ready. Download them below or from your dashboard.'
                : 'Send the exact crypto amount. Once we verify your transaction, your downloads will appear in your dashboard.'}
            </p>
            <div style="margin-bottom:var(--space-lg);">${itemCards}</div>
            <button class="btn btn-primary" id="go-dashboard-btn" style="width:100%;">Go to My Dashboard →</button>
          `;
          const widget = document.querySelector('.co-crypto-widget') || document.querySelector('.co-credits-only-card');
          widget?.after(successEl);

          // Wire copy buttons
          successEl.querySelectorAll('.co-copy-key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              navigator.clipboard?.writeText(btn.dataset.key).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
              });
            });
          });

          document.getElementById('go-dashboard-btn')?.addEventListener('click', () => navigate('/dashboard'));
          simBtn.style.display = 'none';
          showToast(useCredits ? '🎉 Order complete! Downloads ready.' : '📨 Order submitted! Check dashboard after confirmation.', 'success');
        } catch (err) {
          showToast(err.message || 'Payment failed', 'error');
          simBtn.disabled = false;
          simBtn.textContent = '✅ I\'ve Sent the Payment';
          if (statusMsg) statusMsg.style.display = 'none';
        }
      }, 1500);
    });
  }

  render();
}
