// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Information Pages
// ═══════════════════════════════════════════════════════

export function renderAboutPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <h1 style="margin-bottom: var(--space-xl); text-align: center;">About ProMix</h1>
        <div class="card" style="padding: var(--space-2xl);">
          <div style="font-size: 48px; text-align: center; margin-bottom: var(--space-lg); color: var(--neon-green);">⚡</div>
          <h3 style="margin-bottom: var(--space-md); text-align: center;">Why are our prices so low?</h3>
          <p style="margin-bottom: var(--space-lg); font-size: var(--text-lg); line-height: 1.6; text-align: center;">
            <strong>ProMix is a company that has established exclusive deals with other hardware and software companies.</strong>
          </p>
          <p style="margin-bottom: var(--space-md); line-height: 1.7; color: var(--text-secondary);">
            Because of these strategic partnerships and bulk licensing agreements, we are able to offer our professional-grade audio plugins at prices up to <strong>70% lower</strong> than the standard market rate. We believe that studio-quality tools should be accessible to all producers and engineers, regardless of their budget.
          </p>
          <p style="line-height: 1.7; color: var(--text-secondary);">
            Our mission is to democratize music production by providing top-tier, low-CPU, 64-bit plugins without the premium price tag. Paired with modern payment options like cryptocurrency, we ensure instant, secure access to the tools you need to craft your perfect sound.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderFaqPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <h1 style="margin-bottom: var(--space-xl); text-align: center;">Frequently Asked Questions</h1>
        <div class="card" style="padding: var(--space-xl);">
          
          <div style="margin-bottom: var(--space-lg);">
            <h4 style="margin-bottom: var(--space-xs); color: var(--neon-green);">How do I install the plugins?</h4>
            <p class="text-secondary">After purchase, you will receive a download link and a license key in your Dashboard. Download the installer for your OS (Windows/macOS), run it, and enter your license key when opening the plugin in your DAW for the first time.</p>
          </div>
          
          <div style="margin-bottom: var(--space-lg);">
            <h4 style="margin-bottom: var(--space-xs); color: var(--neon-green);">Which DAWs are supported?</h4>
            <p class="text-secondary">Our plugins are provided in VST3, AU, and AAX formats, making them compatible with almost all major DAWs including FL Studio, Ableton Live, Logic Pro, Pro Tools, Cubase, and Studio One.</p>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <h4 style="margin-bottom: var(--space-xs); color: var(--neon-green);">Why are your prices 70% lower?</h4>
            <p class="text-secondary">ProMix has direct deals and bulk licensing agreements with other industry companies, allowing us to pass massive savings directly to you.</p>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <h4 style="margin-bottom: var(--space-xs); color: var(--neon-green);">How does crypto payment work?</h4>
            <p class="text-secondary">At checkout, select your preferred coin (BTC, ETH, USDT). You will be shown a wallet address and a QR code. Send the exact amount shown. The system will automatically detect the transaction and unlock your plugins.</p>
          </div>

          <div>
            <h4 style="margin-bottom: var(--space-xs); color: var(--neon-green);">Can I use one license on multiple computers?</h4>
            <p class="text-secondary">Yes, a single license key covers up to 3 of your personal machines (e.g., a studio desktop and a touring laptop) simultaneously.</p>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function renderSupportPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <h1 style="margin-bottom: var(--space-xl); text-align: center;">Support Center</h1>
        
        <div class="stats-row" style="grid-template-columns: 1fr 1fr; margin-bottom: var(--space-xl);">
          <div class="stat-card">
            <span class="stat-card-icon">📖</span>
            <h4>Manuals</h4>
            <p class="text-sm text-secondary">Download PDF guides for all plugins</p>
            <button class="btn btn-ghost btn-sm" style="margin-top: var(--space-md);">View Docs</button>
          </div>
          <div class="stat-card">
            <span class="stat-card-icon">🐛</span>
            <h4>Bug Report</h4>
            <p class="text-sm text-secondary">Found a glitch? Let our dev team know</p>
            <button class="btn btn-ghost btn-sm" style="margin-top: var(--space-md);">Submit Report</button>
          </div>
        </div>

        <div class="card" style="padding: var(--space-xl); text-align: center;">
          <h3 style="margin-bottom: var(--space-md);">Still need help?</h3>
          <p class="text-secondary" style="margin-bottom: var(--space-lg);">Check out our FAQ first. If you still have issues with installation, licensing, or payment, our support team is available 24/7.</p>
          <a href="/contact" class="btn btn-primary">Contact Support</a>
        </div>
      </div>
    </div>
  `;
}

export function renderRefundPolicyPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <h1 style="margin-bottom: var(--space-xl); text-align: center;">Refund Policy</h1>
        <div class="card" style="padding: var(--space-xl);">
          <p class="text-secondary" style="margin-bottom: var(--space-md);">
            Due to the nature of digital goods and our exceptionally low pricing model, <strong>all sales are final</strong>.
          </p>
          <h4 style="margin-top: var(--space-lg); margin-bottom: var(--space-xs);">Digital Software Downloads</h4>
          <p class="text-secondary" style="margin-bottom: var(--space-md);">
            Once a plugin is purchased and the license key is issued to your dashboard, we cannot revoke access. Therefore, we do not offer refunds, returns, or exchanges for any digital products downloaded from ProMix.
          </p>
          <h4 style="margin-top: var(--space-lg); margin-bottom: var(--space-xs);">Crypto Payments</h4>
          <p class="text-secondary" style="margin-bottom: var(--space-md);">
            Please note that cryptocurrency transactions (BTC, ETH, USDT) are irreversible. Ensure you are sending the exact amount to the correct wallet address provided at checkout. Overpayments or payments to the wrong network cannot be refunded.
          </p>
          <h4 style="margin-top: var(--space-lg); margin-bottom: var(--space-xs);">Exceptions</h4>
          <p class="text-secondary">
            The only exception to this policy is if a plugin is fundamentally broken and verified by our support team as incompatible with the advertised operating systems and DAWs, and we are unable to provide a fix within 30 days of your report.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderContactPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <h1 style="margin-bottom: var(--space-xl); text-align: center;">Contact Us</h1>
        
        <div class="card" style="padding: var(--space-xl);">
          <form id="contact-form" class="auth-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
              <div>
                <label>Name</label>
                <input type="text" class="input" placeholder="Your name" required />
              </div>
              <div>
                <label>Email</label>
                <input type="email" class="input" placeholder="you@example.com" required />
              </div>
            </div>
            
            <label style="margin-top: var(--space-md);">Subject</label>
            <select class="input">
              <option>General Inquiry</option>
              <option>Technical Support</option>
              <option>Payment Issue</option>
              <option>Partnership</option>
            </select>

            <label style="margin-top: var(--space-md);">Message</label>
            <textarea class="input" rows="5" placeholder="How can we help?" required style="resize: vertical; min-height: 120px;"></textarea>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-lg);">
              Send Message
            </button>
          </form>
        </div>

        <div style="margin-top: var(--space-xl); text-align: center; color: var(--text-secondary);">
          <p>Email: support@promixplugins.com</p>
          <p>Response Time: Usually within 24 hours</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    import('../components/Toast.js').then(({ showToast }) => {
      showToast('Message sent! We will get back to you soon.', 'success');
      e.target.reset();
    });
  });
}
