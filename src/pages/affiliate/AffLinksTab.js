// ═══════════════════════════════════════════════════════
// Affiliate Links & Codes Tab
// ═══════════════════════════════════════════════════════

import { fetchAffiliateCoupon } from '../../services/affiliateService.js';

export async function renderLinksTab(affiliate, refUrl, prettyUrl) {
  const coupon = await fetchAffiliateCoupon(affiliate.id);
  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Your Referral Links</h2>
        <p class="aff-content-subtitle">Share these links to start earning commissions</p>
      </div>
    </div>

    <div class="aff-panel">
      <div class="aff-panel-header">
        <h3 class="aff-panel-title">Primary Referral Link</h3>
        <span class="badge badge-approved" style="border-radius:var(--radius-full);padding:4px 10px;font-size:11px;">Active</span>
      </div>
      <div class="aff-panel-body">
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-md);">Share this link anywhere — blogs, YouTube descriptions, social media. Anyone who clicks and purchases within 30 days earns you a commission.</p>
        <div class="aff-ref-link-box" style="margin-bottom:var(--space-md);">
          <span class="aff-ref-link-text">${refUrl}</span>
          <button class="aff-copy-btn" data-copy="${refUrl}" id="copy-primary-btn">Copy</button>
        </div>
        <div class="aff-ref-link-box">
          <span class="aff-ref-link-text">${prettyUrl}</span>
          <button class="aff-copy-btn" data-copy="${prettyUrl}" id="copy-pretty-btn">Copy</button>
        </div>
        <p class="text-xs text-muted" style="margin-top:var(--space-sm);">Pretty URL: ${prettyUrl}</p>
      </div>
    </div>

    <div class="aff-panel">
      <div class="aff-panel-header"><h3 class="aff-panel-title">QR Code</h3></div>
      <div class="aff-panel-body">
        <div style="display:flex;align-items:center;gap:var(--space-xl);">
          <div class="aff-qr-box" id="aff-qr-box">📱</div>
          <div>
            <p class="text-sm text-secondary" style="margin-bottom:var(--space-md);">Use this QR code in presentations, YouTube thumbnails, or offline materials.</p>
            <button class="btn btn-primary btn-sm" id="gen-qr-btn">Generate QR Code</button>
          </div>
        </div>
      </div>
    </div>

    <div class="aff-panel">
      <div class="aff-panel-header"><h3 class="aff-panel-title">Your Discount Code</h3></div>
      <div class="aff-panel-body">
        ${coupon ? `
          <p class="text-sm text-secondary" style="margin-bottom:var(--space-md);">Your audience gets <strong style="color:var(--neon-green);">${coupon.discount_pct}% off</strong> — you earn commission automatically, even without a referral link click.</p>
          <div class="aff-ref-link-box">
            <span class="aff-ref-link-text" style="font-size:var(--text-lg);font-weight:700;letter-spacing:4px;">${coupon.code}</span>
            <button class="aff-copy-btn" data-copy="${coupon.code}" id="copy-coupon-btn">Copy</button>
          </div>
          <p class="text-xs text-muted" style="margin-top:var(--space-sm);">Used ${coupon.usage_count} times${coupon.usage_limit ? ` · Limit: ${coupon.usage_limit}` : ' · Unlimited'}</p>
        ` : `<p class="text-sm text-secondary">No coupon code yet. Contact your affiliate manager to request one.</p>`}
      </div>
    </div>

    <div class="aff-panel">
      <div class="aff-panel-header"><h3 class="aff-panel-title">Deep Link Generator</h3></div>
      <div class="aff-panel-body">
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-md);">Generate referral links to specific pages:</p>
        <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);">
          <select class="input" id="deep-link-page" style="flex:1;">
            <option value="/">Home Page</option>
            <option value="/store">Plugin Store</option>
            <option value="/bundles">Plugin Bundles</option>
          </select>
          <button class="btn btn-primary" id="gen-deep-link-btn">Generate</button>
        </div>
        <div class="aff-ref-link-box" id="deep-link-output" style="display:none;">
          <span class="aff-ref-link-text" id="deep-link-text"></span>
          <button class="aff-copy-btn" id="copy-deep-link-btn">Copy</button>
        </div>
      </div>
    </div>`;
}

export function bindLinksTabEvents(affiliate) {
  document.getElementById('gen-deep-link-btn')?.addEventListener('click', () => {
    const page = document.getElementById('deep-link-page').value;
    const url = `${window.location.origin}${page}?ref=${affiliate.ref_code}`;
    document.getElementById('deep-link-text').textContent = url;
    document.getElementById('copy-deep-link-btn').dataset.copy = url;
    document.getElementById('deep-link-output').style.display = 'flex';
  });

  document.getElementById('gen-qr-btn')?.addEventListener('click', () => {
    const refUrl = `${window.location.origin}/?ref=${affiliate.ref_code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(refUrl)}&bgcolor=ffffff`;
    document.getElementById('aff-qr-box').innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width:100%;height:100%;object-fit:contain;" />`;
  });
}
