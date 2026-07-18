// ═══════════════════════════════════════════════════════
// Affiliate Marketing Tab
// ═══════════════════════════════════════════════════════

import { fetchAffiliateAssets } from '../../services/affiliateService.js';
import { showToast } from '../../components/Toast.js';

export async function renderMarketingTab(affiliate, refUrl) {
  const assets = await fetchAffiliateAssets();
  const types = ['all', ...new Set(assets.map(a => a.type))];

  const renderAssets = (type) => {
    const filtered = type === 'all' ? assets : assets.filter(a => a.type === type);
    if (!filtered.length) {
      return `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);">No assets in this category yet.</div>`;
    }
    return `
      <div class="aff-assets-grid">
        ${filtered.map(a => `
          <div class="aff-asset-card">
            <div class="aff-asset-preview ${['email_template','social_caption','marketing_copy'].includes(a.type) ? 'text-asset' : ''}">
              ${a.thumbnail ? `<img src="${a.thumbnail}" alt="${a.title}" />` :
                a.type === 'banner' || a.type === 'logo' ? '🖼️' :
                a.type === 'email_template' ? (a.url.substring(0, 200) + '…') :
                a.type === 'social_caption' ? (a.url.substring(0, 200) + '…') :
                a.type === 'video' ? '🎬' : '📄'}
            </div>
            <div class="aff-asset-info">
              <div class="aff-asset-type">${a.type.replace(/_/g, ' ')}</div>
              <div class="aff-asset-name">${a.title}${a.dimensions ? ` <span class="text-muted text-xs">(${a.dimensions})</span>` : ''}</div>
              <div style="display:flex;gap:var(--space-xs);">
                <button class="aff-copy-btn" style="flex:1;text-align:center;" data-copy="${a.url}">Copy</button>
                ${a.url.startsWith('http') ? `<a href="${a.url}" target="_blank" class="btn btn-ghost btn-sm">↗</a>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  };

  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Marketing Resources</h2>
        <p class="aff-content-subtitle">Ready-made assets to promote Afford Plugins — one-click copy</p>
      </div>
    </div>

    <div class="aff-assets-tabs" id="aff-asset-tabs">
      ${types.map((t, idx) => `
        <button class="aff-asset-tab ${idx === 0 ? 'active' : ''}" data-asset-type="${t}">
          ${t === 'all' ? 'All Assets' : t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
        </button>`).join('')}
    </div>

    <div id="aff-assets-grid-wrap">${renderAssets('all')}</div>

    <!-- Your Link for embed -->
    <div class="aff-panel" style="margin-top:var(--space-xl);">
      <div class="aff-panel-header"><h3 class="aff-panel-title">Your Referral Link (for assets)</h3></div>
      <div class="aff-panel-body">
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-md);">Replace <code style="color:var(--neon-green);">[YOUR_REF_LINK]</code> in templates with your link:</p>
        <div class="aff-ref-link-box">
          <span class="aff-ref-link-text">${refUrl}</span>
          <button class="aff-copy-btn" data-copy="${refUrl}" id="copy-mktg-link">Copy Link</button>
        </div>
      </div>
    </div>`;
}

export function bindMarketingTabEvents() {
  document.getElementById('aff-asset-tabs')?.addEventListener('click', async (e) => {
    const tabBtn = e.target.closest('[data-asset-type]');
    if (!tabBtn) return;

    document.querySelectorAll('[data-asset-type]').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');

    const type = tabBtn.dataset.assetType;
    const assets = await fetchAffiliateAssets(type === 'all' ? null : type);
    const wrap = document.getElementById('aff-assets-grid-wrap');
    if (!wrap) return;

    if (!assets.length) {
      wrap.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);">No assets in this category.</div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="aff-assets-grid">
        ${assets.map(a => `
          <div class="aff-asset-card">
            <div class="aff-asset-preview ${['email_template','social_caption'].includes(a.type) ? 'text-asset' : ''}">
              ${a.thumbnail ? `<img src="${a.thumbnail}" alt="${a.title}" />` : a.type === 'banner' || a.type === 'logo' ? '🖼️' : a.url.substring(0, 180)}
            </div>
            <div class="aff-asset-info">
              <div class="aff-asset-type">${a.type.replace(/_/g,' ')}</div>
              <div class="aff-asset-name">${a.title}</div>
              <button class="aff-copy-btn" style="width:100%;text-align:center;" data-copy="${a.url}">Copy</button>
            </div>
          </div>`).join('')}
      </div>`;

    // Rebind newly loaded copy buttons
    wrap.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 1800);
        });
      });
    });
  });
}
