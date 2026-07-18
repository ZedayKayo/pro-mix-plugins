import { sanitizeHTML } from '../../core/utils.js';

export function renderUsersTab(state) {
  if (state.usersLoading) {
    return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading users...</p></div>`;
  }
  if (!state.users) {
    return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-users">Load Users</button></div>`;
  }
  const users = state.users;

  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-top:var(--space-xl); margin-bottom:var(--space-xl);">
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Customers</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${users.length}</div></div>
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">With Orders</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-orange);">${users.filter(u => u.orderCount > 0).length}</div></div>
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Gifted Balance</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">$${users.reduce((acc, u) => acc + (parseFloat(u.credits) || 0), 0)}</div></div>
    </div>

    <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
      <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
        <h3 style="margin:0;">User Management</h3>
        <button class="btn btn-ghost" id="btn-refresh-users" style="font-size:0.8rem;">🔄 Refresh</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;" class="admin-table">
          <thead>
            <tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:var(--text-sm);">
              <th style="padding:10px 16px;">Name</th>
              <th style="padding:10px 8px;">Email (User ID)</th>
              <th style="padding:10px 8px;">Credits</th>
              <th style="padding:10px 8px;">Orders</th>
              <th style="padding:10px 8px;">Joined</th>
              <th style="padding:10px 16px; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:12px 16px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="rev-avatar" style="width:28px; height:28px; font-size:11px; background:hsl(${Array.from(u.name || u.email || '').reduce((a,c)=>a+c.charCodeAt(0),0)%360}, 60%, 40%)">${(u.name || '?').charAt(0).toUpperCase()}</div>
                    <span style="font-weight:600;">${sanitizeHTML(u.name || 'No Name')}</span>
                  </div>
                </td>
                <td style="padding:12px 8px;">
                  <div class="text-sm">${sanitizeHTML(u.email || '')}</div>
                  <div class="text-xs text-muted" style="font-family:monospace;">${u.id}</div>
                </td>
                <td style="padding:12px 8px; font-weight:bold; color:var(--neon-green);">$${u.credits || 0}</td>
                <td style="padding:12px 8px;"><span class="badge badge-purple" style="font-size:11px;">${u.orderCount || 0} orders</span></td>
                <td style="padding:12px 8px; font-size:12px; color:var(--text-secondary);">${new Date(u.created_at).toLocaleDateString()}</td>
                <td style="padding:12px 16px; text-align:right;">
                  <button class="btn btn-ghost btn-xs admin-gift-credits-btn" data-id="${u.id}" data-email="${u.email}" style="padding:4px 8px; font-size:11px; border:1px solid rgba(0,255,136,0.3); color:var(--neon-green);">+ Gift Credits</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function bindUsersAdminTabEvents(state, loadUsers, showToast) {
  document.getElementById('btn-load-users')?.addEventListener('click', loadUsers);
  document.getElementById('btn-refresh-users')?.addEventListener('click', () => {
    state.users = null;
    loadUsers();
  });

  // Gift Credits Click Listener
  document.querySelectorAll('.admin-gift-credits-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userId = btn.dataset.id;
      const userEmail = btn.dataset.email;
      const amountStr = prompt(`Enter USD credit amount to gift to ${userEmail}:`, '25');
      if (amountStr === null) return;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        showToast('❌ Invalid credit amount', 'error');
        return;
      }
      
      try {
        const ogText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ gifting...';
        
        const res = await fetch('/api/admin-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'gift-credits', user_id: userId, amount })
        });
        
        const data = await res.json();
        if (res.ok) {
          showToast(`✅ Successfully gifted $${amount} credits to ${userEmail}!`, 'success');
          state.users = null;
          loadUsers(); // Refresh
        } else {
          showToast('❌ Failed to gift: ' + data.error, 'error');
          btn.disabled = false;
          btn.textContent = ogText;
        }
      } catch (err) {
        showToast('❌ Network error', 'error');
        btn.disabled = false;
        btn.textContent = '+ Gift Credits';
      }
    });
  });
}
