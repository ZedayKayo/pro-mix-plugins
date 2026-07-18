import { sanitizeHTML } from '../../core/utils.js';

export function renderVisitorsTab(state) {
  if (state.visitorsLoading) {
    return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading visitor data...</p></div>`;
  }
  if (!state.visitors) {
    return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-visitors">Load Visitor Data</button></div>`;
  }
  const sessions = state.visitors.sessions || [];
  const topPages = state.visitors.topPages || [];
  const today = new Date().toDateString();
  const todayCount = sessions.filter(s => new Date(s.last_seen).toDateString() === today).length;
  const countries = [...new Set(sessions.map(s => s.country).filter(Boolean))];
  const uniqueIps = [...new Set(sessions.map(s => s.ip_address).filter(Boolean))];

  return `
    <div style="margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:var(--space-md);">
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Sessions</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${sessions.length}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Unique IPs</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-purple);">${uniqueIps.length}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Today</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${todayCount}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Countries</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${countries.length}</div></div>
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Page Views</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-orange);">${sessions.reduce((a,s) => a + (s.page_views || 0), 0)}</div></div>
      </div>

      <div style="display:grid; grid-template-columns:2fr 1fr; gap:var(--space-lg);">
        <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
          <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
            <h3 style="margin:0;">Recent Visitors</h3>
            <div style="display:flex; gap:8px;">
              <a href="/api/admin-logs-txt" target="_blank" download="visitor_activity.txt" class="btn btn-ghost" style="font-size:0.8rem; border:1px solid rgba(0,212,255,0.3); color:var(--neon-blue);">📥 Download .txt Log</a>
              <button class="btn btn-ghost" id="btn-refresh-visitors" style="font-size:0.8rem;">🔄 Refresh</button>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse;" class="admin-table">
              <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.78rem;">
                <th style="padding:8px 12px;">IP Address</th>
                <th style="padding:8px;">Location</th>
                <th style="padding:8px;">Device</th>
                <th style="padding:8px;">Browser</th>
                <th style="padding:8px;">Views</th>
                <th style="padding:8px;">Last Seen</th>
              </tr></thead>
              <tbody>
                ${sessions.slice(0, 50).map(s => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:8px 12px; font-size:0.8rem; font-family:monospace; color:var(--text-secondary);">${sanitizeHTML(s.ip_address || '—')}</td>
                    <td style="padding:8px; font-size:0.82rem;">${sanitizeHTML(s.city && s.city !== 'unknown' ? s.city + ', ' : '')}${sanitizeHTML(s.country || 'Unknown')}</td>
                    <td style="padding:8px; font-size:0.82rem; color:var(--text-secondary);">${sanitizeHTML(s.os || '—')}</td>
                    <td style="padding:8px; font-size:0.82rem; color:var(--text-secondary);">${sanitizeHTML(s.browser || '—')}</td>
                    <td style="padding:8px; font-size:0.82rem; color:var(--neon-blue); font-weight:600;">${s.page_views || 0}</td>
                    <td style="padding:8px; font-size:0.78rem; color:var(--text-muted);">${s.last_seen ? new Date(s.last_seen).toLocaleString() : '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-panel" style="border-radius:var(--radius-lg); padding:var(--space-lg);">
          <h3 style="margin:0 0 var(--space-md) 0;">🔝 Top Pages</h3>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${topPages.map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                <span style="font-size:0.8rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${sanitizeHTML(p.page)}</span>
                <span style="font-size:0.8rem; font-weight:bold; color:var(--neon-blue); flex-shrink:0; margin-left:8px;">${p.views}</span>
              </div>`).join('')}
            ${topPages.length === 0 ? '<p class="text-muted text-sm">No page data yet.</p>' : ''}
          </div>
        </div>
      </div>

      <!-- NOTIFICATION HISTORY -->
      <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
        <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
          <div>
            <h3 style="margin:0;">📢 Notification History</h3>
            <p class="text-xs text-muted" style="margin:4px 0 0 0;">Every Telegram notification attempt, newest first.</p>
          </div>
          <button class="btn btn-ghost" id="btn-refresh-notif-logs" style="font-size:0.8rem;">🔄 Refresh</button>
        </div>
        ${state.notificationLogsLoading ? `
          <div style="padding:var(--space-xl); text-align:center; color:var(--text-muted);">⏳ Loading...</div>
        ` : !state.notificationLogs || state.notificationLogs.length === 0 ? `
          <div style="padding:var(--space-xl); text-align:center; color:var(--text-muted); font-size:0.875rem;">
            No notifications logged yet. Notifications appear here once a visitor triggers one.
          </div>
        ` : `
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse;" class="admin-table">
            <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.78rem;">
              <th style="padding:8px 12px;">Type</th>
              <th style="padding:8px;">Page</th>
              <th style="padding:8px;">Location</th>
              <th style="padding:8px;">Device</th>
              <th style="padding:8px;">Status</th>
              <th style="padding:8px;">Time</th>
            </tr></thead>
            <tbody>
              ${(state.notificationLogs || []).slice(0, 100).map(log => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding:8px 12px;">
                    <span style="padding:2px 8px; border-radius:20px; font-size:0.72rem; font-weight:600; white-space:nowrap;
                      background:${log.message_type === 'new_visitor' ? 'rgba(255,107,43,0.15)' : 'rgba(0,136,255,0.12)'};
                      color:${log.message_type === 'new_visitor' ? '#ff6b2b' : 'var(--neon-blue)'};
                    ">${log.message_type === 'new_visitor' ? '🆕 New Visitor' : '🧭 Page View'}</span>
                  </td>
                  <td style="padding:8px; font-size:0.78rem; font-family:monospace; color:var(--text-secondary); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${sanitizeHTML(log.page_url || '')}">\`${sanitizeHTML(log.page_url || '/')}</td>
                  <td style="padding:8px; font-size:0.8rem;">${sanitizeHTML(log.city && log.city !== 'unknown' ? log.city + ', ' : '')}${sanitizeHTML(log.country || '—')}</td>
                  <td style="padding:8px; font-size:0.78rem; color:var(--text-secondary);">${sanitizeHTML(log.os || '—')} / ${sanitizeHTML(log.browser || '—')}</td>
                  <td style="padding:8px;">
                    ${log.telegram_ok
                      ? '<span style="color:var(--neon-green); font-size:0.8rem;">✅ Sent</span>'
                      : `<span style="color:#ff4444; font-size:0.8rem;" title="${sanitizeHTML(log.error_message || '')}">❌ Failed</span>`
                    }
                  </td>
                  <td style="padding:8px; font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">${log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

export function bindVisitorsAdminTabEvents(state, loadVisitors, loadNotificationLogs) {
  document.getElementById('btn-load-visitors')?.addEventListener('click', loadVisitors);
  document.getElementById('btn-refresh-visitors')?.addEventListener('click', () => {
    state.visitors = null;
    loadVisitors();
  });
  document.getElementById('btn-refresh-notif-logs')?.addEventListener('click', () => {
    state.notificationLogs = null;
    loadNotificationLogs();
  });
}
