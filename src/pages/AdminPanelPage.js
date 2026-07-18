// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRO-MIX PLUGINS â€” Admin Panel
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // â”€â”€ Modal: lives on document.body so re-renders can't destroy it â”€â”€

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
                <button class="btn ${state.activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="inventory" style="padding:6px 14px; font-size:0.875rem;">ðŸ“¦ Inventory</button>
                <button class="btn ${state.activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="orders" style="padding:6px 14px; font-size:0.875rem;">ðŸ“‹ Orders</button>
                <button class="btn ${state.activeTab === 'users' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="users" style="padding:6px 14px; font-size:0.875rem;">ðŸ‘¤ Users</button>
                <button class="btn ${state.activeTab === 'visitors' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="visitors" style="padding:6px 14px; font-size:0.875rem;">ðŸ‘¥ Visitors</button>
                <button class="btn ${state.activeTab === 'telegram' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="telegram" style="padding:6px 14px; font-size:0.875rem;">ðŸ¤– Telegram</button>
                <button class="btn ${state.activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="settings" style="padding:6px 14px; font-size:0.875rem;">âš™ï¸ Settings</button>
                <button class="btn ${state.activeTab === 'affiliates' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="affiliates" style="padding:6px 14px; font-size:0.875rem;">ðŸ¤ Affiliates</button>
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
                <span class="search-input-icon">ðŸ”</span>
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
                <p class="text-xs text-secondary" style="margin:0;">Re-adds all catalogue plugins that are missing from Supabase. Safe to run â€” existing products are never touched or duplicated.</p>
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
                <p class="text-xs text-secondary" style="margin:0;">Permanently remove ALL products from Supabase. This cannot be undone â€” use Restore above to recover.</p>
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
          ` : ''}

        </div>
      </div>
    `;

    // Modal is NOT recreated here â€” ensureModal() is called only inside openModal()
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


  // â”€â”€ DATA LOADERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // â”€â”€ DATA LOADERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        openModal();
      }
      
      if (delBtn) {
        const id = delBtn.dataset.id;
        // Normalize to string for safe comparison (dataset always returns strings)
        const prod = state.products.find(p => String(p.id) === String(id));
        if (confirm(`Delete "${prod?.name || id}"? This cannot be undone.`)) {
          try {
            delBtn.disabled = true;
            delBtn.textContent = 'â³';
            await deleteProduct(id);
            showToast('âœ… Product deleted from Supabase', 'success');
          } catch (err) {
            showToast('âŒ Delete failed: ' + (err.message || 'Supabase error â€” check RLS policies'), 'error');
            delBtn.disabled = false;
            delBtn.textContent = 'Delete';
          }
        }
      }
    });

    // Add Product
    document.getElementById('admin-add-product')?.addEventListener('click', () => {
      state.editingProduct = null;
      openModal();
    });

    // Delete ALL Products â€” triple-confirm with typed verification
    document.getElementById('admin-clear-all')?.addEventListener('click', async () => {
      // Step 1: initial confirm
      const first = confirm('âš ï¸ WARNING: This will permanently delete ALL products from the database.\n\nClick OK only if you are absolutely sure.');
      if (!first) return;
      // Step 2: typed confirmation
      const typed = prompt('Type DELETE to confirm you want to erase every product:');
      if (!typed || typed.trim().toUpperCase() !== 'DELETE') {
        showToast('Cancelled â€” type DELETE to confirm.', 'error');
        return;
      }
      try {
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = true; btn.textContent = 'â³ Deleting...'; }
        await clearAllProducts();
        await loadInventory();
        state.products = getInventory();
        renderPage();
        showToast('ðŸ—‘ï¸ All products deleted. Use Restore to recover.', 'success');
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = false; btn.textContent = 'ðŸ—‘ï¸ Delete All Products'; }
      }
    });

    // Restore Missing Products â€” single batch insert with timeout guard
    document.getElementById('admin-restore-products')?.addEventListener('click', async () => {
      const btn = document.getElementById('admin-restore-products');
      const statusEl = document.getElementById('restore-status');
      if (!btn || !statusEl) return;

      btn.disabled = true;
      btn.textContent = 'â³ Restoring...';
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--text-secondary)';
      statusEl.textContent = 'ðŸ” Checking what is already in Supabase...';

      try {
        // 1. Fetch current inventory with a 10s timeout
        const invTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Supabase timeout â€” check your connection.')), 10000));
        await Promise.race([loadInventory(), invTimeout]);

        const existing = new Set(getInventory().map(p => p.id));
        const missing = SEED_PRODUCTS.filter(p => !existing.has(p.id));

        if (missing.length === 0) {
          statusEl.style.color = 'var(--neon-green)';
          statusEl.textContent = 'âœ… All catalogue products are already in Supabase â€” nothing to restore.';
          showToast('Everything is already up to date!', 'success');
          btn.disabled = false;
          btn.textContent = 'â†» Restore Products';
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
          setTimeout(() => rej(new Error('Insert timed out after 15s. Your Supabase RLS policy may be blocking inserts â€” check the Supabase dashboard.')), 15000)
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
        console.error('Restore error:', err);
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

    if (state.activeTab === 'affiliates') {
      bindAffiliatesAdminTabEvents(state, renderPage);
    }

    // Telegram Settings
    document.getElementById('ts-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-save');
      const status = document.getElementById('ts-status');
      
      const newSettings = {
        is_enabled: document.getElementById('ts-enabled').checked,
        bot_token: document.getElementById('ts-token').value.trim(),
        chat_id: document.getElementById('ts-chat').value.trim(),
        notify_all_pages: document.getElementById('ts-all-pages').checked,
      };

      try {
        btn.disabled = true;
        btn.textContent = 'â³ Saving...';
        await updateTelegramSettings(newSettings);
        state.telegramSettings = { ...state.telegramSettings, ...newSettings };
        status.textContent = 'âœ… Saved';
        status.style.color = 'var(--neon-green)';
        showToast('Settings saved successfully', 'success');
        setTimeout(() => { status.textContent = ''; }, 3000);
      } catch (err) {
        status.textContent = 'âŒ Error';
        status.style.color = '#ff4444';
        showToast('Failed to save settings', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'ðŸ’¾ Save Config';
      }
    });

    // Verify Telegram Bot Connection
    document.getElementById('ts-verify')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-verify');
      const statusDiv = document.getElementById('ts-bot-status');
      const bot_token = document.getElementById('ts-token')?.value.trim();
      const chat_id = document.getElementById('ts-chat')?.value.trim();
      if (!bot_token) { showToast('Enter a Bot Token first', 'error'); return; }
      try {
        btn.disabled = true; btn.textContent = 'â³ Verifying...';
        const res = await fetch('/api/telegram-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_token, chat_id })
        });
        const data = await res.json();
        if (data.botValid) {
          state.botInfo = data.botInfo;
          const chatMsg = data.chatInfo
            ? `<div style="margin-top:8px; font-size:0.8rem; color:var(--neon-green);">âœ… Chat accessible â€” ${sanitizeHTML(data.chatInfo.type)} chat</div>`
            : data.chatError
            ? `<div style="margin-top:8px; font-size:0.8rem; color:#ff6b2b;">âš ï¸ Chat issue: ${sanitizeHTML(data.chatError)}<br><span style='font-size:0.75rem;color:var(--text-muted)'>Make sure you sent /start to your bot in Telegram first.</span></div>`
            : '';
          statusDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); background:rgba(0,255,136,0.08); border-radius:var(--radius-md); border:1px solid rgba(0,255,136,0.2);">
              <div style="width:48px; height:48px; background:linear-gradient(135deg,var(--neon-green),var(--neon-blue)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">ðŸ¤–</div>
              <div>
                <div style="font-weight:700; color:var(--neon-green); font-size:1rem;">${sanitizeHTML(data.botInfo.first_name)}</div>
                <div style="color:var(--text-muted); font-size:0.85rem;">@${sanitizeHTML(data.botInfo.username)}</div>
                <div style="color:var(--neon-green); font-size:0.75rem; margin-top:2px;">âœ… Bot token valid</div>
                ${chatMsg}
              </div>
            </div>`;
          showToast('âœ… Bot verified: ' + data.botInfo.first_name, 'success');
        } else {
          statusDiv.innerHTML = `<div style="padding:var(--space-md); background:rgba(255,68,68,0.08); border-radius:var(--radius-md); border:1px solid rgba(255,68,68,0.2); color:#ff4444;">
            âŒ Invalid token: ${sanitizeHTML(data.error || 'Unknown error')}</div>`;
          showToast('âŒ ' + (data.error || 'Invalid bot token'), 'error');
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'ðŸ” Verify Connection';
      }
    });

    // Orders tab buttons
    document.getElementById('btn-load-orders')?.addEventListener('click', loadOrders);
    document.getElementById('btn-refresh-orders')?.addEventListener('click', () => { state.orders = null; loadOrders(); });

    // Users tab buttons
    document.getElementById('btn-load-users')?.addEventListener('click', loadUsers);
    document.getElementById('btn-refresh-users')?.addEventListener('click', () => { state.users = null; loadUsers(); });

    // Visitors tab buttons
    document.getElementById('btn-load-visitors')?.addEventListener('click', loadVisitors);
    document.getElementById('btn-refresh-visitors')?.addEventListener('click', () => { state.visitors = null; loadVisitors(); });
    document.getElementById('btn-refresh-notif-logs')?.addEventListener('click', () => { state.notificationLogs = null; loadNotificationLogs(); });

    // Table Actions (Order Approvals & User Credits) via Event Delegation
    document.querySelector('.admin-panel')?.addEventListener('click', async (e) => {
      // 1. Approve Order Button
      const approveBtn = e.target.closest('.admin-approve-order-btn');
      if (approveBtn) {
        const orderId = approveBtn.dataset.id;
        if (!confirm('Approve this payment and dispatch licenses?')) return;
        
        try {
          const ogText = approveBtn.textContent;
          approveBtn.disabled = true;
          approveBtn.textContent = 'â³...';
          
          const res = await fetch('/api/admin-orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: 'completed' })
          });
          
          const data = await res.json();
          if (res.ok) {
            showToast('âœ… Order approved successfully!', 'success');
            state.orders = null;
            loadOrders(); // Re-render the orders table automatically
          } else {
            showToast('âŒ Failed to approve: ' + data.error, 'error');
            approveBtn.disabled = false;
            approveBtn.textContent = ogText;
          }
        } catch (err) {
          showToast('âŒ Network error', 'error');
          approveBtn.disabled = false;
          approveBtn.textContent = 'Approve';
        }
      }

      // 2. Add Credits Button
      const creditBtn = e.target.closest('.admin-add-credits-btn');
      if (creditBtn) {
        const userId = creditBtn.dataset.id;
        const userName = creditBtn.dataset.name;
        
        const amountStr = prompt(`How many credits would you like to gift to ${userName}?\n\nEnter a number (e.g. 50):`);
        if (amountStr === null) return; // User cancelled
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          showToast('Invalid amount entered.', 'error');
          return;
        }

        try {
          const ogText = creditBtn.textContent;
          creditBtn.disabled = true;
          creditBtn.textContent = 'â³...';

          const res = await fetch('/api/admin-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_credits', userId, amount })
          });

          const data = await res.json();
          if (res.ok) {
            showToast(`âœ… Added $${amount} credits to ${userName}!`, 'success');
            state.users = null;
            loadUsers(); // Re-render table
          } else {
            showToast('âŒ Failed to add credits: ' + data.error, 'error');
            creditBtn.disabled = false;
            creditBtn.textContent = ogText;
          }
        } catch (err) {
          showToast('âŒ Network error', 'error');
          creditBtn.disabled = false;
          creditBtn.textContent = '+ Gift Credits';
        }
      }
    });

    // Settings tab â€” discount slider & save
    const slider = document.getElementById('discount-slider');
    const input  = document.getElementById('discount-input');
    const previewPct = document.getElementById('discount-preview-pct');
    const previewPay = document.getElementById('discount-preview-pay');
    const exampleEl  = document.getElementById('discount-example');
    const sliderEl   = document.getElementById('discount-slider');

    // Save Site Settings
    document.getElementById('btn-save-site-settings')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-site-settings');
      const status = document.getElementById('site-settings-save-status');
      const settings = {
        discord_link: document.getElementById('ss-discord').value.trim(),
        telegram_link: document.getElementById('ss-telegram').value.trim(),
        support_email: document.getElementById('ss-email').value.trim()
      };
      
      try {
        btn.disabled = true; btn.textContent = 'â³ Saving...';
        await updateSiteSettings(settings);
        state.siteSettings = settings;
        await loadSiteSettings(); // Sync global store
        status.textContent = 'âœ… Saved!';
        status.style.color = 'var(--neon-green)';
        showToast('Site settings updated!', 'success');
        setTimeout(() => { if (status) status.textContent = ''; }, 3000);
      } catch (err) {
        showToast('Failed to save: ' + err.message, 'error');
        status.textContent = 'âŒ Error';
        status.style.color = '#ff4444';
      } finally {
        btn.disabled = false; btn.textContent = 'ðŸ’¾ Save Links';
      }
    });

    function updateDiscountUI(pct) {
      const p = Math.max(1, Math.min(99, Math.round(pct)));
      if (slider)     slider.value = p;
      if (input)      input.value  = p;
      if (previewPct) previewPct.textContent = p + '%';
      if (previewPay) previewPay.textContent  = (100 - p) + '%';
      if (exampleEl)  exampleEl.textContent   = '$' + (100 * (100 - p) / 100).toFixed(2);
      // Update slider gradient
      if (sliderEl) {
        sliderEl.style.background = `linear-gradient(to right, var(--neon-green) 0%, var(--neon-green) ${p}%, rgba(255,255,255,0.1) ${p}%, rgba(255,255,255,0.1) 100%)`;
      }
    }

    slider?.addEventListener('input', (e) => {
      const p = parseInt(e.target.value);
      if (input) input.value = p;
      updateDiscountUI(p);
    });

    input?.addEventListener('input', (e) => {
      const p = parseInt(e.target.value);
      if (!isNaN(p)) updateDiscountUI(p);
    });

    document.getElementById('btn-save-discount')?.addEventListener('click', async () => {
      const btn    = document.getElementById('btn-save-discount');
      const status = document.getElementById('discount-save-status');
      const pct    = parseInt(document.getElementById('discount-input')?.value || state.discountPct);
      if (isNaN(pct) || pct < 1 || pct > 99) {
        showToast('Enter a valid discount between 1â€“99%', 'error'); return;
      }
      try {
        btn.disabled = true; btn.textContent = 'â³ Saving discount...';
        status.textContent = 'â³ Saving setting...';
        status.style.color = 'var(--text-muted)';

        // Step 1: save the % to site_settings
        await saveDiscount(pct);
        state.discountPct = pct;

        // Step 2: recalculate & write sale_price for every product in Supabase
        btn.textContent = 'â³ Updating prices...';
        status.textContent = 'â³ Recalculating all prices...';
        const { updated } = await bulkUpdateSalePrices(pct);

        // Step 3: reload inventory so the admin table reflects new prices
        await loadInventory();

        status.textContent = `âœ… Done! ${updated} product${updated !== 1 ? 's' : ''} updated.`;
        status.style.color = 'var(--neon-green)';
        showToast(`âœ… Discount set to ${pct}% â€” ${updated} prices updated`, 'success');
        setTimeout(() => { status.textContent = ''; }, 5000);
      } catch (err) {
        status.textContent = 'âŒ ' + err.message;
        status.style.color = '#ff4444';
        showToast('Failed to save discount: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'ðŸ’¾ Save Discount';
      }
    });

    document.getElementById('ts-test')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-test');
      const bot_token = document.getElementById('ts-token').value.trim();
      const chat_id = document.getElementById('ts-chat').value.trim();

      if (!bot_token || !chat_id) {
        showToast('Enter Token and Chat ID first', 'error');
        return;
      }

      try {
        const ogText = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'â³ Sending...';
        
        const res = await fetch('/api/telegram-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_token, chat_id })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          showToast('âœ… Test message sent!', 'success');
        } else {
          showToast(`âŒ Error: ${data.error}`, 'error');
        }
        btn.innerHTML = ogText;
        btn.disabled = false;
      } catch (err) {
        showToast('âŒ Network error', 'error');
        btn.textContent = 'ðŸ’¬ Send Test Message';
        btn.disabled = false;
      }
    });
  }



  // Subscribe to inventory changes â€” only update state + table, NOT full re-render
  const unsubscribe = on('inventory:updated', (newInventory) => {
    state.products = newInventory;

    // If the modal is currently open and saving, do NOT touch the DOM at all â€”
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
      // Table not in DOM â€” full re-render is safe since modal isn't open
      renderPage();
    }
  });

  renderPage();
}
