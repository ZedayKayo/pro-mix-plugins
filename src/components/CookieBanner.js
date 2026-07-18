// ═══════════════════════════════════════════════════════
// Afford Plugins — Cookie Consent Banner
// GDPR-compliant banner shown on first visit
// ═══════════════════════════════════════════════════════

const COOKIE_KEY = 'pm_cookie_consent';

export function initCookieBanner() {
  // Already consented
  if (localStorage.getItem(COOKIE_KEY)) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <div class="cookie-inner">
      <div class="cookie-text">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--neon-green)">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a1 1 0 1 0 1 1 1 1 0 0 0-1-1zm1 5H11v6h2z"/>
        </svg>
        <p>
          We use cookies to keep you logged in, remember your cart, and improve your experience.
          See our <a href="/privacy" id="cookie-privacy-link">Privacy Policy</a> for details.
        </p>
      </div>
      <div class="cookie-actions">
        <button class="btn btn-ghost btn-sm" id="cookie-decline">Decline</button>
        <button class="btn btn-primary btn-sm" id="cookie-accept">Accept All</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Animate in after a short delay
  requestAnimationFrame(() => {
    setTimeout(() => banner.classList.add('cookie-visible'), 600);
  });

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    dismissBanner(banner);
  });

  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    dismissBanner(banner);
  });

  document.getElementById('cookie-privacy-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    import('../core/router.js').then(({ navigate }) => navigate('/privacy'));
  });
}

function dismissBanner(banner) {
  banner.classList.remove('cookie-visible');
  banner.classList.add('cookie-hidden');
  setTimeout(() => banner?.remove(), 400);
}
