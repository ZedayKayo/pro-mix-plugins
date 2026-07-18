// ═══════════════════════════════════════════════════════
// Afford Plugins — Email Capture Popup
// Shown to first-time visitors after 10 seconds
// ═══════════════════════════════════════════════════════

const POPUP_KEY = 'pm_email_popup_seen';

export function initEmailPopup() {
  // Already seen
  if (localStorage.getItem(POPUP_KEY)) return;

  setTimeout(() => {
    // Don't show on checkout/login/register pages
    const path = window.location.pathname;
    if (['/checkout', '/login', '/register', '/checkout/card'].some(p => path.startsWith(p))) return;

    renderPopup();
  }, 10000);
}

function renderPopup() {
  const overlay = document.createElement('div');
  overlay.id = 'email-popup-overlay';
  overlay.innerHTML = `
    <div class="epop-modal" role="dialog" aria-modal="true" aria-label="Special offer">
      <button class="epop-close" id="epop-close" aria-label="Close offer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="epop-badge">⚡ Exclusive Offer</div>

      <div class="epop-icon">🎛️</div>

      <h2 class="epop-title">Get 5% Off Your First Order</h2>
      <p class="epop-sub">
        Join 50,000+ producers. Get exclusive deals, new plugin alerts, and mixing tutorials — straight to your inbox.
      </p>

      <form id="epop-form" class="epop-form">
        <div class="epop-input-row">
          <input
            type="email"
            id="epop-email"
            class="input epop-input"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
          <button type="submit" class="btn btn-primary epop-submit-btn" id="epop-submit">
            Claim 5% Off
          </button>
        </div>
        <p class="epop-disclaimer">No spam. Unsubscribe anytime. Offer applies at checkout.</p>
      </form>

      <div id="epop-success" class="epop-success" style="display:none;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <h3>You're in!</h3>
        <p>Check your inbox — your <strong>5% off code</strong> is on the way.</p>
        <p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Use code <strong style="color:var(--neon-green);">WELCOME5</strong> at checkout.</p>
      </div>

      <button class="epop-skip" id="epop-skip">No thanks, I'll pay full price</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    setTimeout(() => overlay.classList.add('epop-visible'), 50);
  });

  const closePopup = () => {
    localStorage.setItem(POPUP_KEY, 'true');
    overlay.classList.remove('epop-visible');
    setTimeout(() => overlay?.remove(), 350);
  };

  document.getElementById('epop-close')?.addEventListener('click', closePopup);
  document.getElementById('epop-skip')?.addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
  });

  document.getElementById('epop-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('epop-submit');
    const email = document.getElementById('epop-email').value;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;"></span>Sending…';

    // Simulate API call — replace with your email service (e.g. Resend, Mailchimp)
    await new Promise(r => setTimeout(r, 1200));

    // Store discount code in session for use at checkout
    sessionStorage.setItem('pm_promo_code', 'WELCOME5');

    document.getElementById('epop-form').style.display = 'none';
    document.getElementById('epop-success').style.display = 'block';
    localStorage.setItem(POPUP_KEY, 'true');

    // Auto-close after 4s
    setTimeout(closePopup, 4000);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  }, { once: true });
}
