// ═══════════════════════════════════════════════════════
// Affiliate Dashboard Shell & Tab Controller
// ═══════════════════════════════════════════════════════

import {
  fetchAffiliateDashboardStats,
  fetchAffiliateNotifications,
  markNotificationsRead
} from '../../services/affiliateService.js';
import { showToast } from '../../components/Toast.js';
import { renderOverviewTab } from './AffOverviewTab.js';
import { renderLinksTab, bindLinksTabEvents } from './AffLinksTab.js';
import { renderCommissionsTab, bindCommissionsTabEvents } from './AffCommissionsTab.js';
import { renderPayoutsTab, bindPayoutsTabEvents } from './AffPayoutsTab.js';
import { renderMarketingTab, bindMarketingTabEvents } from './AffMarketingTab.js';
import { renderAnalyticsTab } from './AffAnalyticsTab.js';
import { renderProfileTab, bindProfileTabEvents } from './AffProfileTab.js';
import { sanitizeHTML } from '../../core/utils.js';

export async function renderAffiliateDashboard(container, user, affiliate) {
  let activeTab = 'overview';
  let stats = null;
  let notifications = [];
  let unreadCount = 0;

  // Fetch initial dashboard shell data
  [stats, notifications] = await Promise.all([
    fetchAffiliateDashboardStats(affiliate.id),
    fetchAffiliateNotifications(affiliate.id, 5),
  ]);
  unreadCount = notifications.filter(n => !n.is_read).length;

  const renderTabContent = async (tab) => {
    const origin = window.location.origin;
    const refUrl = `${origin}/?ref=${affiliate.ref_code}`;
    const prettyUrl = `${origin}/ref/${affiliate.username || affiliate.ref_code}`;

    if (tab === 'overview')    return renderOverviewTab(affiliate, stats, notifications);
    if (tab === 'links')       return await renderLinksTab(affiliate, refUrl, prettyUrl);
    if (tab === 'commissions') return await renderCommissionsTab(affiliate);
    if (tab === 'payouts')     return await renderPayoutsTab(affiliate);
    if (tab === 'marketing')   return await renderMarketingTab(affiliate, refUrl);
    if (tab === 'analytics')   return await renderAnalyticsTab(affiliate);
    if (tab === 'profile')     return renderProfileTab(affiliate, user);
    return '';
  };

  const bindTabEvents = (tab) => {
    // Global copy button support
    container.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
        }).catch(() => showToast('Copy failed — please copy manually.', 'error'));
      });
    });

    if (tab === 'links')       bindLinksTabEvents(affiliate);
    if (tab === 'commissions') bindCommissionsTabEvents(affiliate);
    if (tab === 'payouts')     bindPayoutsTabEvents(switchTab);
    if (tab === 'marketing')   bindMarketingTabEvents();
    if (tab === 'profile')     bindProfileTabEvents(affiliate);
  };

  const switchTab = async (tabId) => {
    activeTab = tabId;
    container.querySelectorAll('[data-aff-tab]').forEach(b => b.classList.toggle('active', b.dataset.affTab === tabId));
    const contentArea = document.getElementById('aff-tab-content');
    if (!contentArea) return;

    contentArea.innerHTML = `<div style="text-align:center;padding:var(--space-3xl);"><div class="aff-skeleton aff-skeleton-chart"></div></div>`;
    contentArea.innerHTML = await renderTabContent(tabId);
    bindTabEvents(tabId);
  };

  container.innerHTML = `
    <div class="section" style="padding-top:var(--space-lg);">
      <div class="container">
        <!-- Dashboard Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md);">
          <div>
            <h1 style="font-size:var(--text-xl);margin:0;">Affiliate Dashboard</h1>
            <p class="text-sm text-secondary" style="margin:4px 0 0;">Welcome back, ${sanitizeHTML(user.name || user.email)} · Code: <span style="color:var(--neon-green);font-family:var(--font-mono);">${sanitizeHTML(affiliate.ref_code)}</span></p>
          </div>
          <div style="display:flex;gap:var(--space-sm);">
            <button class="btn btn-ghost btn-sm" id="aff-notif-btn" style="position:relative;">
              🔔
              ${unreadCount > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:var(--neon-red);color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${unreadCount}</span>` : ''}
            </button>
          </div>
        </div>

        <div class="aff-dashboard">
          <!-- Sidebar -->
          <aside class="aff-sidebar">
            <nav class="aff-sidebar-nav">
              <div class="aff-sidebar-header">
                <div class="aff-sidebar-title">Navigation</div>
              </div>
              ${[
                { id: 'overview',   icon: '📊', label: 'Overview' },
                { id: 'links',      icon: '🔗', label: 'Links & Codes' },
                { id: 'commissions',icon: '💰', label: 'Commissions' },
                { id: 'payouts',    icon: '💸', label: 'Payouts' },
                { id: 'marketing',  icon: '🎨', label: 'Marketing' },
                { id: 'analytics',  icon: '📈', label: 'Analytics' },
                { id: 'profile',    icon: '👤', label: 'Profile' },
              ].map(t => `
                <button class="aff-nav-item ${activeTab === t.id ? 'active' : ''}" data-aff-tab="${t.id}">
                  <span>${t.icon}</span>
                  <span>${t.label}</span>
                  ${t.id === 'commissions' && stats?.total_orders > 0 ? `<span class="aff-nav-badge" style="background:var(--neon-green);color:#000;">${stats.total_orders}</span>` : ''}
                </button>`).join('')}
            </nav>
          </aside>

          <!-- Tab Content Area -->
          <main class="aff-content" id="aff-tab-content">
            <!-- Render overview tab first -->
          </main>
        </div>
      </div>
    </div>`;

  // Bind tab switching buttons
  container.querySelectorAll('[data-aff-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.affTab));
  });

  // Notification bell click behavior
  document.getElementById('aff-notif-btn')?.addEventListener('click', () => {
    showToast(`${unreadCount > 0 ? unreadCount + ' unread notifications' : 'No new notifications'}`, 'info');
    markNotificationsRead(affiliate.id).catch(() => {});
    const badge = document.querySelector('#aff-notif-btn span');
    if (badge) badge.remove();
    unreadCount = 0;
  });

  // Load and bind tab overview initially
  await switchTab('overview');
}
