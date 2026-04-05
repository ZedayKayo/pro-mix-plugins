// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Information Pages (Enhanced)
// About, FAQ, Support, Refund Policy, Contact
// ═══════════════════════════════════════════════════════

import { getDiscountPct } from '../services/discountService.js';

// ── ABOUT PAGE ─────────────────────────────────────────
export function renderAboutPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Our Story
        </span>
        <h1>Built for Producers,<br/>Priced for Everyone</h1>
        <p>ProMix was founded on a single belief: studio-quality tools should not be a luxury. We struck exclusive partnerships so you don't have to pay full retail — ever.</p>
      </div>
    </div>

    <div class="section">
      <div class="container">

        <!-- Story + stats -->
        <div class="about-story animate-fade-in-up">
          <div class="about-story-text">
            <div class="section-title"><h2>Why Are Our Prices ${getDiscountPct()}% Lower?</h2></div>
            <p>ProMix has established direct licensing agreements and bulk partnership deals with leading audio software developers. These are the same studios, engineers, and brands behind the plugins you already use — FabFilter, iZotope, Arturia, Waves, and more.</p>
            <p>Because we sell volume, our partners pass extraordinary savings directly to us. We pass every cent of that saving directly to you. There are no middlemen, no subscriptions, no hidden fees.</p>
            <p>Our mission is to democratize music production. A bedroom producer in Lagos or Lahore should have access to the same tools as an engineer at Abbey Road — and now they do.</p>
            <div style="margin-top:var(--space-xl);">
              <a href="/store" class="btn btn-primary">Shop the Catalog</a>
              <a href="/faq" class="btn btn-ghost" style="margin-left:var(--space-md);">Read the FAQ</a>
            </div>
          </div>
          <div class="about-story-visual">
            <div class="about-stat-card">
              <span class="about-stat-num">200+</span>
              <span class="about-stat-label">Plugins Available</span>
            </div>
            <div class="about-stat-card">
              <span class="about-stat-num">${getDiscountPct()}%</span>
              <span class="about-stat-label">Below Retail Price</span>
            </div>
            <div class="about-stat-card">
              <span class="about-stat-num">24/7</span>
              <span class="about-stat-label">Support Available</span>
            </div>
            <div class="about-stat-card">
              <span class="about-stat-num">∞</span>
              <span class="about-stat-label">Lifetime License</span>
            </div>
          </div>
        </div>

        <!-- Values -->
        <div style="margin-top:var(--space-3xl);">
          <div class="section-title"><h2>What We Stand For</h2></div>
          <div class="about-values">
            <div class="about-value-card">
              <span class="about-value-icon">⚡</span>
              <h3>Accessibility</h3>
              <p>Professional tools at prices that work for every budget — from hobbyist to full-time studio engineer.</p>
            </div>
            <div class="about-value-card">
              <span class="about-value-icon">🔐</span>
              <h3>Security</h3>
              <p>Crypto-first payments, instant digital delivery, and encrypted license management. Your money and your plugins are safe.</p>
            </div>
            <div class="about-value-card">
              <span class="about-value-icon">🎯</span>
              <h3>Quality</h3>
              <p>We only partner with developers who meet our standard. Every plugin on ProMix is industry-validated and professionally reviewed.</p>
            </div>
          </div>
        </div>

        <!-- Partners -->
        <div style="margin-top:var(--space-3xl);text-align:center;">
          <div class="section-title" style="justify-content:center;"><h2>Our Developer Partners</h2></div>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);max-width:500px;margin-left:auto;margin-right:auto;">We work directly with these studios and developers to bring you their software at exclusive pricing.</p>
          <div class="about-partners">
            ${['FabFilter','iZotope','Arturia','Waves Audio','Native Instruments','Spectrasonics','u-he','Valhalla DSP','SoundToys','Plugin Alliance','Baby Audio','Kilohearts'].map(p => `
            <span class="about-partner-chip">${p}</span>`).join('')}
          </div>
        </div>

        <!-- CTA -->
        <div style="margin-top:var(--space-3xl);padding:var(--space-3xl);background:linear-gradient(135deg,rgba(0,255,136,0.06),rgba(0,212,255,0.04));border:1px solid rgba(0,255,136,0.15);border-radius:var(--radius-xl);text-align:center;">
          <h2 style="margin-bottom:var(--space-md);">Start Your Collection Today</h2>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);max-width:500px;margin-left:auto;margin-right:auto;">200+ world-class plugins. Lifetime licenses. Instantly delivered. No subscription.</p>
          <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap;">
            <a href="/store" class="btn btn-primary btn-lg">Browse Plugins</a>
            <a href="/bundles" class="btn btn-ghost btn-lg">View Bundles</a>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ── FAQ PAGE ───────────────────────────────────────────
const FAQ_ITEMS = [
  { cat: 'Installation', q: 'How do I install my plugins after purchase?', a: 'After purchase, go to your Dashboard and find the plugin under "My Plugins." Click Download to get the installer for your OS (Windows or macOS). Run the installer, then open your DAW. The plugin will appear in your VST/AU/AAX folder automatically. Enter your license key on first launch — it\'s displayed in your Dashboard.' },
  { cat: 'Installation', q: 'Which DAWs are supported?', a: 'Our plugins are distributed in VST3, AU, and AAX formats, making them compatible with virtually all major DAWs including FL Studio, Ableton Live, Logic Pro, Pro Tools, Cubase, Studio One, Reaper, and Reason. Check each plugin\'s product page for specific DAW compatibility details.' },
  { cat: 'Installation', q: 'Can I install on both Windows and macOS?', a: 'Yes. A single license covers both operating systems. Download the appropriate installer from your Dashboard for each machine you want to install on.' },
  { cat: 'Pricing', q: `Why are your prices ${getDiscountPct()}% lower than other stores?`, a: `ProMix has established exclusive bulk licensing and direct partnership agreements with audio software developers. Because we move significant volume, developers pass major savings to us — which we pass directly to you. There are no hidden fees, no subscriptions, and no catch.` },
  { cat: 'Pricing', q: 'Are these legitimate, fully licensed plugins?', a: 'Absolutely. Every plugin sold through ProMix comes with a genuine, full commercial license issued directly by the developer. You receive the exact same product as buying at full retail price — just at a fraction of the cost. All licenses are lifetime, not subscription-based.' },
  { cat: 'Pricing', q: 'Can I use one license on multiple computers?', a: 'Yes. A single license covers up to 3 of your personal machines simultaneously — for example, a studio desktop and a touring laptop. This matches or exceeds the standard policy of most plugin developers.' },
  { cat: 'Payment', q: 'How does crypto payment work?', a: 'At checkout, select your preferred cryptocurrency (BTC, ETH, or USDT). You\'ll be shown a wallet address and QR code with the exact amount to send. Once your transaction is confirmed on-chain, your plugins are instantly unlocked in your Dashboard. The whole process typically takes under 10 minutes for ETH/USDT, slightly longer for BTC.' },
  { cat: 'Payment', q: 'Can I pay with a credit or debit card?', a: 'Yes. We offer a full card checkout flow accepting Visa, Mastercard, and AMEX. Card payments are processed securely with 3D Secure verification for your protection.' },
  { cat: 'Payment', q: 'What if I send the wrong amount of crypto?', a: 'If you send less than the required amount, your order will remain pending. If you send more, we credit the overpayment to your ProMix account balance which can be used on future purchases. Please always send the exact amount shown to avoid delays.' },
  { cat: 'Licensing', q: 'Do my licenses expire?', a: 'Never. All ProMix licenses are lifetime, perpetual licenses. You own the plugin version you purchased indefinitely. Major version upgrades (e.g., v2 → v3) may require a separate upgrade purchase, but your existing version remains fully licensed and functional.' },
  { cat: 'Licensing', q: 'Can I sell or transfer my license?', a: 'License transfers depend on the individual developer\'s policy. Most of our partners allow one-time transfers. Contact support with the plugin name and we\'ll guide you through the process.' },
  { cat: 'Support', q: 'What if a plugin isn\'t working in my DAW?', a: 'First, ensure your DAW is scanning the correct plugin folder (VST3 on Windows is typically C:\\Program Files\\Common Files\\VST3). If the issue persists, contact our support team with your OS, DAW version, and the specific plugin. We typically respond within 24 hours and have a 30-day fix guarantee for compatibility issues.' },
  { cat: 'Support', q: 'Do you offer refunds?', a: 'Due to the nature of digital goods, all sales are final. However, if a plugin is verified by our support team as fundamentally broken and incompatible with a listed OS/DAW that we cannot fix within 30 days, we will issue a full refund or store credit. See our full Refund Policy for details.' },
];

const FAQ_CATS = ['All', ...new Set(FAQ_ITEMS.map(f => f.cat))];

export function renderFaqPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Got Questions?
        </span>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about purchasing, installing, and using ProMix plugins.</p>
      </div>
    </div>

    <div class="section">
      <div class="container container-narrow animate-fade-in-up">

        <!-- Search -->
        <div class="faq-search-wrap">
          <svg class="faq-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="faq-search-input" id="faq-search" placeholder="Search questions…" autocomplete="off" />
        </div>

        <!-- Categories -->
        <div class="faq-categories" id="faq-cats">
          ${FAQ_CATS.map(cat => `<button class="faq-cat-btn ${cat === 'All' ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('')}
        </div>

        <!-- FAQ List -->
        <div class="faq-list" id="faq-list">
          ${FAQ_ITEMS.map((item, i) => `
          <div class="faq-item" data-cat="${item.cat}" data-question="${item.q.toLowerCase()}" id="faq-${i}">
            <div class="faq-question" data-idx="${i}">
              <span>${item.q}</span>
              <div class="faq-chevron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div class="faq-answer">
              <div class="faq-answer-inner">${item.a}</div>
            </div>
          </div>
          `).join('')}
        </div>

        <!-- Still need help -->
        <div style="margin-top:var(--space-3xl);padding:var(--space-xl);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-xl);text-align:center;">
          <h3 style="margin-bottom:var(--space-sm);">Still have a question?</h3>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Our support team responds within 24 hours, usually much faster.</p>
          <a href="/support" class="btn btn-primary">Contact Support</a>
        </div>

      </div>
    </div>
  `;

  // Accordion
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // Category filter
  document.getElementById('faq-cats')?.addEventListener('click', e => {
    const btn = e.target.closest('.faq-cat-btn');
    if (!btn) return;
    document.querySelectorAll('#faq-cats .faq-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    // close all open first
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.faq-item').forEach(item => {
      item.style.display = (cat === 'All' || item.dataset.cat === cat) ? '' : 'none';
    });
  });

  // Search
  document.getElementById('faq-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.faq-item').forEach(item => {
      const match = !q || item.dataset.question.includes(q) || item.querySelector('.faq-answer-inner')?.textContent.toLowerCase().includes(q);
      item.style.display = match ? '' : 'none';
    });
    // reset category buttons
    if (q) {
      document.querySelectorAll('#faq-cats .faq-cat-btn').forEach(b => b.classList.remove('active'));
    }
  });
}

// ── SUPPORT PAGE ────────────────────────────────────────
export function renderSupportPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          We're Here
        </span>
        <h1>Support Center</h1>
        <p>Installation issues, payment questions, licensing help — we've got you covered 24/7.</p>
      </div>
    </div>

    <div class="section">
      <div class="container animate-fade-in-up">

        <!-- Support Options -->
        <div class="support-options">
          <div class="support-card" id="chat-card">
            <span class="support-card-icon">💬</span>
            <h3>Live Chat</h3>
            <p>Talk to a real engineer in real time. Best for urgent installation or licensing problems.</p>
            <div class="support-availability">
              <span class="support-availability-dot"></span>
              Available Now · Avg. response 3 min
            </div>
            <button class="btn btn-primary" style="width:100%;" id="open-chat-btn">Start Chat</button>
          </div>
          <div class="support-card" id="email-card">
            <span class="support-card-icon">📧</span>
            <h3>Email Support</h3>
            <p>Send us a detailed ticket and our team will respond with a full solution. Great for complex issues.</p>
            <div class="support-availability">
              <span class="support-availability-dot"></span>
              Responds within 24 hours
            </div>
            <button class="btn btn-ghost" style="width:100%;" id="scroll-to-form-btn">Submit a Ticket</button>
          </div>
          <div class="support-card" id="docs-card" style="cursor:pointer;" onclick="window.location='/faq'">
            <span class="support-card-icon">📖</span>
            <h3>Knowledge Base</h3>
            <p>Browse our FAQ for instant answers to the most common questions about plugins, payment, and licensing.</p>
            <div class="support-availability">
              <span class="support-availability-dot"></span>
              Always Available
            </div>
            <a href="/faq" class="btn btn-ghost" style="width:100%;">Browse FAQ</a>
          </div>
        </div>

        <!-- Common topics -->
        <div style="margin-bottom:var(--space-3xl);">
          <div class="section-title"><h2>Common Topics</h2></div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-md);">
            ${[
              { icon: '💾', title: 'Plugin Installation Help', desc: 'Step-by-step guides for VST3, AU, and AAX on Windows and macOS.' },
              { icon: '🔑', title: 'License Key Issues', desc: 'Retrieve or transfer your license key from your Dashboard.' },
              { icon: '💰', title: 'Payment Not Confirmed', desc: 'Crypto or card transaction pending? We\'ll check it manually.' },
              { icon: '🖥️', title: 'DAW Compatibility', desc: 'Plugin not showing up in your DAW? Check format settings.' },
              { icon: '🔄', title: 'Refunds & Exchanges', desc: 'Need help? We assess refund eligibility on a case-by-case basis.' },
              { icon: '🎁', title: 'Account & Dashboard', desc: 'Reset password, update email, or view your purchase history.' },
            ].map(t => `
            <div style="display:flex;gap:var(--space-md);padding:var(--space-lg);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);align-items:flex-start;cursor:pointer;transition:border-color var(--duration-fast);" class="topic-card">
              <span style="font-size:24px;flex-shrink:0;">${t.icon}</span>
              <div>
                <div style="font-weight:var(--weight-semibold);margin-bottom:4px;">${t.title}</div>
                <div style="font-size:var(--text-sm);color:var(--text-secondary);">${t.desc}</div>
              </div>
            </div>
            `).join('')}
          </div>
        </div>

        <!-- Ticket Form -->
        <div class="support-ticket-form" id="ticket-form-section">
          <div class="section-title"><h2>Submit a Support Ticket</h2></div>
          <form id="support-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="input" placeholder="Your name" required id="support-name" />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" class="input" placeholder="you@example.com" required id="support-email" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Issue Category</label>
                <select class="input" id="support-category">
                  <option value="">Select a category…</option>
                  <option>Plugin Installation</option>
                  <option>License Key</option>
                  <option>Payment Issue</option>
                  <option>DAW Compatibility</option>
                  <option>Account / Dashboard</option>
                  <option>Refund Request</option>
                  <option>General Inquiry</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select class="input" id="support-priority">
                  <option value="normal">Normal — response within 24h</option>
                  <option value="high">High — payment or access issue</option>
                  <option value="urgent">Urgent — cannot use purchased plugin</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Subject</label>
              <input type="text" class="input" placeholder="e.g. FabFilter Pro-Q 3 not showing in Ableton" id="support-subject" />
            </div>
            <div class="form-group">
              <label>Describe Your Issue</label>
              <textarea class="input" rows="5" placeholder="Please include: your OS, DAW and version, plugin name, and what steps you've already tried." required id="support-message"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="min-width:200px;" id="support-submit">
              Send Ticket
            </button>
          </form>
        </div>

        <!-- Contact info -->
        <div style="margin-top:var(--space-2xl);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-xl);text-align:center;">
          ${[
            { icon: '✉️', label: 'Email', value: 'support@promixplugins.com' },
            { icon: '⏱️', label: 'Response Time', value: 'Within 24 hours' },
            { icon: '🌍', label: 'Coverage', value: '24/7 Global Support' },
          ].map(c => `
          <div style="padding:var(--space-lg);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);">
            <div style="font-size:24px;margin-bottom:var(--space-sm);">${c.icon}</div>
            <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px;">${c.label}</div>
            <div style="font-weight:600;font-size:var(--text-sm);">${c.value}</div>
          </div>
          `).join('')}
        </div>

      </div>
    </div>
  `;

  // Scroll to form
  document.getElementById('scroll-to-form-btn')?.addEventListener('click', () => {
    document.getElementById('ticket-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Topic card hover border
  document.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.borderColor = 'rgba(0,255,136,0.25)');
    card.addEventListener('mouseleave', () => card.style.borderColor = '');
  });

  // Chat button
  document.getElementById('open-chat-btn')?.addEventListener('click', () => {
    import('../components/Toast.js').then(({ showToast }) => {
      showToast('Live chat is launching — our team will respond within minutes.', 'info');
    });
  });

  // Ticket form
  document.getElementById('support-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('support-submit');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1000));
    const { showToast } = await import('../components/Toast.js');
    showToast('Ticket submitted! Check your email for confirmation.', 'success');
    e.target.reset();
    btn.textContent = 'Send Ticket';
    btn.disabled = false;
  });
}

// ── REFUND POLICY PAGE ──────────────────────────────────
export function renderRefundPolicyPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">Legal</span>
        <h1>Refund Policy</h1>
        <p>Our policy is designed to be fair to both customers and the developers who create the software.</p>
      </div>
    </div>
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <div class="card" style="padding:var(--space-2xl);">

          <div style="background:rgba(255,107,43,0.06);border:1px solid rgba(255,107,43,0.18);border-radius:var(--radius-md);padding:var(--space-md) var(--space-lg);margin-bottom:var(--space-xl);display:flex;gap:var(--space-md);align-items:flex-start;">
            <span style="font-size:22px;flex-shrink:0;">⚠️</span>
            <div>
              <strong style="color:var(--neon-orange);">All Sales Are Final</strong>
              <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:4px;">Due to the nature of digital goods, we cannot offer refunds once a license has been issued.</p>
            </div>
          </div>

          <h3 style="margin-bottom:var(--space-sm);">Digital Software Downloads</h3>
          <p class="text-secondary" style="line-height:1.7;margin-bottom:var(--space-xl);">
            Once a plugin is purchased and a license key is issued to your Dashboard, the transaction is complete and non-reversible. We do not offer refunds, returns, or exchanges for any digital product accessed from ProMix — regardless of whether the download has been initiated.
          </p>

          <h3 style="margin-bottom:var(--space-sm);">Cryptocurrency Transactions</h3>
          <p class="text-secondary" style="line-height:1.7;margin-bottom:var(--space-xl);">
            Cryptocurrency transactions (BTC, ETH, USDT) are irreversible by nature of blockchain technology. Always verify the wallet address and send the <strong>exact amount specified</strong> at checkout. Overpayments are credited to your account balance. Payments sent to the wrong network or address cannot be refunded or recovered.
          </p>

          <h3 style="margin-bottom:var(--space-sm);">Exceptions</h3>
          <p class="text-secondary" style="line-height:1.7;margin-bottom:var(--space-xl);">
            A refund or store credit will be issued if:
          </p>
          <ul style="color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-xl);padding-left:1.5rem;">
            <li>A plugin is verified by our support team as fundamentally broken and incompatible with an advertised OS or DAW, <strong>and</strong></li>
            <li>We are unable to provide a working fix or alternative within <strong>30 days</strong> of your verified report.</li>
          </ul>

          <h3 style="margin-bottom:var(--space-sm);">Need Help?</h3>
          <p class="text-secondary" style="line-height:1.7;margin-bottom:var(--space-lg);">
            Before assuming an issue is unresolvable, please contact our support team. Most compatibility problems can be solved within hours.
          </p>
          <a href="/support" class="btn btn-primary">Contact Support</a>
        </div>
      </div>
    </div>
  `;
}

// ── CONTACT PAGE ────────────────────────────────────────
export function renderContactPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Say Hello
        </span>
        <h1>Contact Us</h1>
        <p>Technical support, partnership inquiries, or just a question — we're here.</p>
      </div>
    </div>
    <div class="section">
      <div class="container container-narrow animate-fade-in-up">
        <div class="card" style="padding:var(--space-2xl);">
          <form id="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label>Name</label>
                <input type="text" class="input" placeholder="Your name" required />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="input" placeholder="you@example.com" required />
              </div>
            </div>
            <div class="form-group">
              <label>Subject</label>
              <select class="input">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Payment Issue</option>
                <option>Partnership / Business</option>
                <option>Affiliate Program</option>
                <option>Press / Media</option>
              </select>
            </div>
            <div class="form-group">
              <label>Message</label>
              <textarea class="input" rows="5" placeholder="How can we help?" required style="resize:vertical;min-height:120px;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-md);">Send Message</button>
          </form>
        </div>
        <div style="margin-top:var(--space-xl);text-align:center;color:var(--text-muted);font-size:var(--text-sm);">
          <p>📧 support@promixplugins.com &nbsp;·&nbsp; ⏱ Usually within 24 hours</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    import('../components/Toast.js').then(({ showToast }) => {
      showToast('Message sent! We\'ll get back to you soon.', 'success');
      e.target.reset();
    });
  });
}
