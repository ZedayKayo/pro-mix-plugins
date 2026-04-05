// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Card Checkout (Mock Stripe Flow)
// 5-Step: Contact → Card Details → Billing → 3D Secure → Result
// ═══════════════════════════════════════════════════════

import { getCart, getCartTotal, clearCart, addPurchaseAsync, getUser } from '../core/store.js';
import { formatPrice } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';

// ── Card type detection ──
function detectCardType(number) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  return 'unknown';
}

function getCardIcon(type) {
  const icons = {
    visa: `<svg viewBox="0 0 48 16" width="48" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="13" font-family="Arial" font-size="14" font-weight="900" fill="#1A1F71" letter-spacing="-0.5">VISA</text>
    </svg>`,
    mastercard: `<svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="12" r="12" fill="#EB001B"/>
      <circle cx="24" cy="12" r="12" fill="#F79E1B"/>
      <path d="M19 4.8a12 12 0 0 1 0 14.4A12 12 0 0 1 19 4.8z" fill="#FF5F00"/>
    </svg>`,
    amex: `<svg viewBox="0 0 48 16" width="48" height="16" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="13" font-family="Arial" font-size="11" font-weight="900" fill="#2E77BC" letter-spacing="0.5">AMEX</text>
    </svg>`,
    discover: `<svg viewBox="0 0 60 16" width="60" height="16" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="13" font-family="Arial" font-size="10" font-weight="700" fill="#FF6600">DISCOVER</text>
    </svg>`,
    unknown: `<svg viewBox="0 0 32 24" width="32" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="4" fill="rgba(255,255,255,0.1)"/>
      <rect x="0" y="8" width="32" height="8" fill="rgba(255,255,255,0.05)"/>
    </svg>`,
  };
  return icons[type] || icons.unknown;
}

// ── Luhn check (real algorithm, always passes for mock) ──
function luhnCheck(num) {
  const arr = (num + '').split('').reverse().map(Number);
  const lastDigit = arr.shift();
  const sum = arr.reduce((acc, val, i) => {
    if (i % 2 === 0) { val *= 2; if (val > 9) val -= 9; }
    return acc + val;
  }, 0);
  return (sum + lastDigit) % 10 === 0;
}

// ── Format card number with spaces ──
function formatCardNumber(value, type) {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  if (type === 'amex') {
    // AMEX: 4-6-5
    const parts = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)];
    formatted = parts.filter(Boolean).join(' ');
  } else {
    // Standard: 4-4-4-4
    const parts = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12), digits.slice(12, 16)];
    formatted = parts.filter(Boolean).join(' ');
  }
  return formatted;
}

// ── Format expiry ──
function formatExpiry(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 3) {
    return digits.slice(0, 2) + ' / ' + digits.slice(2, 4);
  } else if (digits.length === 2 && value.slice(-1) !== '/') {
    return digits + ' / ';
  }
  return digits;
}

// ── Validate expiry ──
function isValidExpiry(value) {
  const clean = value.replace(/\s/g, '').replace('/', '');
  if (clean.length < 4) return false;
  const month = parseInt(clean.slice(0, 2), 10);
  const year = parseInt('20' + clean.slice(2, 4), 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month);
  return expDate > now;
}

// ── Decide mock outcome based on card number ──
function getMockDeclineReason(cardNumber) {
  const last4 = cardNumber.replace(/\s/g, '').slice(-4);
  // Special test numbers for decline simulation
  if (last4 === '0002') return 'declined';
  if (last4 === '0119') return 'insufficient_funds';
  if (last4 === '0069') return 'expired_card';
  if (last4 === '0127') return 'lost_card';
  return null; // success
}

// ── State ──
let step = 1; // 1=contact, 2=card, 3=billing, 4=3ds, 5=result
let formData = {
  email: '',
  nameOnCard: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  country: 'US',
  zip: '',
  saveCard: false,
};
let declineReason = null;
let orderId = null;

export function renderCardCheckoutPage() {
  // Reset state
  step = 1;
  formData = { email: '', nameOnCard: '', cardNumber: '', expiry: '', cvv: '', country: 'US', zip: '', saveCard: false };
  declineReason = null;
  orderId = null;

  const container = document.getElementById('page-content');
  const cart = getCart();
  const total = getCartTotal();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="scp-wrapper">
        <div style="text-align:center;padding:var(--space-4xl);">
          <div style="font-size:48px;margin-bottom:var(--space-lg);">🛒</div>
          <h2>Nothing to checkout</h2>
          <p style="color:var(--text-secondary);margin:var(--space-md) 0;">Your cart is empty.</p>
          <a href="/store" class="btn btn-primary">Browse Store</a>
        </div>
      </div>
    `;
    return;
  }

  renderStep(container, cart, total);
}

function renderStep(container, cart, total) {
  container.innerHTML = `
    <div class="scp-wrapper">
      ${step < 5 ? renderStripeHeader(cart, total) : ''}
      <div class="scp-body">
        ${renderStepContent(cart, total)}
      </div>
    </div>
  `;
  attachEvents(container, cart, total);
}

function renderStripeHeader(cart, total) {
  const steps = [
    { n: 1, label: 'Contact' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Billing' },
    { n: 4, label: 'Verify' },
  ];

  const stepBar = step <= 4 ? `
    <div class="scp-steps">
      ${steps.map((s, i) => `
        <div class="scp-step ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}">
          <div class="scp-step-dot">
            ${step > s.n ? `<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>` : s.n}
          </div>
          <span>${s.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="scp-step-line ${step > s.n ? 'done' : ''}"></div>` : ''}
      `).join('')}
    </div>
  ` : '';

  return `
    <div class="scp-header">
      <div class="scp-header-inner">
        <div class="scp-brand">
          <div class="scp-brand-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" fill="var(--neon-green)" opacity="0.9"/>
            </svg>
          </div>
          <span class="scp-brand-name">ProMix Checkout</span>
        </div>
        <div class="scp-secure-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor" opacity="0.7"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
          SSL Secured
        </div>
      </div>
      ${stepBar}
    </div>
  `;
}

function renderStepContent(cart, total) {
  switch (step) {
    case 1: return renderContactStep(cart, total);
    case 2: return renderCardStep(cart, total);
    case 3: return renderBillingStep(cart, total);
    case 4: return render3DSStep(total);
    case 5: return renderResultStep(cart, total);
    default: return '';
  }
}

// ─── Step 1: Contact ───────────────────────────────────────────────────────
function renderContactStep(cart, total) {
  const user = getUser();
  return `
    <div class="scp-layout">
      <div class="scp-form-col">
        <div class="scp-form-section animate-fade-in-up">
          <div class="scp-section-header">
            <span class="scp-section-num">1</span>
            <h2 class="scp-section-title">Contact information</h2>
          </div>
          
          <div class="scp-field">
            <label class="scp-label" for="scp-email">Email address</label>
            <input 
              type="email" 
              id="scp-email" 
              class="scp-input" 
              placeholder="you@example.com"
              value="${formData.email || (user?.email || '')}"
              autocomplete="email"
            />
            <div class="scp-field-hint">Order confirmation will be sent here</div>
          </div>

          <div class="scp-divider-text">Already have an account? <a href="/login" class="scp-link">Sign in</a></div>

          <button class="scp-btn-primary" id="scp-next-1">
            Continue to payment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          
          <div class="scp-back-row">
            <a href="/checkout" class="scp-back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Return to checkout
            </a>
          </div>
        </div>
      </div>
      ${renderOrderSidebar(cart, total)}
    </div>
  `;
}

// ── Express Pay Mock Buttons ─────────────────────────────────────────────
function renderExpressPayButtons() {
  return `
    <div class="scp-express-pay">
      <div class="scp-express-label">Express checkout</div>
      <div class="scp-express-btns">
        <button class="scp-express-btn scp-express-apple" id="scp-apple-pay" type="button">
          <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-105.5C218 739.8 167 623.1 167 512c0-174.4 116.1-299.8 286.1-299.8 80.5 0 142.5 40.5 190.8 40.5 45.6-.5 117.9-42.8 210.3-42.8zm-175-109.8c-4.2 18.6-11.3 35.4-22.4 50.6C778.5 302.8 746 329.2 707.4 329.2c-5.1 0-10.3-.6-15.4-1.2-2.3-22-2.3-44.7 5.5-65.7 9.7-35.4 28-72.2 57.6-96.8 14.5-11.9 36.4-24.2 53.7-29.7 3.2 17.9 3.2 35.9 0 53.8z"/>
          </svg>
          Apple Pay
        </button>
        <button class="scp-express-btn scp-express-google" id="scp-google-pay" type="button">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 9.5c3.5 0 6.5 1.2 9 3.3l6.8-6.8C35.7 2.6 30.2 0 24 0 14.7 0 6.7 5.5 2.7 13.5l7.9 6.1C12.3 13.8 17.7 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24.5c0-1.5-.1-3-.4-4.5H24v8.5h12.7c-.5 3-2.2 5.5-4.6 7.2l7.2 5.6C43.2 37.5 46.5 31.5 46.5 24.5z"/>
            <path fill="#FBBC05" d="M10.6 28.1C10 26.5 9.7 24.8 9.7 23s.5-3.5 1.1-5.1L2.9 11.8C1.1 15.4 0 19.6 0 24s1.1 8.6 2.9 12.2l7.7-8.1z"/>
            <path fill="#EA4335" d="M24 48c6.2 0 11.5-2 15.4-5.5l-7.2-5.6c-2.1 1.4-4.7 2.2-8.2 2.2-6.3 0-11.7-4.3-13.5-10.1l-7.9 6.1C6.7 42.5 14.7 48 24 48z"/>
          </svg>
          Google Pay
        </button>
      </div>
      <div class="scp-express-divider"><span>or pay with card</span></div>
    </div>
  `;
}

// ─── Step 2: Card Details ──────────────────────────────────────────────────
function renderCardStep(cart, total) {
  const cardType = detectCardType(formData.cardNumber);
  return `
    <div class="scp-layout">
      <div class="scp-form-col">
        <div class="scp-form-section animate-fade-in-up">
          <div class="scp-section-header">
            <span class="scp-section-num">2</span>
            <h2 class="scp-section-title">Payment details</h2>
          </div>
          ${renderExpressPayButtons()}

          <div class="scp-card-brands">
            <div class="scp-card-brand ${cardType === 'visa' ? 'active' : ''}">
              <svg viewBox="0 0 780 500" width="46" height="30"><rect width="780" height="500" rx="40" fill="#1A1F71"/><text x="390" y="320" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" fill="#fff" letter-spacing="-8">VISA</text></svg>
            </div>
            <div class="scp-card-brand ${cardType === 'mastercard' ? 'active' : ''}">
              <svg viewBox="0 0 131.4 86" width="46" height="30"><rect width="131.4" height="86" rx="8" fill="#252525"/><circle cx="45.7" cy="43" r="27.9" fill="#EB001B"/><circle cx="85.7" cy="43" r="27.9" fill="#F79E1B"/><path d="M65.7 20.8a27.9 27.9 0 0 1 0 44.4 27.9 27.9 0 0 1 0-44.4z" fill="#FF5F00"/></svg>
            </div>
            <div class="scp-card-brand ${cardType === 'amex' ? 'active' : ''}">
              <svg viewBox="0 0 131.4 86" width="46" height="30"><rect width="131.4" height="86" rx="8" fill="#2E77BC"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="#fff" letter-spacing="2">AMEX</text></svg>
            </div>
            <div class="scp-card-brand ${cardType === 'discover' ? 'active' : ''}">
              <svg viewBox="0 0 131.4 86" width="46" height="30"><rect width="131.4" height="86" rx="8" fill="#fff"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#FF6600" letter-spacing="1">DISCOVER</text></svg>
            </div>
          </div>

          <div class="scp-field">
            <label class="scp-label" for="scp-cardnumber">Card number</label>
            <div class="scp-card-input-wrap">
              <input 
                type="text" 
                id="scp-cardnumber" 
                class="scp-input scp-card-number-input" 
                placeholder="1234 5678 9012 3456"
                value="${formData.cardNumber}"
                maxlength="23"
                autocomplete="cc-number"
                inputmode="numeric"
              />
              <div class="scp-card-type-icon" id="scp-card-type-icon">
                ${getCardIcon(cardType)}
              </div>
            </div>
            <div class="scp-field-hint scp-test-hint">
              Test: Use any valid-looking number. End in <code>0002</code> to decline, <code>0119</code> for insufficient funds.
            </div>
          </div>

          <div class="scp-row-2">
            <div class="scp-field">
              <label class="scp-label" for="scp-expiry">Expiration date</label>
              <input 
                type="text" 
                id="scp-expiry" 
                class="scp-input" 
                placeholder="MM / YY"
                value="${formData.expiry}"
                maxlength="9"
                autocomplete="cc-exp"
                inputmode="numeric"
              />
            </div>
            <div class="scp-field">
              <label class="scp-label" for="scp-cvv">
                Security code
                <span class="scp-cvv-tooltip" data-tooltip="3-digit code on back of card (Amex: 4 digits on front)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </span>
              </label>
              <input 
                type="text" 
                id="scp-cvv" 
                class="scp-input" 
                placeholder="CVV"
                value="${formData.cvv}"
                maxlength="4"
                autocomplete="cc-csc"
                inputmode="numeric"
              />
            </div>
          </div>

          <div class="scp-field">
            <label class="scp-label" for="scp-name">Name on card</label>
            <input 
              type="text" 
              id="scp-name" 
              class="scp-input" 
              placeholder="Full name"
              value="${formData.nameOnCard}"
              autocomplete="cc-name"
            />
          </div>

          <label class="scp-checkbox-row" id="scp-save-card-label">
            <input type="checkbox" id="scp-save-card" ${formData.saveCard ? 'checked' : ''} />
            <span class="scp-checkbox-custom"></span>
            <span>Securely save card for future purchases</span>
          </label>

          <button class="scp-btn-primary" id="scp-next-2">
            Continue to billing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <div class="scp-back-row">
            <button class="scp-back-link" id="scp-back-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Back
            </button>
          </div>
        </div>
      </div>
      ${renderOrderSidebar(cart, total)}
    </div>
  `;
}

// ─── Step 3: Billing Address ───────────────────────────────────────────────
function renderBillingStep(cart, total) {
  const countries = [
    ['US','United States'],['GB','United Kingdom'],['CA','Canada'],['AU','Australia'],
    ['DE','Germany'],['FR','France'],['NL','Netherlands'],['ES','Spain'],['IT','Italy'],
    ['JP','Japan'],['KR','South Korea'],['BR','Brazil'],['MX','Mexico'],['NG','Nigeria'],
    ['ZA','South Africa'],['IN','India'],['PK','Pakistan'],['EG','Egypt'],['AE','UAE'],
    ['SG','Singapore'],['ID','Indonesia'],['TR','Turkey'],['PL','Poland'],['SE','Sweden'],
  ];

  return `
    <div class="scp-layout">
      <div class="scp-form-col">
        <div class="scp-form-section animate-fade-in-up">
          <div class="scp-section-header">
            <span class="scp-section-num">3</span>
            <h2 class="scp-section-title">Billing address</h2>
          </div>

          <div class="scp-field">
            <label class="scp-label" for="scp-country">Country or region</label>
            <div class="scp-select-wrap">
              <select id="scp-country" class="scp-input scp-select">
                ${countries.map(([code, name]) => `<option value="${code}" ${formData.country === code ? 'selected' : ''}>${name}</option>`).join('')}
              </select>
              <svg class="scp-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
          </div>

          <div class="scp-field">
            <label class="scp-label" for="scp-zip">ZIP / Postal code</label>
            <input 
              type="text" 
              id="scp-zip" 
              class="scp-input" 
              placeholder="12345"
              value="${formData.zip}"
              autocomplete="postal-code"
            />
          </div>

          <div class="scp-order-summary-mobile">
            ${renderOrderSummaryContent(cart, total)}
          </div>

          <div class="scp-pay-now-total">
            <div class="scp-pay-label">Total due today</div>
            <div class="scp-pay-amount">${formatPrice(total)}</div>
          </div>

          <button class="scp-btn-pay" id="scp-next-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor" opacity="0.6"/></svg>
            Pay ${formatPrice(total * 1.049)}
          </button>
          <p class="scp-pay-notice">
            By confirming payment, you agree to our <a href="/refunds" class="scp-link">refund policy</a>.
          </p>
          <div class="scp-trust-badges">
            <div class="scp-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="#00b37d"/></svg>
              SSL Secured
            </div>
            <div class="scp-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#635bff" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#635bff" stroke-width="2"/></svg>
              PCI DSS
            </div>
            <div class="scp-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f7931a" stroke-width="2"/><path d="M12 8v4l3 3" stroke="#f7931a" stroke-width="2" stroke-linecap="round"/></svg>
              3D Secure
            </div>
            <div class="scp-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#00b37d" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="10" stroke="#00b37d" stroke-width="2"/></svg>
              Verified
            </div>
          </div>
          <div class="scp-back-row">
            <button class="scp-back-link" id="scp-back-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Back
            </button>
          </div>
        </div>
      </div>
      ${renderOrderSidebar(cart, total)}
    </div>
  `;
}

// ─── Step 4: 3D Secure ─────────────────────────────────────────────────────
function render3DSStep(total) {
  const maskedCard = '•••• •••• •••• ' + formData.cardNumber.replace(/\s/g, '').slice(-4);
  const cardType = detectCardType(formData.cardNumber);
  const bankName = getBankName(formData.cardNumber);

  return `
    <div class="scp-3ds-wrapper animate-fade-in-up">
      <div class="scp-3ds-backdrop"></div>

      <!-- Pulsing security ring backdrop -->
      <div class="scp-3ds-security-pulse">
        <div class="scp-3ds-pulse-ring r1"></div>
        <div class="scp-3ds-pulse-ring r2"></div>
        <div class="scp-3ds-pulse-ring r3"></div>
      </div>
      
      <div class="scp-3ds-container">
        <!-- Left: Security Frame -->
        <div class="scp-3ds-left">
          <div class="scp-3ds-merchant-info">
            <div class="scp-brand-logo-lg">
              <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" fill="var(--neon-green)" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <div class="scp-3ds-merchant-name">Pro-Mix Plugins</div>
              <div class="scp-3ds-merchant-amount">${formatPrice(total)}</div>
            </div>
          </div>
          
          <div class="scp-3ds-card-preview">
            <div class="scp-3ds-card-chip"></div>
            <div class="scp-3ds-card-num">${maskedCard}</div>
            <div class="scp-3ds-card-footer">
              <div>${formData.nameOnCard || 'CARD HOLDER'}</div>
              <div class="scp-3ds-card-brand">${getCardIcon(cardType)}</div>
            </div>
          </div>

          <div class="scp-3ds-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/></svg>
            Secured by 3D Secure 2.0
          </div>

          <div class="scp-3ds-network-logos">
            <div class="scp-3ds-net-logo" title="Verified by Visa">
              <svg viewBox="0 0 780 500" width="36" height="23"><rect width="780" height="500" rx="40" fill="#1A1F71"/><text x="390" y="320" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" fill="#fff" letter-spacing="-8">VISA</text></svg>
            </div>
            <div class="scp-3ds-net-logo" title="Mastercard Identity Check">
              <svg viewBox="0 0 131.4 86" width="36" height="23"><rect width="131.4" height="86" rx="5" fill="#252525"/><circle cx="45.7" cy="43" r="27.9" fill="#EB001B"/><circle cx="85.7" cy="43" r="27.9" fill="#F79E1B"/><path d="M65.7 20.8a27.9 27.9 0 0 1 0 44.4 27.9 27.9 0 0 1 0-44.4z" fill="#FF5F00"/></svg>
            </div>
            <div class="scp-3ds-net-logo" title="AmEx SafeKey">
              <svg viewBox="0 0 131.4 86" width="36" height="23"><rect width="131.4" height="86" rx="5" fill="#2E77BC"/><text x="65.7" y="56" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="#fff" letter-spacing="2">AMEX</text></svg>
            </div>
          </div>
        </div>

        <!-- Right: Bank Challenge -->
        <div class="scp-3ds-right">
          <div class="scp-3ds-bank-header">
            <div class="scp-3ds-bank-logo">${bankName.charAt(0)}</div>
            <div>
              <div class="scp-3ds-bank-name">${bankName}</div>
              <div class="scp-3ds-bank-subtitle">Authentication Required</div>
            </div>
          </div>

          <p class="scp-3ds-desc">
            ${bankName} requires additional verification for this transaction.
            Enter the one-time code sent to your registered mobile number ending in <strong>••9 4</strong>.
          </p>

          <div class="scp-3ds-otp-wrap">
            <label class="scp-label">One-time passcode</label>
            <div class="scp-otp-inputs">
              <input type="text" class="scp-otp-digit" id="otp-0" maxlength="1" inputmode="numeric" placeholder="—"/>
              <input type="text" class="scp-otp-digit" id="otp-1" maxlength="1" inputmode="numeric" placeholder="—"/>
              <input type="text" class="scp-otp-digit" id="otp-2" maxlength="1" inputmode="numeric" placeholder="—"/>
              <input type="text" class="scp-otp-digit" id="otp-3" maxlength="1" inputmode="numeric" placeholder="—"/>
              <input type="text" class="scp-otp-digit" id="otp-4" maxlength="1" inputmode="numeric" placeholder="—"/>
              <input type="text" class="scp-otp-digit" id="otp-5" maxlength="1" inputmode="numeric" placeholder="—"/>
            </div>
            <div class="scp-3ds-hint">Hint: any 6-digit code works in this demo</div>
          </div>

          <div class="scp-3ds-resend">
            Didn't receive a code? <button class="scp-link-btn" id="scp-3ds-resend">Resend →</button>
          </div>

          <button class="scp-btn-primary" id="scp-verify-3ds">
            Verify & Complete Payment
          </button>

          <button class="scp-btn-cancel" id="scp-cancel-3ds">Cancel transaction</button>
        </div>
      </div>
    </div>
  `;
}

function getBankName(cardNumber) {
  const n = cardNumber.replace(/\s/g, '');
  // Simulated bank names based on first digit(s)
  if (n.startsWith('4111') || n.startsWith('4000')) return 'Visa Secure Bank';
  if (/^4/.test(n)) return 'Chase Secure Bank';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard Identity Check';
  if (/^3[47]/.test(n)) return 'American Express SafeKey';
  if (/^6/.test(n)) return 'Discover ProtectBuy';
  return 'Secure Bank Verification';
}

// ─── Step 5: Result ────────────────────────────────────────────────────────
function renderResultStep(cart, total) {
  if (declineReason) {
    return renderDeclineStep();
  }
  return renderSuccessStep(cart, total);
}

function renderSuccessStep(cart, total) {
  const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const mockRef = 'PMX-' + Math.random().toString(36).toUpperCase().slice(2, 10);

  return `
    <div class="scp-result-wrapper animate-fade-in-up">
      <div class="scp-success-icon-wrap">
        <div class="scp-success-ring scp-success-ring-1"></div>
        <div class="scp-success-ring scp-success-ring-2"></div>
        <div class="scp-success-check">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M8 20l8 8 16-14" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="scp-check-path"/>
          </svg>
        </div>
      </div>

      <h1 class="scp-result-title">Payment successful!</h1>
      <p class="scp-result-subtitle">Thank you for your purchase. Your digital products are being prepared.</p>

      <div class="scp-receipt-card">
        <div class="scp-receipt-header">
          <span>Receipt</span>
          <span class="scp-receipt-ref">${mockRef}</span>
        </div>
        ${cart.map(item => `
          <div class="scp-receipt-item">
            <span>${item.name}</span>
            <span>${formatPrice(item.price)}</span>
          </div>
        `).join('')}
        <div class="scp-receipt-divider"></div>
        <div class="scp-receipt-item scp-receipt-total">
          <span>Total charged</span>
          <span>${formatPrice(total)}</span>
        </div>
        <div class="scp-receipt-item">
          <span style="color:var(--text-tertiary);font-size:var(--text-xs);">Card ending in</span>
          <span style="color:var(--text-secondary);font-size:var(--text-xs);font-family:var(--font-mono);">•••• ${last4}</span>
        </div>
        <div class="scp-receipt-item">
          <span style="color:var(--text-tertiary);font-size:var(--text-xs);">Date</span>
          <span style="color:var(--text-secondary);font-size:var(--text-xs);">${dateStr}</span>
        </div>
        <div class="scp-receipt-item">
          <span style="color:var(--text-tertiary);font-size:var(--text-xs);">Confirmation sent to</span>
          <span style="color:var(--text-secondary);font-size:var(--text-xs);">${formData.email}</span>
        </div>
      </div>

      <div class="scp-result-actions">
        <button class="scp-btn-primary" id="scp-go-dashboard">
          View my downloads
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <a href="/store" class="scp-btn-ghost">Continue shopping</a>
      </div>

      <div class="scp-order-notice">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        In a real store, your order would now be confirmed and download links generated automatically.
        For this demo, go to your <a href="/dashboard" class="scp-link">dashboard</a> to view pending orders.
      </div>
    </div>
  `;
}

function renderDeclineStep() {
  const declineMessages = {
    declined: {
      title: 'Card declined',
      desc: 'Your card was declined. Please try a different payment method or contact your bank.',
      icon: '🚫',
    },
    insufficient_funds: {
      title: 'Insufficient funds',
      desc: 'Your card does not have enough funds for this transaction. Please use a different card.',
      icon: '💳',
    },
    expired_card: {
      title: 'Card expired',
      desc: 'Your card has expired. Please update your card details or use a different card.',
      icon: '📅',
    },
    lost_card: {
      title: 'Card unavailable',
      desc: 'We were unable to process your card. Please contact your card issuer.',
      icon: '⛔',
    },
  };

  const msg = declineMessages[declineReason] || declineMessages.declined;

  return `
    <div class="scp-result-wrapper animate-fade-in-up">
      <div class="scp-decline-icon">${msg.icon}</div>
      <h1 class="scp-result-title scp-decline-title">Payment failed</h1>
      <div class="scp-decline-reason">${msg.title}</div>
      <p class="scp-result-subtitle">${msg.desc}</p>

      <div class="scp-decline-actions">
        <button class="scp-btn-primary" id="scp-retry-card">
          Try a different card
        </button>
        <a href="/checkout" class="scp-btn-ghost">
          Pay with crypto instead
        </a>
      </div>

      <div class="scp-decline-help">
        <strong>Need help?</strong> Contact us at <a href="mailto:support@promixplugins.com" class="scp-link">support@promixplugins.com</a>
      </div>
    </div>
  `;
}

// ─── Order Sidebar ─────────────────────────────────────────────────────────
function renderOrderSidebar(cart, total) {
  return `
    <div class="scp-sidebar">
      <div class="scp-sidebar-inner">
        ${renderOrderSummaryContent(cart, total)}
      </div>
    </div>
  `;
}

function renderOrderSummaryContent(cart, total) {
  return `
    <div class="scp-summary-title">Order summary</div>
    <div class="scp-summary-items">
      ${cart.map(item => `
        <div class="scp-summary-item">
          <div class="scp-summary-item-img">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : `<div class="scp-summary-item-placeholder">🎛</div>`}
            <span class="scp-summary-item-qty">1</span>
          </div>
          <div class="scp-summary-item-info">
            <div class="scp-summary-item-name">${item.name}</div>
            <div class="scp-summary-item-type">Digital plugin • Instant delivery</div>
          </div>
          <div class="scp-summary-item-price">${formatPrice(item.price)}</div>
        </div>
      `).join('')}
    </div>
    <div class="scp-summary-divider"></div>
    <div class="scp-summary-row">
      <span>Subtotal</span>
      <span>${formatPrice(total)}</span>
    </div>
    <div class="scp-summary-row">
      <span>Processing fee</span>
      <span class="scp-fee-warning">+${formatPrice(total * 0.049)} (4.9%)</span>
    </div>
    <div class="scp-summary-row scp-summary-total">
      <span>Total</span>
      <span>${formatPrice(total * 1.049)}</span>
    </div>
    <div class="scp-summary-secure">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/></svg>
      Secured by 256-bit SSL encryption
    </div>
    <div class="scp-crypto-nudge">
      <a href="/checkout" class="scp-crypto-nudge-link">
        ⚡ Save 4.9% — pay with crypto instead
      </a>
    </div>
  `;
}

// ─── Event Handlers ────────────────────────────────────────────────────────
function attachEvents(container, cart, total) {
  // Step 1
  if (step === 1) {
    const btn = container.querySelector('#scp-next-1');
    const emailInput = container.querySelector('#scp-email');
    btn?.addEventListener('click', () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        shakeInput(emailInput);
        showFieldError(emailInput, 'Please enter a valid email address');
        return;
      }
      formData.email = email;
      step = 2;
      renderStep(container, cart, total);
    });
    emailInput?.addEventListener('keydown', e => { if (e.key === 'Enter') btn?.click(); });
  }

  // Step 2
  if (step === 2) {
    const cardInput = container.querySelector('#scp-cardnumber');
    const expiryInput = container.querySelector('#scp-expiry');
    const cvvInput = container.querySelector('#scp-cvv');
    const nameInput = container.querySelector('#scp-name');
    const saveCardInput = container.querySelector('#scp-save-card');
    const cardTypeIcon = container.querySelector('#scp-card-type-icon');

    // Live card number formatting
    cardInput?.addEventListener('input', (e) => {
      const type = detectCardType(e.target.value);
      const maxLen = type === 'amex' ? 18 : 23;
      e.target.value = formatCardNumber(e.target.value, type);
      if (e.target.value.length > maxLen) e.target.value = e.target.value.slice(0, maxLen);
      if (cardTypeIcon) cardTypeIcon.innerHTML = getCardIcon(type);
      // Update brand highlights
      container.querySelectorAll('.scp-card-brand').forEach(el => el.classList.remove('active'));
      const brandEl = container.querySelector(`.scp-card-brand:nth-child(${
        type === 'visa' ? 1 : type === 'mastercard' ? 2 : type === 'amex' ? 3 : type === 'discover' ? 4 : 0
      })`);
      if (brandEl) brandEl.classList.add('active');
    });

    // Live expiry formatting
    expiryInput?.addEventListener('input', (e) => {
      const prev = e.target.value;
      e.target.value = formatExpiry(e.target.value);
      // Auto advance
      if (e.target.value.length === 7) cvvInput?.focus();
    });
    expiryInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && expiryInput.value.slice(-2) === '/ ') {
        expiryInput.value = expiryInput.value.slice(0, -3);
        e.preventDefault();
      }
    });

    // CVV: digits only
    cvvInput?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      if (e.target.value.length >= 4) nameInput?.focus();
    });

    // Next
    const btn = container.querySelector('#scp-next-2');
    btn?.addEventListener('click', () => {
      const card = cardInput?.value || '';
      const exp = expiryInput?.value || '';
      const cvv = cvvInput?.value || '';
      const name = nameInput?.value || '';

      const cardDigits = card.replace(/\s/g, '');
      if (cardDigits.length < 13) { shakeInput(cardInput); showFieldError(cardInput, 'Enter a valid card number'); return; }
      if (!isValidExpiry(exp)) { shakeInput(expiryInput); showFieldError(expiryInput, 'Enter a valid expiry date'); return; }
      if (cvv.length < 3) { shakeInput(cvvInput); showFieldError(cvvInput, 'Enter your security code'); return; }
      if (!name.trim()) { shakeInput(nameInput); showFieldError(nameInput, 'Enter the name on your card'); return; }

      formData.cardNumber = card;
      formData.expiry = exp;
      formData.cvv = cvv;
      formData.nameOnCard = name;
      formData.saveCard = saveCardInput?.checked || false;

      step = 3;
      renderStep(container, cart, total);
    });

    container.querySelector('#scp-back-1')?.addEventListener('click', () => {
      step = 1;
      renderStep(container, cart, total);
    });
  }

  // Step 3
  if (step === 3) {
    const btn = container.querySelector('#scp-next-3');
    const zipInput = container.querySelector('#scp-zip');
    const countrySelect = container.querySelector('#scp-country');

    btn?.addEventListener('click', () => {
      const zip = zipInput?.value.trim();
      const country = countrySelect?.value;
      if (!zip) { shakeInput(zipInput); showFieldError(zipInput, 'Enter your ZIP / postal code'); return; }

      formData.zip = zip;
      formData.country = country;

      // Determine outcome before showing 3DS
      declineReason = getMockDeclineReason(formData.cardNumber);
      step = 4;
      renderStep(container, cart, total);
      // Auto-proceed to 3DS animation (timer)
    });

    container.querySelector('#scp-back-2')?.addEventListener('click', () => {
      step = 2;
      renderStep(container, cart, total);
    });
  }

  // Step 4 — 3DS
  if (step === 4) {
    // OTP auto-advance
    const otpInputs = container.querySelectorAll('.scp-otp-digit');
    otpInputs.forEach((input, idx) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && idx < otpInputs.length - 1) {
          otpInputs[idx + 1].focus();
        }
        // If all filled
        const code = Array.from(otpInputs).map(i => i.value).join('');
        if (code.length === 6) {
          container.querySelector('#scp-verify-3ds')?.classList.add('scp-btn-ready');
        }
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          otpInputs[idx - 1].focus();
        }
      });
    });

    // Focus first OTP digit
    setTimeout(() => otpInputs[0]?.focus(), 100);

    // Resend
    container.querySelector('#scp-3ds-resend')?.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('A new code has been sent to your phone', 'success');
    });

    // Verify
    container.querySelector('#scp-verify-3ds')?.addEventListener('click', () => {
      const code = Array.from(otpInputs).map(i => i.value).join('');
      if (code.length < 6) {
        showToast('Please enter the 6-digit code', 'error');
        return;
      }

      const verifyBtn = container.querySelector('#scp-verify-3ds');
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `<span class="scp-spinner"></span> Verifying...`;

      // Simulate processing
      setTimeout(async () => {
        try {
          // Fire the (mock) purchase through the store
          const user = getUser();
          if (user) {
            try {
              await addPurchaseAsync(cart, 'card', false);
              clearCart();
            } catch (e) {
              // Mock even if DB call fails — the UI still shows success for demo
              console.warn('Mock order note:', e.message);
            }
          }
        } catch (e) {}

        step = 5;
        renderStep(container, cart, total);
      }, 2200);
    });

    // Cancel
    container.querySelector('#scp-cancel-3ds')?.addEventListener('click', () => {
      declineReason = 'declined';
      step = 5;
      renderStep(container, cart, total);
    });
  }

  // Step 5
  if (step === 5) {
    container.querySelector('#scp-go-dashboard')?.addEventListener('click', () => navigate('/dashboard'));
    container.querySelector('#scp-retry-card')?.addEventListener('click', () => {
      declineReason = null;
      step = 2;
      renderStep(container, cart, total);
    });
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function shakeInput(input) {
  if (!input) return;
  input.classList.remove('scp-shake');
  void input.offsetWidth;
  input.classList.add('scp-shake');
  input.classList.add('scp-input-error');
  setTimeout(() => input.classList.remove('scp-shake'), 600);
}

function showFieldError(input, msg) {
  if (!input) return;
  let errEl = input.parentElement.querySelector('.scp-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'scp-error';
    input.after(errEl);
  }
  errEl.textContent = msg;
  input.addEventListener('input', () => {
    errEl.textContent = '';
    input.classList.remove('scp-input-error');
  }, { once: true });
}
