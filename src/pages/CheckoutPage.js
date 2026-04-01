// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Checkout Page (Crypto Payment)
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

  function render() {
    const user = getUser();
    const availableCredits = user ? (user.credits || 0) : 0;
    const cartTotal = getCartTotal();
    const canCoverWithCredits = availableCredits >= cartTotal;
    
    // If we have enough credits, provide the option to use them
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
            <!-- LEFT: Order Review -->
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
                    <div style="font-weight: var(--weight-semibold);">Your Credits Balance: 🎁 ${availableCredits}</div>
                    <div class="text-xs text-muted">1 Credit = $1 USD</div>
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
                <h4 style="margin-bottom: var(--space-md);">How to Pay</h4>
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
                <div class="payment-status waiting" style="margin-top: var(--space-lg);" id="payment-status" style="display:none;">
                  <span class="spinner"></span>
                  Processing credits...
                </div>
              </div>
              `}
            </div>

            <!-- RIGHT: Crypto Payment Widget -->
            <div class="animate-fade-in-up delay-2">
              <div class="crypto-payment-widget">
                <h3 style="margin-bottom: var(--space-md); text-align:center;">${useCredits ? 'Complete Order' : 'Pay with Crypto'}</h3>

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
                  <div class="amount">${useCredits ? `${cartTotal} Credits` : formatCrypto(finalCryptoTotal, selectedCoin)}</div>
                  <div class="usd">${useCredits ? '0 Balance Due' : `≈ ${finalTotalStr}`}</div>
                </div>

                ${!useCredits ? `
                <!-- QR Code -->
                <div class="qr-code-wrapper">
                  <div class="qr-code-box" id="qr-code-box">
                    ${qrSVG}
                  </div>
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

                <!-- Confirm Payment -->
                <button class="btn btn-primary" id="simulate-payment-btn" style="width:100%;">
                  ${useCredits ? '🎁 Complete Order with Credits' : '✅ I Have Paid (Verify Transaction)'}
                </button>
                <div id="checkout-status-msg" style="margin-top: var(--space-md); text-align: center; display: none;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Events
    // Toggle credits
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
      }).catch(() => {
        showToast('Failed to copy', 'error');
      });
    });

    // Simulate payment
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
          const result = await addPurchaseAsync(cart, useCredits ? 'credits' : selectedCoin, useCredits);
          clearCart();

          if (statusMsg) {
            statusMsg.className = 'payment-status confirmed';
            statusMsg.innerHTML = useCredits ? '✓ Order Confirmed!' : '🕒 Awaiting Block Confirmation';
            
            // Add instructions below the widget instead of wiping it
            const successOverlay = document.createElement('div');
            successOverlay.className = 'animate-fade-in-up delay-1';
            successOverlay.style.padding = 'var(--space-xl)';
            successOverlay.style.textAlign = 'center';
            successOverlay.style.background = 'var(--bg-card)';
            successOverlay.style.border = '1px solid var(--border-primary)';
            successOverlay.style.borderRadius = 'var(--radius-xl)';
            successOverlay.style.marginTop = 'var(--space-lg)';
            
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
            
            // Insert it after the widget widget
            document.querySelector('.crypto-payment-widget').after(successOverlay);
            
            document.getElementById('go-dashboard-btn')?.addEventListener('click', () => navigate('/dashboard'));
            
            // Hide the simulate button completely now that it's done
            simBtn.style.display = 'none';
          }

          showToast(useCredits ? 'Order complete! Your plugins are ready.' : 'Order submitted! Dashboard updated.', 'success');

        } catch (err) {
          showToast(err.message || 'Payment failed', 'error');
          simBtn.disabled = false;
          simBtn.textContent = 'Try Again';
          if (statusMsg) statusMsg.style.display = 'none';
        }
      }, 1500); // Network simulation
    });
  }

  render();
}
