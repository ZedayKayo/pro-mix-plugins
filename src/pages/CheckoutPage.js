// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Checkout Page (Crypto Primary + Card Secondary)
// ═══════════════════════════════════════════════════════

import { getCart, getCartTotal, clearCart, addPurchaseAsync, isLoggedIn, getUser } from '../core/store.js';
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
        <h2>Nothing to checkout</h2>
        <p style="margin: var(--space-md) 0;">Your cart is empty.</p>
        <a href="/store" class="btn btn-primary">Browse Store</a>
      </div>
    `;
    return;
  }

  let selectedCoin = 'BTC';
  let useCredits = false;
  let nudgeModalVisible = false;

  function render() {
    const user = getUser();
    const availableCredits = user ? (user.credits || 0) : 0;
    const cartTotal = getCartTotal();
    const canCoverWithCredits = availableCredits >= cartTotal;

    let finalTotalStr = formatPrice(cartTotal);
    let finalCryptoTotal = cart.reduce((sum, item) => sum + (item.cryptoPrices?.[selectedCoin] || 0), 0);

    if (useCredits) {
      finalTotalStr = formatPrice(0);
      finalCryptoTotal = 0;
    }

    const wallet = wallets[selectedCoin];
    const instructions = getPaymentInstructions(selectedCoin);
    const qrSVG = generateQRCodeSVG(wallet.address);

    container.innerHTML = `
      <div class="section">
        <div class="container">
          <h1 style="margin-bottom: var(--space-xl); font-size: var(--text-2xl);">Checkout</h1>

          <div class="checkout-layout">
            <!-- LEFT: Order Review + Instructions -->
            <div class="animate-fade-in-up">
              <div class="card" style="padding: var(--space-lg); margin-bottom: var(--space-xl);">
                <h3 style="margin-bottom: var(--space-lg);">Order Review</h3>
                ${cart.map(item => `
                  <div class="flex items-center gap-md" style="padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-primary);">
                    <div style="flex:1;">
                      <div style="font-weight: var(--weight-semibold);">${item.name}</div>
                      <div class="text-xs text-muted">Digital download • Instant delivery</div>
                    </div>
                    <div style="font-weight: var(--weight-bold); color: var(--neon-green);">${formatPrice(item.price)}</div>
                  </div>
                `).join('')}

                ${availableCredits > 0 ? `
                <div class="flex items-center justify-between" style="padding: var(--space-md) 0; border-bottom: 1px solid var(--border-primary);">
                  <div>
                    <div style="font-weight: var(--weight-semibold);">Store Credit Balance: 💵 $${availableCredits}</div>
                    <div class="text-xs text-muted">$1 credit = $1 USD off your order</div>
                  </div>
                  ${canCoverWithCredits ? `
                    <label class="toggle-switch">
                      <input type="checkbox" id="use-credits-toggle" ${useCredits ? 'checked' : ''} />
                      <span class="toggle-slider"></span>
                    </label>
                  ` : `
                    <span class="text-sm text-secondary">Not enough to cover total</span>
                  `}
                </div>
                ` : ''}

                <div class="flex justify-between" style="padding-top: var(--space-lg); font-size: var(--text-lg); font-weight: var(--weight-bold);">
                  <span>Total</span>
                  <span style="color: var(--neon-green);">${finalTotalStr}</span>
                </div>
              </div>

              <!-- Payment Instructions -->
              ${!useCredits ? `
              <div class="card" style="padding: var(--space-lg);">
                <h4 style="margin-bottom: var(--space-md);">How to Pay with Crypto</h4>
                <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
                  ${instructions.steps.map((step, i) => `
                    <div class="flex items-center gap-sm">
                      <span class="badge badge-green" style="min-width:28px;justify-content:center;">${i + 1}</span>
                      <span class="text-sm">${step}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="payment-status waiting" style="margin-top: var(--space-lg);" id="payment-status">
                  <span class="spinner"></span>
                  Waiting for payment...
                </div>
              </div>
              ` : `
              <div class="card" style="padding: var(--space-lg); text-align: center;">
                <h4 style="margin-bottom: var(--space-md);">Pay with Credits</h4>
                <p class="text-secondary" style="margin-bottom: var(--space-lg);">You are fully covering this purchase with your ProMix credits!</p>
              </div>
              `}
            </div>

            <!-- RIGHT: Payment Method Selector -->
            <div class="animate-fade-in-up delay-2">

              <!-- OPTION A: Crypto (Primary) -->
              <div class="payment-method-card payment-method-primary" id="payment-option-crypto">
                <div class="payment-method-header">
                  <div class="payment-method-badge-recommended">⚡ RECOMMENDED</div>
                  <h3 class="payment-method-title">${useCredits ? 'Complete with Credits' : 'Pay with Crypto'}</h3>
                </div>

                ${!useCredits ? `
                <!-- Coin Tabs -->
                <div class="crypto-tabs" id="crypto-tabs">
                  ${supportedCoins.map(coin => `
                    <button class="crypto-tab ${coin === selectedCoin ? 'active' : ''}" data-coin="${coin}">
                      <span style="color: ${wallets[coin].color};">${wallets[coin].icon}</span> ${coin}
                    </button>
                  `).join('')}
                </div>
                ` : ''}

                <!-- Payment Amount -->
                <div class="payment-amount">
                  <div class="label">${useCredits ? 'Credits to Use' : 'Amount to Send'}</div>
                  <div class="amount">${useCredits ? `$${cartTotal} Credit` : formatCrypto(finalCryptoTotal, selectedCoin)}</div>
                  <div class="usd">${useCredits ? '$0 Balance Due' : `≈ ${finalTotalStr}`}</div>
                </div>

                ${!useCredits ? `
                <!-- QR Code -->
                <div class="qr-code-wrapper">
                  <div class="qr-code-box" id="qr-code-box">${qrSVG}</div>
                </div>

                <!-- Wallet Address -->
                <div class="wallet-address-box">
                  <div class="wallet-address" id="wallet-address">${wallet.address}</div>
                  <button class="copy-btn" id="copy-address-btn">Copy</button>
                </div>

                <div class="text-xs text-muted" style="text-align:center; margin-bottom: var(--space-md);">
                  Network: <strong>${wallet.network}</strong><br>
                  Estimated time: ${wallet.estimatedTime}
                </div>
                ` : ''}

                <!-- Benefits -->
                <div class="crypto-benefits">
                  <div class="crypto-benefit-item">✅ <span>Instant payment</span></div>
                  <div class="crypto-benefit-item">✅ <span>No verification required</span></div>
                  <div class="crypto-benefit-item">✅ <span>Zero extra fees</span></div>
                  <div class="crypto-benefit-item">✅ <span>Fastest delivery</span></div>
                </div>

                <!-- Confirm Payment -->
                <button class="btn btn-primary" id="simulate-payment-btn" style="width:100%;">
                  ${useCredits ? '🎁 Complete Order with Credits' : '✅ I Have Paid (Verify Transaction)'}
                </button>
                <div id="checkout-status-msg" style="margin-top: var(--space-md); text-align: center; display: none;"></div>
              </div>

              <!-- OPTION B: Card (Secondary) -->
              <div class="payment-method-card payment-method-secondary" id="payment-option-card">
                <div class="payment-method-header-secondary">
                  <div class="payment-method-card-icon">💳</div>
                  <div>
                    <h4 class="payment-method-title-secondary">Pay with Card</h4>
                    <p class="payment-method-subtitle">For users without crypto</p>
                  </div>
                </div>

                <div class="card-warnings">
                  <div class="card-warning-item">⚠️ <span>May require identity verification (KYC)</span></div>
                  <div class="card-warning-item">⚠️ <span>Processing fee: ~4.9% added to total</span></div>
                  <div class="card-warning-item">⚠️ <span>Some banks decline crypto purchases</span></div>
                  <div class="card-warning-item">⚠️ <span>Slower than direct crypto payment</span></div>
                </div>

                <button class="btn-card-method" id="open-card-checkout">
                  Continue with Card
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Nudge Modal -->
      ${nudgeModalVisible ? `
      <div class="nudge-modal-overlay" id="nudge-overlay">
        <div class="nudge-modal" id="nudge-modal">
          <div class="nudge-modal-icon">⚡</div>
          <h3 class="nudge-modal-title">Crypto is faster & cheaper</h3>
          <p class="nudge-modal-body">
            Direct crypto payments are instant, have <strong>zero extra fees</strong>, and require no identity verification.
            Card payments add ~4.9% fees and may require KYC.
          </p>
          
          <div class="nudge-comparison">
            <div class="nudge-col nudge-col-crypto">
              <div class="nudge-col-title">🟢 Pay with Crypto</div>
              <div class="nudge-col-item">✅ No extra fees</div>
              <div class="nudge-col-item">✅ No verification</div>
              <div class="nudge-col-item">✅ Instant access</div>
            </div>
            <div class="nudge-col nudge-col-card">
              <div class="nudge-col-title">🟡 Pay with Card</div>
              <div class="nudge-col-item">⚠️ +4.9% fee</div>
              <div class="nudge-col-item">⚠️ KYC may apply</div>
              <div class="nudge-col-item">⚠️ Slower delivery</div>
            </div>
          </div>

          <div class="nudge-modal-actions">
            <button class="btn btn-primary" id="nudge-go-back" style="width:100%;">
              ← Go Back (Recommended)
            </button>
            <button class="btn btn-ghost nudge-continue-btn" id="nudge-continue-card">
              Continue with Card
            </button>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    attachEvents();
  }

  function attachEvents() {
    // Credits toggle
    document.getElementById('use-credits-toggle')?.addEventListener('change', (e) => {
      useCredits = e.target.checked;
      render();
    });

    // Coin tabs
    document.querySelectorAll('#crypto-tabs .crypto-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        selectedCoin = tab.dataset.coin;
        render();
      });
    });

    // Copy address
    document.getElementById('copy-address-btn')?.addEventListener('click', () => {
      const address = document.getElementById('wallet-address').textContent;
      navigator.clipboard?.writeText(address).then(() => {
        showToast('Address copied to clipboard!', 'success');
        document.getElementById('copy-address-btn').textContent = 'Copied!';
        setTimeout(() => {
          const btn = document.getElementById('copy-address-btn');
          if (btn) btn.textContent = 'Copy';
        }, 2000);
      }).catch(() => showToast('Failed to copy', 'error'));
    });

    // Card button → show nudge
    document.getElementById('open-card-checkout')?.addEventListener('click', () => {
      nudgeModalVisible = true;
      render();
    });

    // Nudge — go back
    document.getElementById('nudge-go-back')?.addEventListener('click', () => {
      nudgeModalVisible = false;
      render();
    });

    // Close on overlay click
    document.getElementById('nudge-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('nudge-overlay')) {
        nudgeModalVisible = false;
        render();
      }
    });

    // Nudge — continue with card
    document.getElementById('nudge-continue-card')?.addEventListener('click', () => {
      nudgeModalVisible = false;
      navigate('/checkout/card');
    });

    // Verify crypto payment
    document.getElementById('simulate-payment-btn')?.addEventListener('click', () => {
      const simBtn = document.getElementById('simulate-payment-btn');
      const statusMsg = document.getElementById('checkout-status-msg');

      simBtn.disabled = true;
      simBtn.textContent = 'Processing...';

      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'payment-status waiting';
        statusMsg.innerHTML = '<span class="spinner"></span> Confirming transaction...';
      }

      setTimeout(async () => {
        try {
          await addPurchaseAsync(cart, useCredits ? 'credits' : selectedCoin, useCredits);
          clearCart();

          if (statusMsg) {
            statusMsg.className = 'payment-status confirmed';
            statusMsg.innerHTML = useCredits ? '✓ Order Confirmed!' : '🕒 Awaiting Block Confirmation';

            const successOverlay = document.createElement('div');
            successOverlay.className = 'animate-fade-in-up delay-1';
            successOverlay.style.cssText = 'padding:var(--space-xl);text-align:center;background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-xl);margin-top:var(--space-lg);';
            successOverlay.innerHTML = `
              <div style="font-size:48px; margin-bottom: var(--space-md);">🎉</div>
              <h3 style="color: var(--neon-green); margin-bottom: var(--space-md);">
                ${useCredits ? 'Success! Instant Access Unlocked.' : 'Your order is secure. Send crypto to unlock access instantly.'}
              </h3>
              <p class="text-secondary" style="margin-bottom: var(--space-lg);">
                ${useCredits ? 'Your plugins are ready.' : 'Once the network confirms the transaction, your plugins will be available.'}
                Visit your dashboard to view the status.
              </p>
              <div class="flex justify-center gap-md">
                <button class="btn btn-primary" id="go-dashboard-btn">Go to Dashboard</button>
              </div>
            `;

            document.querySelector('.crypto-payment-widget, .payment-method-primary')?.after(successOverlay);
            document.getElementById('go-dashboard-btn')?.addEventListener('click', () => navigate('/dashboard'));
            simBtn.style.display = 'none';
          }

          showToast(useCredits ? 'Order complete! Your plugins are ready.' : 'Order submitted! Dashboard updated.', 'success');
        } catch (err) {
          showToast(err.message || 'Payment failed', 'error');
          simBtn.disabled = false;
          simBtn.textContent = '✅ I Have Paid (Verify Transaction)';
          if (statusMsg) statusMsg.style.display = 'none';
        }
      }, 1500);
    });
  }

  render();
}
