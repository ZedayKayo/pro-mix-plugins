// ═══════════════════════════════════════════════════════
// Affiliate Profile Tab
// ═══════════════════════════════════════════════════════

import { showToast } from '../../components/Toast.js';
import { updateAffiliateProfile } from '../../services/affiliateService.js';
import { sanitizeHTML } from '../../core/utils.js';

export function renderProfileTab(affiliate, user) {
  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Affiliate Profile</h2>
        <p class="aff-content-subtitle">Update your payment info and social links</p>
      </div>
    </div>

    <div class="aff-panel">
      <div class="aff-panel-header"><h3 class="aff-panel-title">Personal Info</h3></div>
      <div class="aff-panel-body">
        <form id="aff-profile-form">
          <div class="aff-profile-form">
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Username / Handle</label>
              <input type="text" class="input" id="pf-username" value="${sanitizeHTML(affiliate.username || '')}" placeholder="your_handle" />
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Referral Code</label>
              <input type="text" class="input" id="pf-refcode" value="${sanitizeHTML(affiliate.ref_code || '')}" disabled style="opacity:0.5;cursor:not-allowed;" />
            </div>
            <div class="aff-form-full">
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Bio / About</label>
              <textarea class="input" id="pf-bio" rows="3">${sanitizeHTML(affiliate.bio || '')}</textarea>
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Website</label>
              <input type="url" class="input" id="pf-website" value="${sanitizeHTML(affiliate.website_url || '')}" placeholder="https://..." />
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Primary Channel</label>
              <input type="text" class="input" id="pf-channel" value="${sanitizeHTML(affiliate.promotion_channel || '')}" placeholder="YouTube, Blog..." />
            </div>
          </div>

          <div style="margin-top:var(--space-xl);padding-top:var(--space-xl);border-top:1px solid var(--border-primary);">
            <h4 style="margin-bottom:var(--space-md);">Payment Settings</h4>
            <div class="aff-profile-form">
              <div>
                <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Payment Method</label>
                <select class="input" id="pf-payment-method">
                  <option value="BTC" ${affiliate.payment_method === 'BTC' ? 'selected' : ''}>BTC</option>
                  <option value="ETH" ${affiliate.payment_method === 'ETH' ? 'selected' : ''}>ETH</option>
                  <option value="USDT" ${affiliate.payment_method === 'USDT' ? 'selected' : ''}>USDT</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Wallet Address</label>
                <input type="text" class="input" id="pf-wallet" value="${sanitizeHTML(affiliate.payment_address || '')}" placeholder="Your crypto wallet address" />
              </div>
            </div>
          </div>

          <div style="margin-top:var(--space-xl);padding-top:var(--space-xl);border-top:1px solid var(--border-primary);">
            <h4 style="margin-bottom:var(--space-md);">Social Links</h4>
            <div class="aff-profile-form">
              ${['youtube','instagram','tiktok','twitter'].map(s => `
                <div>
                  <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">${s.charAt(0).toUpperCase()+s.slice(1)}</label>
                  <input type="url" class="input" id="pf-${s}" value="${sanitizeHTML(affiliate.social_links?.[s] || '')}" placeholder="https://..." />
                </div>`).join('')}
            </div>
          </div>

          <div style="margin-top:var(--space-xl);">
            <button type="submit" class="btn btn-primary" id="save-profile-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function bindProfileTabEvents(affiliate) {
  document.getElementById('aff-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    if (!btn) return;
    btn.textContent = 'Saving…';
    btn.disabled = true;

    try {
      await updateAffiliateProfile(affiliate.id, {
        username:          document.getElementById('pf-username').value.trim(),
        bio:               document.getElementById('pf-bio').value.trim(),
        website_url:       document.getElementById('pf-website').value.trim(),
        promotion_channel: document.getElementById('pf-channel').value.trim(),
        payment_method:    document.getElementById('pf-payment-method').value,
        payment_address:   document.getElementById('pf-wallet').value.trim(),
        social_links: {
          youtube:   document.getElementById('pf-youtube')?.value.trim()   || '',
          instagram: document.getElementById('pf-instagram')?.value.trim() || '',
          tiktok:    document.getElementById('pf-tiktok')?.value.trim()    || '',
          twitter:   document.getElementById('pf-twitter')?.value.trim()   || '',
        },
      });
      showToast('Profile saved!', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    btn.textContent = 'Save Changes';
    btn.disabled = false;
  });
}
// Helper to safely handle DOM inputs
function safeValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}
