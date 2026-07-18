// Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
// Afford Plugins Ã¢â‚¬â€ Admin Panel
// Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

import { getInventory, saveProduct, deleteProduct, loadInventory, on, isAdmin, isLoggedIn, getSiteSettings, loadSiteSettings } from '../core/store.js';
import { getBrandList, categories } from '../data/products.js';
import { navigate } from '../core/router.js';
import { formatPrice, sanitizeHTML } from '../core/utils.js';
import { showToast } from '../components/Toast.js';
import { autoFillPluginData } from '../services/aiService.js';
import { clearAllProducts, insertProduct, bulkInsertProducts } from '../services/productService.js';
import { SEED_PRODUCTS } from '../data/seed-products.js';
import { fetchTelegramSettings, updateTelegramSettings, fetchSiteSettings, updateSiteSettings } from '../services/dbService.js';
import { getDiscountPct, saveDiscount, loadDiscount, bulkUpdateSalePrices } from '../services/discountService.js';
import { supabase } from '../lib/supabase.js';
import {
  createAffiliatesAdminTabState,
  renderAffiliatesAdminTab,
  bindAffiliatesAdminTabEvents
} from './admin/AffiliatesAdminTab.js';
import { renderOrdersTab, bindOrdersAdminTabEvents } from './admin/OrdersAdminTab.js';
import { renderUsersTab, bindUsersAdminTabEvents } from './admin/UsersAdminTab.js';
import { renderVisitorsTab, bindVisitorsAdminTabEvents } from './admin/VisitorsAdminTab.js';
import { renderTelegramTab, bindTelegramAdminTabEvents } from './admin/TelegramAdminTab.js';
import { renderSettingsTab, bindSettingsAdminTabEvents } from './admin/SettingsAdminTab.js';
import { openModal, closeModal } from './admin/ProductModal.js';

export function renderAdminPanel(params) {
  if (!isAdmin()) {
    showToast('Unauthorized Access', 'error');
    navigate('/');
    return;
  }
  const container = document.getElementById('page-content');
  
  const state = {
    products: getInventory(),
    search: '',
    editingProduct: null,
    activeTab: 'inventory',
    telegramSettings: null,
    siteSettings: getSiteSettings(),
    orders: null,
    ordersLoading: false,
    users: null,
    usersLoading: false,
    visitors: null,
    visitorsLoading: false,
    notificationLogs: null,
    notificationLogsLoading: false,
    botInfo: null,
    discountPct: getDiscountPct(), // live discount %
    // Delegate affiliate sub-state
    ...createAffiliatesAdminTabState()
  };

  // Pre-fetch telegram settings ONCE
  if (!state.telegramSettings) {
    fetchTelegramSettings().then(s => {
      state.telegramSettings = s || { bot_token: '', chat_id: '', is_enabled: false, notify_all_pages: true, tracked_pages: [] };
      if (state.activeTab === 'telegram') renderPage();
    });
  }

  // Pre-fetch site settings ONCE
  if (!state.siteSettings || !state.siteSettings.discord_link) {
    fetchSiteSettings().then(s => {
      state.siteSettings = s || { discord_link: '', telegram_link: '', support_email: '' };
      if (state.activeTab === 'settings') renderPage();
    });
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Modal: lives on document.body so re-renders can't destroy it Ã¢â€â‚¬Ã¢â€â‚¬

  function getStats() {
    const total = state.products.length;
    const bundles = state.products.filter(p => p.category === 'bundle').length;
    const value = state.products.reduce((acc, p) => acc + (p.price || 0), 0);
    return { total, bundles, value };
  }

  function renderPage() {
    const stats = getStats();
    
    container.innerHTML = `
      <div class="section admin-panel">
        <div class="container container-wide">
          
          <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-md); margin-bottom:var(--space-2xl);">
            <div>
              <h1>Admin Dashboard</h1>
              <div style="display:flex; gap:var(--space-xs); margin-top:var(--space-md); flex-wrap:wrap;">
                <button class="btn ${state.activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="inventory" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸â€œÂ¦ Inventory</button>
                <button class="btn ${state.activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="orders" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸â€œâ€¹ Orders</button>
                <button class="btn ${state.activeTab === 'users' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="users" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸â€˜Â¤ Users</button>
                <button class="btn ${state.activeTab === 'visitors' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="visitors" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸â€˜Â¥ Visitors</button>
                <button class="btn ${state.activeTab === 'telegram' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="telegram" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸Â¤â€“ Telegram</button>
                <button class="btn ${state.activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="settings" style="padding:6px 14px; font-size:0.875rem;">Ã¢Å¡â„¢Ã¯Â¸Â Settings</button>
                <button class="btn ${state.activeTab === 'affiliates' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="affiliates" style="padding:6px 14px; font-size:0.875rem;">Ã°Å¸Â¤Â Affiliates</button>
              </div>
            </div>
            ${state.activeTab === 'inventory' ? `<button class="btn btn-primary" id="admin-add-product" style="font-size:1rem;">+ Add New Product</button>` : ''}
          </div>

          ${state.activeTab === 'inventory' ? `
          <!-- STATS CARDS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-bottom:var(--space-3xl);">
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Products</div>
              <div id="stat-total" style="font-size:2rem; font-weight:bold; color:var(--neon-green);">${stats.total}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Bundles Active</div>
              <div id="stat-bundles" style="font-size:2rem; font-weight:bold; color:var(--neon-blue);">${stats.bundles}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Value (MSRP)</div>
              <div id="stat-value" style="font-size:2rem; font-weight:bold; color:var(--neon-orange);">${formatPrice(stats.value)}</div>
            </div>
          </div>

          <!-- INVENTORY TABLE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
            <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
              <h3 style="margin:0;">Inventory Management</h3>
              <div class="input-group" style="width:300px;">
                <span class="search-input-icon">Ã°Å¸â€Â</span>
                <input type="text" class="input search-input" id="admin-search" placeholder="Search products..." value="${state.search}" />
              </div>
            </div>
            
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left;" class="admin-table">
                <thead>
                  <tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:var(--text-sm);">
                    <th style="padding:var(--space-sm) var(--space-lg);">Product</th>
                    <th style="padding:var(--space-sm);">Category</th>
                    <th style="padding:var(--space-sm);">Brand</th>
                    <th style="padding:var(--space-sm);">MSRP</th>
                    <th style="padding:var(--space-sm);">Sale Price</th>
                    <th style="padding:var(--space-sm);">Status</th>
                    <th style="padding:var(--space-sm) var(--space-lg); text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-table-body">
                  <!-- Rendered by JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- RESTORE ZONE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); border:1px solid rgba(0,255,136,0.25); margin-top:var(--space-xl); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-lg);">
              <div>
                <h4 style="margin:0 0 4px 0; color:var(--neon-green);">&#128260; Restore Missing Products</h4>
                <p class="text-xs text-secondary" style="margin:0;">Re-adds all catalogue plugins that are missing from Supabase. Safe to run Ã¢â‚¬â€ existing products are never touched or duplicated.</p>
              </div>
              <button class="btn" id="admin-restore-products" style="background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.4); color:var(--neon-green); white-space:nowrap; flex-shrink:0;">
                &#10227; Restore Products
              </button>
            </div>
            <div id="restore-status" style="display:none; margin-top:var(--space-md); font-size:var(--text-sm); color:var(--text-secondary);"></div>
          </div>

          <!-- DANGER ZONE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); border:1px solid rgba(255,68,68,0.3); margin-top:var(--space-md); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h4 style="margin:0 0 4px 0; color:#ff4444;">&#9888; Danger Zone</h4>
                <p class="text-xs text-secondary" style="margin:0;">Permanently remove ALL products from Supabase. This cannot be undone Ã¢â‚¬â€ use Restore above to recover.</p>
              </div>
              <button class="btn" id="admin-clear-all" style="background:rgba(255,68,68,0.1); border:1px solid rgba(255,68,68,0.4); color:#ff4444; white-space:nowrap;">
                &#128465; Delete All Products
              </button>
            </div>
          </div>
          ` : ''}

          ${state.activeTab === 'orders' ? renderOrdersTab(state) : ''}

          ${state.activeTab === 'users' ? renderUsersTab(state) : ''}

          ${state.activeTab === 'visitors' ? renderVisitorsTab(state) : ''}

          ${state.activeTab === 'settings' ? renderSettingsTab(state) : ''}

          ${state.activeTab === 'affiliates' ? renderAffiliatesAdminTab(state, renderPage) : ''}

          ${state.activeTab === 'telegram' ? renderTelegramTab(state) : ''}

        </div>
      </div>
    `;

    // Modal is NOT recreated here Ã¢â‚¬â€ ensureModal() is called only inside openModal()
    // so a renderPage() triggered by a tab switch can never destroy an in-progress save.
    if (state.activeTab === 'inventory') {
      renderTable();
    }
    attachEvents();
    // Bind tab-specific event handlers via their modules
    if (state.activeTab === 'orders')   bindOrdersAdminTabEvents(state, loadOrders, showToast);
    if (state.activeTab === 'users')    bindUsersAdminTabEvents(state, loadUsers, showToast);
    if (state.activeTab === 'visitors') bindVisitorsAdminTabEvents(state, loadVisitors, loadNotificationLogs);
    if (state.activeTab === 'telegram') bindTelegramAdminTabEvents(state, renderPage, showToast, updateTelegramSettings);
    if (state.activeTab === 'settings') bindSettingsAdminTabEvents(state, showToast, saveDiscount, bulkUpdateSalePrices, loadInventory, updateSiteSettings, loadSiteSettings);
    if (state.activeTab === 'affiliates') bindAffiliatesAdminTabEvents(state, renderPage);
    // Auto-load data for new tabs
    if (state.activeTab === 'orders' && !state.orders && !state.ordersLoading) loadOrders();
    if (state.activeTab === 'users' && !state.users && !state.usersLoading) loadUsers();
    if (state.activeTab === 'visitors' && !state.visitors && !state.visitorsLoading) loadVisitors();
    if (state.activeTab === 'visitors' && !state.notificationLogs && !state.notificationLogsLoading) loadNotificationLogs();
    if (state.activeTab === 'affiliates' && !state.affiliates && !state.affiliatesLoading) {
      loadAffiliateTab();
    }
  }


  // Ã¢â€â‚¬Ã¢â€â‚¬ DATA LOADERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Ã¢â€â‚¬Ã¢â€â‚¬ DATA LOADERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  async function loadAffiliateTab() {
    state.affiliatesLoading = true;
    renderPage();
    try {
      const { fetchAllAffiliates, fetchAffiliateSettings } = await import('../services/affiliateService.js');
      const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
      state.affiliates = data || [];
      state.affiliateSettings = await fetchAffiliateSettings();
    } catch (err) {
      showToast('Failed to load affiliate information: ' + err.message, 'error');
    } finally {
      state.affiliatesLoading = false;
      renderPage();
    }
  }

  async function loadOrders() {
    state.ordersLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-orders');
      const data = await res.json();
      state.orders = data.orders || [];
    } catch (err) {
      state.orders = [];
      showToast('Failed to load orders: ' + err.message, 'error');
    } finally {
      state.ordersLoading = false;
      renderPage();
    }
  }

  async function loadUsers() {
    state.usersLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.users = data.users || [];
    } catch (err) {
      state.users = [];
      showToast('Failed to load users: ' + err.message, 'error');
    } finally {
      state.usersLoading = false;
      renderPage();
    }
  }

  async function loadVisitors() {
    state.visitorsLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-visitors');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.visitors = { sessions: data.sessions || [], topPages: data.topPages || [] };
    } catch (err) {
      state.visitors = { sessions: [], topPages: [] };
      showToast('Failed to load visitors: ' + err.message, 'error');
    } finally {
      state.visitorsLoading = false;
      renderPage();
    }
  }

  async function loadNotificationLogs() {
    state.notificationLogsLoading = true;
    try {
      const res = await fetch('/api/admin-notification-logs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.notificationLogs = data.logs || [];
    } catch (err) {
      state.notificationLogs = [];
      showToast('Failed to load notification history: ' + err.message, 'error');
    } finally {
      state.notificationLogsLoading = false;
      renderPage();
    }
  }

  function renderTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    let filtered = [...state.products];
    if (state.search) {
      const q = state.search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:var(--space-xl); color:var(--text-muted);">${state.search ? `No products matching "${state.search}"` : 'No products. Click "Add New Product" to get started.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.15s;" 
          onmouseover="this.style.background='rgba(255,255,255,0.03)'" 
          onmouseout="this.style.background='transparent'">
        <td style="padding:var(--space-sm) var(--space-lg);">
          <div style="display:flex; align-items:center; gap:var(--space-sm);">
            <img src="${p.images?.[0] || 'https://placehold.co/40x40/1a1a2e/00ff88?text=P'}" 
                 alt="${sanitizeHTML(p.name || '')}"
                 loading="lazy"
                 style="width:40px; height:40px; border-radius:4px; object-fit:cover; background:#1a1a2e;"
                 onerror="this.src='https://placehold.co/40x40/1a1a2e/00ff88?text=P'" />
            <div style="font-weight:500;">${sanitizeHTML(p.name || '(unnamed)')}</div>
          </div>
        </td>
        <td style="padding:var(--space-sm); color:var(--text-secondary); text-transform:capitalize;">${sanitizeHTML(p.category || '')}</td>
        <td style="padding:var(--space-sm); color:var(--text-secondary);">${sanitizeHTML(p.brand || '')}</td>
        <td style="padding:var(--space-sm);">${formatPrice(p.price)}</td>
        <td style="padding:var(--space-sm); color:var(--neon-green); font-weight:bold;">${formatPrice(p.salePrice)}</td>
        <td style="padding:var(--space-sm);">
          ${p.isFeatured ? '<span class="badge badge-purple" style="font-size:10px;">Featured</span>' : ''}
          ${p.isTrending ? '<span class="badge badge-blue" style="font-size:10px;">Trending</span>' : ''}
          ${p.isNew ? '<span class="badge" style="font-size:10px; background:rgba(0,255,136,0.15); color:var(--neon-green);">New</span>' : ''}
          ${!p.isFeatured && !p.isTrending && !p.isNew ? '<span style="color:var(--text-muted); font-size:12px;">Standard</span>' : ''}
        </td>
        <td style="padding:var(--space-sm) var(--space-lg); text-align:right;">
          <button class="btn btn-ghost btn-xs admin-edit-btn" data-id="${p.id}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
          <button class="btn btn-ghost btn-xs admin-del-btn" data-id="${p.id}" style="padding:4px 10px; font-size:12px; color:#ff4444;">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function attachEvents() {
    // Search
    document.getElementById('admin-search')?.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderTable();
    });

    // Edit / Delete Actions
    document.getElementById('admin-table-body')?.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.admin-edit-btn');
      const delBtn = e.target.closest('.admin-del-btn');
      
      if (editBtn) {
        const id = editBtn.dataset.id;
        state.editingProduct = state.products.find(p => p.id == id) || null;
        openModal(state);
      }
      
      if (delBtn) {
        const id = delBtn.dataset.id;
        // Normalize to string for safe comparison (dataset always returns strings)
        const prod = state.products.find(p => String(p.id) === String(id));
        if (confirm(`Delete "${prod?.name || id}"? This cannot be undone.`)) {
          try {
            delBtn.disabled = true;
            delBtn.textContent = 'Ã¢ÂÂ³';
            await deleteProduct(id);
            showToast('Ã¢Å“â€¦ Product deleted from Supabase', 'success');
          } catch (err) {
            showToast('Ã¢ÂÅ’ Delete failed: ' + (err.message || 'Supabase error Ã¢â‚¬â€ check RLS policies'), 'error');
            delBtn.disabled = false;
            delBtn.textContent = 'Delete';
          }
        }
      }
    });

    // Add Product
    document.getElementById('admin-add-product')?.addEventListener('click', () => {
      state.editingProduct = null;
      openModal(state);
    });

    // Delete ALL Products Ã¢â‚¬â€ triple-confirm with typed verification
    document.getElementById('admin-clear-all')?.addEventListener('click', async () => {
      // Step 1: initial confirm
      const first = confirm('Ã¢Å¡Â Ã¯Â¸Â WARNING: This will permanently delete ALL products from the database.\n\nClick OK only if you are absolutely sure.');
      if (!first) return;
      // Step 2: typed confirmation
      const typed = prompt('Type DELETE to confirm you want to erase every product:');
      if (!typed || typed.trim().toUpperCase() !== 'DELETE') {
        showToast('Cancelled Ã¢â‚¬â€ type DELETE to confirm.', 'error');
        return;
      }
      try {
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = true; btn.textContent = 'Ã¢ÂÂ³ Deleting...'; }
        await clearAllProducts();
        await loadInventory();
        state.products = getInventory();
        renderPage();
        showToast('Ã°Å¸â€”â€˜Ã¯Â¸Â All products deleted. Use Restore to recover.', 'success');
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = false; btn.textContent = 'Ã°Å¸â€”â€˜Ã¯Â¸Â Delete All Products'; }
      }
    });

    // Restore Missing Products Ã¢â‚¬â€ single batch insert with timeout guard
    document.getElementById('admin-restore-products')?.addEventListener('click', async () => {
      const btn = document.getElementById('admin-restore-products');
      const statusEl = document.getElementById('restore-status');
      if (!btn || !statusEl) return;

      btn.disabled = true;
      btn.textContent = 'Ã¢ÂÂ³ Restoring...';
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--text-secondary)';
      statusEl.textContent = 'Ã°Å¸â€Â Checking what is already in Supabase...';

      try {
        // 1. Fetch current inventory with a 10s timeout
        const invTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Supabase timeout Ã¢â‚¬â€ check your connection.')), 10000));
        await Promise.race([loadInventory(), invTimeout]);

        const existing = new Set(getInventory().map(p => p.id));
        const missing = SEED_PRODUCTS.filter(p => !existing.has(p.id));

        if (missing.length === 0) {
          statusEl.style.color = 'var(--neon-green)';
          statusEl.textContent = 'Ã¢Å“â€¦ All catalogue products are already in Supabase Ã¢â‚¬â€ nothing to restore.';
          showToast('Everything is already up to date!', 'success');
          btn.disabled = false;
          btn.textContent = 'Ã¢â€ Â» Restore Products';
          return;
        }

        statusEl.textContent = `Found ${missing.length} missing product(s). Preparing batch insert...`;

        // 2. Apply live discount to every missing product
        const discountPct = getDiscountPct();
        const readyToInsert = missing.map(p => {
          const mult = (100 - discountPct) / 100;
          const salePrice = +(p.price * mult).toFixed(2);
          const effectivePrice = salePrice < p.price ? salePrice : p.price;
          return {
            ...p,
            salePrice,
            cryptoPrices: {
              BTC: +(effectivePrice / 90000).toFixed(6),
              ETH: +(effectivePrice / 3200).toFixed(5),
              USDT: effectivePrice,
            },
          };
        });

        statusEl.textContent = `Inserting ${readyToInsert.length} product(s) into Supabase...`;
        // 3. Single bulk insert with a 15s hard timeout
        const insertTimeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Insert timed out after 15s.')), 15000)
        );
        await Promise.race([bulkInsertProducts(readyToInsert), insertTimeout]);

        // 4. Reload and re-render
        statusEl.textContent = 'Refreshing inventory...';
        await loadInventory();
        state.products = getInventory();
        renderPage();

        statusEl.style.color = 'var(--neon-green)';
        statusEl.textContent = `âœ… Successfully restored ${readyToInsert.length} product(s)!`;
        showToast(`âœ… Restored ${readyToInsert.length} missing products!`, 'success');

      } catch (err) {
        statusEl.style.color = '#ff4444';
        statusEl.textContent = 'âŒ ' + err.message;
        showToast('Restore failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'â†» Restore Products';
      }
    });

    // Tab Clicks
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.activeTab = e.target.dataset.tab;
        renderPage();
      });
    });
  }



  // Subscribe to inventory changes Ã¢â‚¬â€ only update state + table, NOT full re-render
  const unsubscribe = on('inventory:updated', (newInventory) => {
    state.products = newInventory;

    // If the modal is currently open and saving, do NOT touch the DOM at all Ã¢â‚¬â€
    // the save handler will call closeModal() and then we can update safely.
    const modal = document.getElementById('product-modal');
    const isSaving = modal && modal.dataset.saving === '1';
    if (isSaving) return;

    const tbody = document.getElementById('admin-table-body');
    if (tbody) {
      // Update table in-place so the modal is never torn down mid-operation
      renderTable();
      // Update the stat counters individually (they now have IDs)
      const stats = getStats();
      const el1 = document.getElementById('stat-total');
      const el2 = document.getElementById('stat-bundles');
      const el3 = document.getElementById('stat-value');
      if (el1) el1.textContent = stats.total;
      if (el2) el2.textContent = stats.bundles;
      if (el3) el3.textContent = formatPrice(stats.value);
    } else {
      // Table not in DOM Ã¢â‚¬â€ full re-render is safe since modal isn't open
      renderPage();
    }
  });

  renderPage();
}
