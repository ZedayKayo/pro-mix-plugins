// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Affiliates Program Page
// ═══════════════════════════════════════════════════════

export function renderAffiliatesPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Earn With ProMix
        </span>
        <h1>The ProMix Affiliate Program</h1>
        <p>Refer producers and engineers to ProMix and earn 15% commission on every sale — paid monthly in your preferred crypto.</p>
        <div style="display:flex;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);flex-wrap:wrap;">
          <a href="#aff-signup" class="btn btn-primary btn-lg">Start Earning Now</a>
          <a href="#how-it-works" class="btn btn-ghost btn-lg">How It Works</a>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="container">

        <!-- Stats -->
        <div class="affiliates-hero-stats animate-fade-in-up">
          <div class="aff-stat">
            <div class="aff-stat-value">15%</div>
            <div class="aff-stat-label">Commission Per Sale</div>
          </div>
          <div class="aff-stat">
            <div class="aff-stat-value">90d</div>
            <div class="aff-stat-label">Cookie Duration</div>
          </div>
          <div class="aff-stat">
            <div class="aff-stat-value">$0</div>
            <div class="aff-stat-label">Cost to Join</div>
          </div>
        </div>

        <!-- How it works -->
        <div id="how-it-works" style="margin-top:var(--space-3xl);">
          <div class="section-title">
            <h2>How It Works</h2>
          </div>
          <div class="affiliates-how">
            <div class="aff-step">
              <div class="aff-step-num">1</div>
              <h3>Sign Up Free</h3>
              <p>Apply below with your name, email, and where you promote (YouTube, blog, Discord, etc). Approval within 24 hours.</p>
            </div>
            <div class="aff-step">
              <div class="aff-step-num">2</div>
              <h3>Share Your Link</h3>
              <p>Get a unique referral link. Share it in your content, bio, or community. 90-day cookies mean credit even if they don't buy immediately.</p>
            </div>
            <div class="aff-step">
              <div class="aff-step-num">3</div>
              <h3>Get Paid Monthly</h3>
              <p>Every sale through your link earns you 15% commission. Payouts hit your crypto wallet every 1st of the month.</p>
            </div>
          </div>
        </div>

        <!-- Perks -->
        <div style="margin-top:var(--space-3xl);">
          <div class="section-title"><h2>Why Affiliates Love ProMix</h2></div>
          <div class="affiliates-perks">
            <div class="aff-perk">
              <span class="aff-perk-icon">💰</span>
              <div>
                <h4>High Commission Rate</h4>
                <p>15% per sale is one of the highest rates in the audio plugin space. A $100 sale earns you $15 — with zero effort after the link is shared.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">🕒</span>
              <div>
                <h4>90-Day Cookie Window</h4>
                <p>Most programs offer 30 days. Our 90-day cookie means you still get credit if someone purchases three months after clicking your link.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">₿</span>
              <div>
                <h4>Crypto Payouts</h4>
                <p>Receive your commissions in BTC, ETH, or USDT. No bank account needed — borderless payments for creators worldwide.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">📊</span>
              <div>
                <h4>Real-Time Dashboard</h4>
                <p>Track clicks, conversions, and earnings in real time through your affiliate dashboard. Know exactly what's working.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">🎁</span>
              <div>
                <h4>Exclusive Discount Codes</h4>
                <p>Top affiliates get custom promo codes to share with their audience — giving your followers an extra 5% off while boosting your conversions.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">🤝</span>
              <div>
                <h4>Dedicated Affiliate Manager</h4>
                <p>Every affiliate gets direct access to our affiliate team. Need banners, content ideas, or product info? We've got you.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tiers -->
        <div style="margin-top:var(--space-3xl);">
          <div class="section-title"><h2>Affiliate Tiers</h2></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-xl);">
            ${[
              { tier: 'Starter', rate: '15%', req: '0–$500/mo', perks: ['Personal dashboard', 'Standard 90d cookie', 'BTC/ETH/USDT payouts'], color: 'var(--text-muted)', border: 'var(--border-primary)' },
              { tier: 'Pro', rate: '18%', req: '$500–$2,000/mo', perks: ['Priority support', 'Custom promo code', 'Early access to new plugins', 'Monthly performance call'], color: 'var(--neon-green)', border: 'rgba(0,255,136,0.3)' },
              { tier: 'Elite', rate: '22%', req: '$2,000+/mo', perks: ['Dedicated manager', 'Co-branded landing pages', 'Exclusive bundle deals for audience', 'Quarterly bonuses'], color: 'var(--neon-orange)', border: 'rgba(255,107,43,0.3)' },
            ].map(t => `
            <div class="about-value-card" style="border-color:${t.border};text-align:center;">
              <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;color:${t.color};margin-bottom:var(--space-sm);">${t.tier}</div>
              <div style="font-size:3rem;font-weight:900;color:${t.color};line-height:1;margin-bottom:var(--space-xs);">${t.rate}</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-lg);">Commission · ${t.req} earnings</div>
              <ul style="list-style:none;padding:0;margin:0;text-align:left;">
                ${t.perks.map(p => `
                <li style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:var(--text-sm);color:var(--text-secondary);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${t.color}" stroke-width="2.5" style="flex-shrink:0;margin-top:2px;"><polyline points="20 6 9 17 4 12"/></svg>
                  ${p}
                </li>`).join('')}
              </ul>
            </div>`).join('')}
          </div>
        </div>

        <!-- Sign Up -->
        <div class="affiliates-cta-box" id="aff-signup">
          <span style="font-size:40px;display:block;margin-bottom:var(--space-md);">🚀</span>
          <h2>Ready to Start Earning?</h2>
          <p>Join hundreds of producers and YouTubers already earning with ProMix. Fill in your details and we'll approve your application within 24 hours.</p>
          <form id="aff-form" style="max-width:500px;margin:0 auto;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md);">
              <input type="text" class="input" placeholder="Full Name" required id="aff-name" />
              <input type="email" class="input" placeholder="Email Address" required id="aff-email" />
            </div>
            <input type="url" class="input" placeholder="Your website, YouTube or social profile URL" id="aff-url" style="margin-bottom:var(--space-md);" />
            <select class="input" id="aff-platform" style="margin-bottom:var(--space-md)">
              <option value="">How will you promote ProMix?</option>
              <option>YouTube Channel</option>
              <option>Music Production Blog</option>
              <option>Discord / Community Server</option>
              <option>Instagram / TikTok</option>
              <option>Email Newsletter</option>
              <option>Other</option>
            </select>
            <textarea class="input" rows="3" placeholder="Tell us about your audience (size, genre focus, etc.)" id="aff-bio" style="margin-bottom:var(--space-lg);"></textarea>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">Apply to Become an Affiliate</button>
          </form>
        </div>

      </div>
    </div>
  `;

  document.getElementById('aff-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Submitting…';
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1200));
    const { showToast } = await import('../components/Toast.js');
    showToast('Application received! We\'ll review and get back to you within 24 hours.', 'success');
    e.target.reset();
    btn.textContent = 'Apply to Become an Affiliate';
    btn.disabled = false;
  });
}
