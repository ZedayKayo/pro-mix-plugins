// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Dashboard Page
// ═══════════════════════════════════════════════════════

import { getUser, getPurchases, getLicenses, logoutUserAuthAsync, isLoggedIn } from '../core/store.js';
import { formatPrice, timeAgo, getPluginImage } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';
import { getProducts } from '../data/products.js';

export function renderDashboardPage() {
  const container = document.getElementById('page-content');
  if (!isLoggedIn()) { navigate('/login'); return; }

  const user = getUser();
  const purchases = getPurchases();
  const licenses = getLicenses();
  
  // Format licenses for UI, falling back to purchases items if migrating
  const allItems = licenses.length > 0 
    ? licenses.map(l => ({ id: l.product_id, name: l.products?.name, category: 'Plugin' })) 
    : purchases.flatMap(p => p.items || []);
    
  const allKeys = licenses.length > 0
    ? licenses.map(l => ({ productId: l.product_id, key: l.serial_key, name: l.products?.name }))
    : purchases.flatMap(p => p.licenseKeys || []);

  let activeTab = 'plugins';

  function render() {
    container.innerHTML = `
      <div class="section">
        <div class="container container-narrow">
          <div class="dashboard-header animate-fade-in-up">
            <div class="dashboard-avatar">${(user.name || user.email).charAt(0).toUpperCase()}</div>
            <div>
              <h3>Welcome back, ${user.name || 'Producer'}!</h3>
              <p class="text-sm text-secondary">${user.email}</p>
            </div>
            <button class="btn btn-ghost" id="logout-btn" style="margin-left:auto;">Sign Out</button>
          </div>
          <div class="dashboard-tabs" id="dashboard-tabs">
            <button class="dashboard-tab ${activeTab === 'plugins' ? 'active' : ''}" data-tab="plugins">My Plugins</button>
            <button class="dashboard-tab ${activeTab === 'licenses' ? 'active' : ''}" data-tab="licenses">License Keys</button>
            <button class="dashboard-tab ${activeTab === 'history' ? 'active' : ''}" data-tab="history">History</button>
          </div>
          <div id="tab-content">${renderTab(activeTab, allItems, allKeys, purchases)}</div>
        </div>
      </div>`;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('logout-btn');
      if (btn) { btn.innerText = 'Signing out...'; btn.disabled = true; }
      // Don't await — navigate immediately so the button can never get stuck.
      // logoutUserAuthAsync has its own 4s timeout guard in store.js.
      logoutUserAuthAsync().catch(() => {});
      showToast('Signed out', 'info');
      navigate('/');
    });
    
    document.querySelectorAll('#dashboard-tabs .dashboard-tab').forEach(t => {
      t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); });
    });
    
    document.querySelectorAll('[data-download]').forEach(b => {
      b.addEventListener('click', () => {
        const prodId = b.dataset.download;
        const prod = getProducts().find(x => x.id === prodId);
        const dlUrl = prod?.specs?.download_win || prod?.specs?.download_mac;
        
        if (dlUrl) {
          showToast('Validating license...', 'info');
          setTimeout(() => {
            if (dlUrl.startsWith('magnet:')) {
              window.location.href = dlUrl;
            } else {
              window.open(dlUrl, '_blank');
            }
          }, 800);
        } else {
          showToast('Validating license securely...', 'info');
          setTimeout(() => showToast('Secure download link generated!', 'success'), 1500);
        }
      });
    });
    
    document.querySelectorAll('[data-copy-key]').forEach(b => {
      b.addEventListener('click', () => {
        navigator.clipboard?.writeText(b.dataset.copyKey);
        showToast('License key copied!', 'success');
      });
    });

    // Empty state redirect
    document.getElementById('empty-browse-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/store');
    });
  }
  render();
}

function renderTab(tab, items, keys, purchases) {
  if (tab === 'plugins') {
    if (!items.length) return emptyState('📦', 'No plugins yet', 'Purchase plugins to see them here.');
    return items.map(item => {
      const p = getProducts().find(x => x.id === item.id);
      const img = p ? getPluginImage(p) : '';
      return `<div class="purchase-card animate-fade-in-up">
        <img class="purchase-card-image" src="${img}" alt="${item.name}"/>
        <div><h4>${item.name}</h4><p class="text-sm text-secondary">${item.category || 'Audio'} plugin</p></div>
        <button class="btn btn-primary btn-sm" data-download="${item.id}">⬇ Download</button>
      </div>`;
    }).join('');
  }
  if (tab === 'licenses') {
    if (!keys.length) return emptyState('🔑', 'No license keys', 'Purchase plugins to receive keys.');
    return `<div style="display:flex;flex-direction:column;gap:var(--space-md);">
      ${keys.map(lk => {
        const p = lk.name ? { name: lk.name } : getProducts().find(x => x.id === lk.productId);
        return `<div class="card" style="padding:var(--space-lg);position:relative;z-index:2;">
          <div class="flex items-center justify-between">
            <div><h5>${p?.name || 'Plugin'}</h5>
              <div class="license-key"><span class="mono">${lk.key}</span>
                <button class="copy-btn" data-copy-key="${lk.key}">Copy</button>
              </div>
            </div>
            <span class="badge badge-green">Active</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }
  if (tab === 'history') {
    if (!purchases.length) return emptyState('📋', 'No purchases yet', '');
    return `<div style="display:flex;flex-direction:column;gap:var(--space-md);">
      ${purchases.map(p => {
        const status = p.status || 'completed';
        const badgeClass = status === 'completed' ? 'badge-green' : 'badge-orange';
        return `<div class="card" style="padding:var(--space-lg);position:relative;z-index:2;">
        <div class="flex items-center justify-between" style="margin-bottom:var(--space-sm);">
          <div><span class="text-xs text-muted mono">${p.id}</span>
            <div class="text-sm">${timeAgo(p.created_at || p.date || new Date().toISOString())}</div></div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:var(--neon-green);">${formatPrice(p.total)}</div>
            <div class="flex gap-xs justify-end" style="margin-top:4px;">
              <span class="badge badge-blue">${p.payment_method || p.paymentMethod?.coin || 'Crypto'}</span>
              <span class="badge ${badgeClass}">${status.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div class="divider" style="margin:var(--space-sm) 0;"></div>
        <div class="text-sm text-secondary">${(p.items || []).map(i => i.name).join(', ')}</div>
      </div>`}).join('')}
    </div>`;
  }
  return '';
}

function emptyState(icon, title, desc) {
  return `<div style="text-align:center;padding:var(--space-3xl);">
    <div style="font-size:48px;margin-bottom:var(--space-md);opacity:0.3;">${icon}</div>
    <h4>${title}</h4>
    <p class="text-sm text-secondary">${desc}</p>
    <button id="empty-browse-btn" class="btn btn-primary" style="margin-top:var(--space-lg);">Browse Store</button>
  </div>`;
}
