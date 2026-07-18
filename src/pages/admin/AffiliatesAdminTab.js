// ═══════════════════════════════════════════════════════
// Admin Panel — Affiliates Management Tab Component
// ═══════════════════════════════════════════════════════

import {
  fetchAllAffiliates, approveAffiliate, rejectAffiliate, suspendAffiliate,
  fetchAllCommissions, approveCommission, rejectCommission,
  fetchAllClickLogs, fetchAffiliateLeaderboard,
  fetchAffiliateSettings, updateAffiliateSettings,
  updateAffiliateCommissionOverride, exportAffiliatesCSV, exportCommissionsCSV
} from '../../services/affiliateService.js';
import { sanitizeHTML } from '../../core/utils.js';
import { showToast } from '../../components/Toast.js';

export function createAffiliatesAdminTabState(renderPageCallback) {
  return {
    affiliates: null,
    affiliatesLoading: false,
    affiliateCommissions: null,
    affiliateCommissionsLoading: false,
    affiliateClickLogs: null,
    affiliateClickLogsLoading: false,
    affiliateLeaderboard: null,
    affiliateSettings: null,
    affiliateSubTab: 'applications',
  };
}

export function renderAffiliatesAdminTab(state, renderPageCallback) {
  const subTabs = [
    { id: 'applications', label: '📋 Applications' },
    { id: 'all',          label: '👥 All Affiliates' },
    { id: 'commissions',  label: '💰 Commissions' },
    { id: 'clicks',       label: '🖱️ Click Logs' },
    { id: 'leaderboard',  label: '🏆 Leaderboard' },
    { id: 'aff-settings', label: '⚙️ Settings' },
  ];

  const pending = (state.affiliates || []).filter(a => a.status === 'pending').length;
  const approved = (state.affiliates || []).filter(a => a.status === 'approved').length;
  const pendingComm = (state.affiliateCommissions || []).filter(c => c.status === 'pending').length;

  let content = '';
  const sub = state.affiliateSubTab;

  if (sub === 'applications') {
    const apps = (state.affiliates || []).filter(a => a.status === 'pending' || a.status === 'rejected');
    content = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-md);margin-bottom:var(--space-lg);">
        <div class="glass-panel" style="padding:var(--space-lg);border-radius:var(--radius-lg);"><div class="text-sm text-muted">Pending</div><div style="font-size:2rem;font-weight:bold;color:#ffc500;">${pending}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg);border-radius:var(--radius-lg);"><div class="text-sm text-muted">Approved</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${approved}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg);border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${(state.affiliates||[]).length}</div></div>
      </div>
      ${state.affiliatesLoading ? '<div style="text-align:center;padding:40px;">⏳ Loading Applications…</div>' : ''}
      <div class="glass-panel" style="border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border-primary);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.2);">
          <h3 style="margin:0;">Applications (Pending & Rejected)</h3>
          <button class="btn btn-ghost" id="aff-admin-refresh" style="font-size:0.8rem;">🔄 Refresh</button>
        </div>
        ${!apps.length ? '<div style="padding:40px;text-align:center;color:var(--text-muted);">No pending applications.</div>' : `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;" class="admin-table">
            <thead><tr style="background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:0.8rem;">
              <th style="padding:10px 16px;">Applicant</th><th style="padding:10px 8px;">Username</th>
              <th style="padding:10px 8px;">Channel</th><th style="padding:10px 8px;">Applied</th>
              <th style="padding:10px 8px;">Status</th><th style="padding:10px 8px;text-align:right;">Actions</th>
            </tr></thead>
            <tbody>
              ${apps.map(a => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                  <td style="padding:10px 16px;">
                    <div style="font-weight:600;">${sanitizeHTML(a.profiles?.name || a.profiles?.email || '—')}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">${sanitizeHTML(a.profiles?.email || '')}</div>
                  </td>
                  <td style="padding:10px 8px;font-family:monospace;font-size:0.85rem;color:var(--neon-green);">${sanitizeHTML(a.username || a.ref_code || '—')}</td>
                  <td style="padding:10px 8px;font-size:0.85rem;">${sanitizeHTML(a.promotion_channel || '—')}</td>
                  <td style="padding:10px 8px;font-size:0.8rem;color:var(--text-muted);">${a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '—'}</td>
                  <td style="padding:10px 8px;">
                    <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;
                      background:${a.status==='pending'?'rgba(255,197,0,0.15)':'rgba(255,59,92,0.12)'};
                      color:${a.status==='pending'?'#ffc500':'var(--neon-red)'};">  
                      ${a.status.toUpperCase()}
                    </span>
                  </td>
                  <td style="padding:10px 8px;text-align:right;">
                    ${a.status === 'pending' ? `
                      <button class="btn btn-primary btn-xs aff-approve-btn" data-id="${a.id}" style="padding:4px 10px;font-size:11px;margin-right:4px;">✅ Approve</button>
                      <button class="btn btn-xs aff-reject-btn" data-id="${a.id}" style="padding:4px 10px;font-size:11px;background:rgba(255,59,92,0.15);border:1px solid rgba(255,59,92,0.4);color:var(--neon-red);">✕ Reject</button>
                    ` : `<span style="color:var(--text-muted);font-size:11px;">Reviewed</span>`}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      </div>`;
  }

  if (sub === 'all') {
    const all = state.affiliates || [];
    content = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
        <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap;">
          ${['all','approved','pending','rejected','suspended'].map(s => `<button class="btn btn-xs aff-filter-status ${state.affiliateStatusFilter === s ? 'btn-primary' : ''}" data-status="${s}" style="padding:4px 12px;font-size:12px;border:1px solid var(--border-primary);background:none;color:var(--text-secondary);border-radius:var(--radius-full);cursor:pointer;">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" id="export-affiliates-csv">⬇ Export CSV</button>
      </div>
      <div class="glass-panel" style="border-radius:var(--radius-lg);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;" class="admin-table">
            <thead><tr style="background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:0.8rem;">
              <th style="padding:10px 16px;">Affiliate</th><th style="padding:10px;">Ref Code</th>
              <th style="padding:10px;">Commission</th><th style="padding:10px;">Status</th>
              <th style="padding:10px;">Payment</th><th style="padding:10px;text-align:right;">Actions</th>
            </tr></thead>
            <tbody>
              ${!all.length ? `<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-muted);">No affiliates yet.</td></tr>` :
                all.filter(a => !state.affiliateStatusFilter || state.affiliateStatusFilter === 'all' || a.status === state.affiliateStatusFilter).map(a => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:10px 16px;">
                      <div style="font-weight:600;">${sanitizeHTML(a.profiles?.name || a.profiles?.email || '—')}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">${sanitizeHTML(a.profiles?.email || '')}</div>
                    </td>
                    <td style="padding:10px;font-family:monospace;color:var(--neon-green);font-size:0.85rem;">${sanitizeHTML(a.ref_code || '—')}</td>
                    <td style="padding:10px;">
                      <input type="number" class="input aff-commission-input" data-id="${a.id}" value="${a.commission_pct ?? ''}" placeholder="Global" min="0" max="100" step="0.5"
                        style="width:80px;padding:4px 8px;font-size:12px;" title="Leave blank to use global default" />
                      <span style="font-size:11px;color:var(--text-muted);">%</span>
                    </td>
                    <td style="padding:10px;">
                      <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;
                        background:${ a.status==='approved'?'rgba(0,255,136,0.12)':a.status==='pending'?'rgba(255,197,0,0.12)':'rgba(255,59,92,0.1)' };
                        color:${ a.status==='approved'?'var(--neon-green)':a.status==='pending'?'#ffc500':'var(--neon-red)' };">
                        ${a.status.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding:10px;font-size:0.85rem;">${sanitizeHTML(a.payment_method || '—')}</td>
                    <td style="padding:10px;text-align:right;">
                      ${a.status === 'approved' ? `
                        <button class="btn btn-xs aff-commission-save" data-id="${a.id}" style="padding:4px 10px;font-size:11px;border:1px solid rgba(0,255,136,0.3);color:var(--neon-green);background:rgba(0,255,136,0.08);">Save %</button>
                        <button class="btn btn-xs aff-suspend-btn" data-id="${a.id}" style="padding:4px 10px;font-size:11px;background:rgba(255,59,92,0.1);border:1px solid rgba(255,59,92,0.3);color:var(--neon-red);margin-left:4px;">Suspend</button>
                      ` : a.status === 'pending' ? `
                        <button class="btn btn-primary btn-xs aff-approve-btn" data-id="${a.id}" style="padding:4px 10px;font-size:11px;margin-right:4px;">Approve</button>
                      ` : ''}
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  if (sub === 'commissions') {
    const comms = state.affiliateCommissions;
    content = `
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-md);">
        <button class="btn btn-ghost btn-sm" id="load-aff-commissions">🔄 Load / Refresh</button>
        ${comms ? `<button class="btn btn-ghost btn-sm" id="export-commissions-admin">⬇ Export CSV</button>` : ''}
      </div>
      ${!comms ? '<div style="text-align:center;padding:60px;color:var(--text-muted);">Click Refresh to load commissions.</div>' : `
      <div class="glass-panel" style="border-radius:var(--radius-lg);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;" class="admin-table">
            <thead><tr style="background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:0.8rem;">
              <th style="padding:10px 16px;">Affiliate</th><th style="padding:10px;">Products</th>
              <th style="padding:10px;">Order $</th><th style="padding:10px;">Commission</th>
              <th style="padding:10px;">Status</th><th style="padding:10px;">Date</th><th style="padding:10px;text-align:right;">Action</th>
            </tr></thead>
            <tbody>
              ${!comms.length ? `<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted);">No commissions yet.</td></tr>` :
                comms.map(c => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:10px 16px;">${sanitizeHTML(c.affiliates?.username || c.affiliates?.ref_code || '—')}</td>
                    <td style="padding:10px;font-size:0.85rem;color:var(--text-secondary);">${sanitizeHTML(c.product_names || '—')}</td>
                    <td style="padding:10px;font-weight:600;color:var(--neon-green);">$${parseFloat(c.order_amount||0).toFixed(2)}</td>
                    <td style="padding:10px;">$${parseFloat(c.commission_amt||0).toFixed(2)} <span style="font-size:0.75rem;color:var(--text-muted)">(${c.commission_pct}%)</span></td>
                    <td style="padding:10px;">
                      <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;
                        background:${c.status==='approved'?'rgba(0,255,136,0.12)':c.status==='paid'?'rgba(0,212,255,0.1)':c.status==='rejected'?'rgba(255,59,92,0.1)':'rgba(255,197,0,0.12)'};
                        color:${c.status==='approved'?'var(--neon-green)':c.status==='paid'?'var(--neon-blue)':c.status==='rejected'?'var(--neon-red)':'#ffc500'};">
                        ${c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding:10px;font-size:0.8rem;color:var(--text-muted);">${new Date(c.created_at).toLocaleDateString()}</td>
                    <td style="padding:10px;text-align:right;">
                      ${c.status === 'pending' ? `
                        <button class="btn btn-primary btn-xs comm-approve-btn" data-id="${c.id}" style="padding:4px 8px;font-size:11px;margin-right:4px;">✅</button>
                        <button class="btn btn-xs comm-reject-btn" data-id="${c.id}" style="padding:4px 8px;font-size:11px;background:rgba(255,59,92,0.1);border:1px solid rgba(255,59,92,0.4);color:var(--neon-red);">✕</button>
                      ` : '—'}
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`}`;
  }

  if (sub === 'clicks') {
    const logs = state.affiliateClickLogs;
    content = `
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);">
        <button class="btn btn-ghost btn-sm" id="load-click-logs">🔄 Load Click Logs</button>
        <button class="btn btn-ghost btn-sm" id="load-click-logs-flagged">🚩 Flagged Only</button>
      </div>
      ${!logs ? '<div style="text-align:center;padding:60px;color:var(--text-muted);">Click Load to show click logs.</div>' : `
      <div class="glass-panel" style="border-radius:var(--radius-lg);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;" class="admin-table">
            <thead><tr style="background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:0.8rem;">
              <th style="padding:10px 16px;">Affiliate</th><th style="padding:10px;">Country</th>
              <th style="padding:10px;">Device</th><th style="padding:10px;">Browser</th>
              <th style="padding:10px;">Source</th><th style="padding:10px;">Unique</th>
              <th style="padding:10px;">Flagged</th><th style="padding:10px;">Time</th>
            </tr></thead>
            <tbody>
              ${!logs.length ? `<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--text-muted);">No click data yet.</td></tr>` :
                logs.map(c => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);${c.is_flagged?'background:rgba(255,59,92,0.05);':''}">
                    <td style="padding:10px 16px;font-family:monospace;font-size:0.8rem;color:var(--neon-green);">${sanitizeHTML(c.affiliates?.ref_code||'—')}</td>
                    <td style="padding:10px;font-size:0.85rem;">${sanitizeHTML(c.country||'—')}</td>
                    <td style="padding:10px;font-size:0.85rem;">${sanitizeHTML(c.device||'—')}</td>
                    <td style="padding:10px;font-size:0.85rem;">${sanitizeHTML(c.browser||'—')}</td>
                    <td style="padding:10px;font-size:0.8rem;color:var(--text-muted);">${ c.utm_source || (c.referrer_url ? '↩ Referrer' : 'Direct')}</td>
                    <td style="padding:10px;">${c.is_unique ? '<span style="color:var(--neon-green);">✓</span>' : '<span style="color:var(--text-muted);">–</span>'}</td>
                    <td style="padding:10px;">${c.is_flagged ? '<span style="color:var(--neon-red);font-weight:bold;">🚩 YES</span>' : '—'}</td>
                    <td style="padding:10px;font-size:0.8rem;color:var(--text-muted);">${new Date(c.clicked_at).toLocaleString()}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`}`;
  }

  if (sub === 'leaderboard') {
    content = `
      <div style="margin-bottom:var(--space-md);">
        <button class="btn btn-ghost btn-sm" id="load-leaderboard">🔄 Load Leaderboard</button>
      </div>
      ${!state.affiliateLeaderboard ? '<div style="text-align:center;padding:60px;color:var(--text-muted);">Click Load to see the leaderboard.</div>' : `
      <div class="glass-panel" style="border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border-primary);background:rgba(0,0,0,0.2);"><h3 style="margin:0;">🏆 Top Affiliates by Revenue</h3></div>
        <div style="padding:var(--space-md);">
          ${!state.affiliateLeaderboard.length ? '<div style="text-align:center;padding:40px;color:var(--text-muted);">No data yet.</div>' :
            state.affiliateLeaderboard.map((a, i) => `
              <div style="display:grid;grid-template-columns:40px 1fr auto auto;align-items:center;gap:var(--space-md);padding:12px;border-bottom:1px solid rgba(255,255,255,0.04);">
                <div style="font-size:1.2rem;font-weight:900;text-align:center;color:${i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)'};">${ i < 3 ? ['🥇','🥈','🥉'][i] : i+1 }</div>
                <div>
                  <div style="font-weight:600;">${sanitizeHTML(a.name || a.username || '—')}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);font-family:monospace;">${sanitizeHTML(a.username||'')}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:bold;color:var(--neon-green);">$${parseFloat(a.total_revenue||0).toFixed(2)}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">revenue</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:600;color:var(--neon-blue);">$${parseFloat(a.total_commissions||0).toFixed(2)}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">${a.order_count} orders</div>
                </div>
              </div>`).join('')}
        </div>
      </div>`}`;
  }

  if (sub === 'aff-settings') {
    const s = state.affiliateSettings || {};
    content = `
      <div class="glass-panel" style="border-radius:var(--radius-lg);padding:var(--space-xl);max-width:600px;">
        <h3 style="margin:0 0 var(--space-lg) 0;">⚙️ Affiliate Program Settings</h3>
        <form id="aff-settings-form" style="display:flex;flex-direction:column;gap:var(--space-md);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Global Commission %</label>
              <input type="number" class="input" id="as-commission" value="${s.global_commission_pct ?? 50}" min="0" max="100" step="0.5" />
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Cookie Duration (days)</label>
              <input type="number" class="input" id="as-cookie" value="${s.cookie_duration_days ?? 30}" min="1" max="365" />
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Min Payout Amount ($)</label>
              <input type="number" class="input" id="as-minpayout" value="${s.min_payout_amount ?? 20}" min="1" />
            </div>
            <div>
              <label class="text-sm text-secondary" style="display:block;margin-bottom:4px;">Fraud Click Threshold (per hr)</label>
              <input type="number" class="input" id="as-fraud" value="${s.fraud_click_threshold ?? 50}" min="10" />
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.9rem;">
            <input type="checkbox" id="as-autoapprove" ${s.auto_approve_applications ? 'checked' : ''} />
            Auto-approve affiliate applications
          </label>
          <div>
            <button type="submit" class="btn btn-primary">💾 Save Settings</button>
            <span id="aff-settings-status" class="text-sm" style="margin-left:var(--space-md);"></span>
          </div>
        </form>
      </div>`;
  }

  return `
    <div style="margin-top:var(--space-xl);">
      <div style="display:flex;gap:var(--space-xs);margin-bottom:var(--space-xl);flex-wrap:wrap;">
        ${subTabs.map(t => `
          <button class="btn ${state.affiliateSubTab === t.id ? 'btn-primary' : 'btn-ghost'} aff-admin-subtab" data-subtab="${t.id}"
            style="padding:6px 14px;font-size:0.875rem;position:relative;">
            ${t.label}
            ${t.id==='applications' && pending > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:var(--neon-red);color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${pending}</span>` : ''}
            ${t.id==='commissions' && pendingComm > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:#ffc500;color:#000;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${pendingComm}</span>` : ''}
          </button>`).join('')}
      </div>
      ${content}
    </div>`;
}

export function bindAffiliatesAdminTabEvents(state, renderPageCallback) {
  // Tab Switching
  document.querySelectorAll('.aff-admin-subtab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.affiliateSubTab = e.target.closest('[data-subtab]').dataset.subtab;
      renderPageCallback();
    });
  });

  // Applications buttons (Approve / Reject)
  document.querySelectorAll('.aff-approve-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Approve this affiliate application?')) return;
      try {
        await approveAffiliate(id);
        showToast('Application approved!', 'success');
        // Reload list
        const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
        state.affiliates = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.aff-reject-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const reason = prompt('Provide rejection reason (optional):');
      if (reason === null) return;
      try {
        await rejectAffiliate(id, reason);
        showToast('Application rejected.', 'info');
        const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
        state.affiliates = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  // All Tab Filters
  document.querySelectorAll('.aff-filter-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.affiliateStatusFilter = e.target.dataset.status;
      renderPageCallback();
    });
  });

  // Commission override settings save button
  document.querySelectorAll('.aff-commission-save').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const input = document.querySelector(`.aff-commission-input[data-id="${id}"]`);
      const pct = input?.value || '';
      try {
        await updateAffiliateCommissionOverride(id, pct);
        showToast('Commission rate override updated!', 'success');
        const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
        state.affiliates = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  // Suspend affiliate button
  document.querySelectorAll('.aff-suspend-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const note = prompt('Reason for suspension (optional):');
      if (note === null) return;
      try {
        await suspendAffiliate(id, note);
        showToast('Affiliate account suspended.', 'warning');
        const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
        state.affiliates = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  // CSV Export Buttons
  document.getElementById('export-affiliates-csv')?.addEventListener('click', () => {
    if (state.affiliates) exportAffiliatesCSV(state.affiliates);
  });

  // Load and refresh click handlers
  document.getElementById('aff-admin-refresh')?.addEventListener('click', async () => {
    const { data } = await fetchAllAffiliates({ page: 0, limit: 100 });
    state.affiliates = data || [];
    renderPageCallback();
  });

  document.getElementById('load-aff-commissions')?.addEventListener('click', async () => {
    state.affiliateCommissionsLoading = true;
    renderPageCallback();
    const { data } = await fetchAllCommissions({ page: 0, limit: 100 });
    state.affiliateCommissions = data || [];
    state.affiliateCommissionsLoading = false;
    renderPageCallback();
  });

  document.getElementById('export-commissions-admin')?.addEventListener('click', () => {
    if (state.affiliateCommissions) exportCommissionsCSV(state.affiliateCommissions);
  });

  // Approve / reject sales commission triggers
  document.querySelectorAll('.comm-approve-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      try {
        await approveCommission(id);
        showToast('Commission approved!', 'success');
        const { data } = await fetchAllCommissions({ page: 0, limit: 100 });
        state.affiliateCommissions = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.comm-reject-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const note = prompt('Reason for rejection:');
      if (!note) return;
      try {
        await rejectCommission(id, note);
        showToast('Commission rejected.', 'info');
        const { data } = await fetchAllCommissions({ page: 0, limit: 100 });
        state.affiliateCommissions = data || [];
        renderPageCallback();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  // Load Click Logs triggers
  document.getElementById('load-click-logs')?.addEventListener('click', async () => {
    state.affiliateClickLogsLoading = true;
    renderPageCallback();
    const { data } = await fetchAllClickLogs({ page: 0, limit: 100 });
    state.affiliateClickLogs = data || [];
    state.affiliateClickLogsLoading = false;
    renderPageCallback();
  });

  document.getElementById('load-click-logs-flagged')?.addEventListener('click', async () => {
    state.affiliateClickLogsLoading = true;
    renderPageCallback();
    const { data } = await fetchAllClickLogs({ flaggedOnly: true, page: 0, limit: 100 });
    state.affiliateClickLogs = data || [];
    state.affiliateClickLogsLoading = false;
    renderPageCallback();
  });

  // Load Leaderboard triggers
  document.getElementById('load-leaderboard')?.addEventListener('click', async () => {
    state.affiliateLeaderboard = await fetchAffiliateLeaderboard(15);
    renderPageCallback();
  });

  // Settings Save Configuration trigger
  document.getElementById('aff-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('aff-settings-status');
    if (status) { status.textContent = 'Saving…'; status.style.color = '#fff'; }
    try {
      await updateAffiliateSettings({
        global_commission_pct: parseFloat(document.getElementById('as-commission').value) || 50,
        cookie_duration_days: parseInt(document.getElementById('as-cookie').value) || 30,
        min_payout_amount: parseFloat(document.getElementById('as-minpayout').value) || 20,
        fraud_click_threshold: parseInt(document.getElementById('as-fraud').value) || 50,
        auto_approve_applications: document.getElementById('as-autoapprove').checked,
      });
      if (status) { status.textContent = 'Settings saved!'; status.style.color = 'var(--neon-green)'; }
      showToast('Affiliate settings saved!', 'success');
      state.affiliateSettings = await fetchAffiliateSettings();
      renderPageCallback();
    } catch (err) {
      if (status) { status.textContent = 'Error saving'; status.style.color = 'var(--neon-red)'; }
      showToast('Error: ' + err.message, 'error');
    }
  });
}
