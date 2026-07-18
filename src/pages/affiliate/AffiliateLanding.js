// ═══════════════════════════════════════════════════════
// Affiliate Landing Page (Guests, Pending, Rejected)
// ═══════════════════════════════════════════════════════

import { isLoggedIn } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { showToast } from '../../components/Toast.js';
import { applyForAffiliate } from '../../services/affiliateService.js';

export function renderAffiliateLanding(container, user, affiliate) {
  const statusBanner = affiliate ? renderStatusBanner(affiliate) : '';

  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Earn With ProMix
        </span>
        <h1>The ProMix Affiliate Program</h1>
        <p>Refer producers and engineers to ProMix and earn <strong style="color:var(--neon-green)">up to 50% commission</strong> on every sale — paid in your preferred crypto.</p>
        <div style="display:flex;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);flex-wrap:wrap;">
          <a href="#aff-signup" class="btn btn-primary btn-lg">Start Earning Now</a>
          <a href="#how-it-works" class="btn btn-ghost btn-lg">How It Works</a>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="container">
        ${statusBanner}

        <!-- Stats -->
        <div class="affiliates-hero-stats animate-fade-in-up">
          <div class="aff-stat">
            <div class="aff-stat-value">50%</div>
            <div class="aff-stat-label">Commission Per Sale</div>
          </div>
          <div class="aff-stat">
            <div class="aff-stat-value">30d</div>
            <div class="aff-stat-label">Cookie Duration</div>
          </div>
          <div class="aff-stat">
            <div class="aff-stat-value">$0</div>
            <div class="aff-stat-label">Cost to Join</div>
          </div>
        </div>

        <!-- How it works -->
        <div id="how-it-works" style="margin-top:var(--space-3xl);">
          <div class="section-title"><h2>How It Works</h2></div>
          <div class="affiliates-how">
            <div class="aff-step">
              <div class="aff-step-num">1</div>
              <h3>Apply Free</h3>
              <p>Fill in a quick form — tell us about your audience. We approve within 24 hours.</p>
            </div>
            <div class="aff-step">
              <div class="aff-step-num">2</div>
              <h3>Share Your Link</h3>
              <p>Get a unique referral link + coupon code. Share anywhere — content, bio, community, email.</p>
            </div>
            <div class="aff-step">
              <div class="aff-step-num">3</div>
              <h3>Get Paid in Crypto</h3>
              <p>Every sale earns you up to 50% commission. Paid monthly in BTC, ETH, or USDT.</p>
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
                <h4>Industry-Leading Commission</h4>
                <p>Up to 50% per sale — one of the highest rates in the audio plugin space.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">🕒</span>
              <div>
                <h4>30-Day Cookie Window</h4>
                <p>30-day attribution cookie — you get credit even if your audience takes weeks to decide.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">₿</span>
              <div>
                <h4>Crypto Payouts</h4>
                <p>BTC, ETH, or USDT. No bank account needed — borderless payments worldwide.</p>
              </div>
            </div>
            <div class="aff-perk">
              <span class="aff-perk-icon">📊</span>
              <div>
                <h4>Real-Time Dashboard</h4>
                <p>Track clicks, conversions, and earnings live. See exactly what's working.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sign Up Form -->
        <div class="affiliates-cta-box" id="aff-signup">
          <span style="font-size:40px;display:block;margin-bottom:var(--space-md);">🚀</span>
          <h2>Ready to Start Earning?</h2>
          <p>Join creators already earning with ProMix. Fill in your details and we'll approve your application within 24 hours.</p>
          ${!isLoggedIn() ? `
            <div style="background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:var(--text-sm);color:var(--neon-blue);">
              You need an account to apply. <a href="/register" style="color:var(--neon-green);font-weight:600;">Register free</a> or <a href="/login" style="color:var(--neon-green);font-weight:600;">log in</a> first.
            </div>` : ''}
          <form id="aff-form" style="max-width:520px;margin:0 auto;" ${!isLoggedIn() ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md);">
              <input type="text" class="input" placeholder="Username / handle" required id="aff-username" />
              <input type="url" class="input" placeholder="Your website or profile URL" id="aff-url" />
            </div>
            <select class="input" id="aff-platform" style="margin-bottom:var(--space-md)">
              <option value="">How will you promote ProMix?</option>
              <option>YouTube Channel</option>
              <option>Music Production Blog</option>
              <option>Discord / Community Server</option>
              <option>Instagram / TikTok</option>
              <option>Email Newsletter</option>
              <option>Podcast</option>
              <option>Other</option>
            </select>
            <textarea class="input" rows="3" placeholder="Tell us about your audience..." id="aff-bio" style="margin-bottom:var(--space-lg);"></textarea>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="aff-submit-btn"${!isLoggedIn() ? ' disabled' : ''}>Apply to Become an Affiliate</button>
          </form>
        </div>
      </div>
    </div>`;

  bindLandingEvents(user);
}

function bindLandingEvents(user) {
  document.getElementById('aff-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { navigate('/login'); return; }

    const btn = document.getElementById('aff-submit-btn');
    if (!btn) return;
    btn.textContent = 'Submitting…';
    btn.disabled = true;

    try {
      const { alreadyApplied, error } = await applyForAffiliate({
        userId: user.id,
        username: document.getElementById('aff-username').value.trim(),
        bio: document.getElementById('aff-bio').value.trim(),
        websiteUrl: document.getElementById('aff-url').value.trim(),
        promotionChannel: document.getElementById('aff-platform').value,
        socialLinks: {},
      });

      if (alreadyApplied) {
        showToast('You already have an affiliate application on file.', 'info');
      } else if (error) {
        showToast('Error: ' + error.message, 'error');
        btn.textContent = 'Apply to Become an Affiliate';
        btn.disabled = false;
      } else {
        showToast('Application received! We\'ll review it within 24 hours.', 'success');
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
      btn.textContent = 'Apply to Become an Affiliate';
      btn.disabled = false;
    }
  });
}

function renderStatusBanner(affiliate) {
  if (affiliate.status === 'pending') {
    return `
      <div class="aff-status-banner pending">
        ⏳ <div><strong>Application Under Review</strong> — We'll notify you by email once it's approved (usually within 24 hours).</div>
      </div>`;
  }
  if (affiliate.status === 'rejected') {
    return `
      <div class="aff-status-banner rejected">
        ❌ <div><strong>Application Not Approved</strong> — ${affiliate.rejection_reason || 'Your application was not approved at this time.'} You may apply again below.</div>
      </div>`;
  }
  return '';
}
