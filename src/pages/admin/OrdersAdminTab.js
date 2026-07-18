import { formatPrice, sanitizeHTML } from '../../core/utils.js';

export function renderOrdersTab(state) {
  if (state.ordersLoading) {
    return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading orders...</p></div>`;
  }
  if (!state.orders) {
    return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-orders">Load Orders</button></div>`;
  }
  const orders = state.orders;
  const totalRevenue = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-top:var(--space-xl); margin-bottom:var(--space-xl);">
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Orders</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${orders.length}</div></div>
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Revenue</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${formatPrice(totalRevenue)}</div></div>
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Pending/Completed</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-orange);">${pendingCount} / ${completedCount}</div></div>
    </div>

    <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
      <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
        <h3 style="margin:0;">All Orders</h3>
        <button class="btn btn-ghost" id="btn-refresh-orders" style="font-size:0.8rem;">🔄 Refresh</button>
      </div>
      <div style="overflow-x:auto;">
        ${orders.length === 0 ? `<div style="padding:var(--space-3xl); text-align:center; color:var(--text-muted);">No orders yet.</div>` : `
          <table style="width:100%; border-collapse:collapse; text-align:left;" class="admin-table">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:var(--text-sm);">
                <th style="padding:10px 16px;">Order ID</th>
                <th style="padding:10px 8px;">Customer (ID/Email)</th>
                <th style="padding:10px 8px;">Items</th>
                <th style="padding:10px 8px;">Total</th>
                <th style="padding:10px 8px;">Method</th>
                <th style="padding:10px 8px;">Status</th>
                <th style="padding:10px 16px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:12px 16px; font-family:monospace; font-size:12px; color:var(--text-secondary);">${o.id}</td>
                  <td style="padding:12px 8px;">
                    <div class="text-sm">${sanitizeHTML(o.customer_name || 'Guest')}</div>
                    <div class="text-xs text-muted">${sanitizeHTML(o.user_id || o.guest_email || 'anonymous')}</div>
                  </td>
                  <td style="padding:12px 8px; font-size:13px;">
                    ${(o.items || []).map(i => `<div style="margin-bottom:2px;">• ${sanitizeHTML(i.name)}</div>`).join('')}
                  </td>
                  <td style="padding:12px 8px; font-weight:bold; color:var(--neon-green);">${formatPrice(o.total)}</td>
                  <td style="padding:12px 8px; text-transform:uppercase; font-size:12px; color:var(--neon-blue); font-weight:600;">${o.payment_method}</td>
                  <td style="padding:12px 8px;"><span class="badge badge-${o.status === 'completed' ? 'green' : o.status === 'pending' ? 'orange' : 'red'}">${o.status}</span></td>
                  <td style="padding:12px 16px; text-align:right;">
                    ${o.status === 'pending' ? `<button class="btn btn-primary btn-xs admin-approve-order-btn" data-id="${o.id}" style="padding:4px 8px; font-size:11px;">Approve</button>` : '<span style="color:var(--text-muted); font-size:12px;">N/A</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
    
    ${pendingCount > 0 ? `
      <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg); border:1px solid rgba(255,107,43,0.3); margin-top:var(--space-lg);">
        <h4 style="margin:0 0 8px 0; color:#ff6b2b;">⚠️ ${pendingCount} Pending Order(s) Need Verification</h4>
        <p class="text-sm text-secondary" style="margin:0;">Use the Approve button above to finalize orders and release licenses.</p>
      </div>
    ` : ''}
  `;
}

export function bindOrdersAdminTabEvents(state, loadOrders, showToast) {
  document.getElementById('btn-load-orders')?.addEventListener('click', loadOrders);
  document.getElementById('btn-refresh-orders')?.addEventListener('click', () => {
    state.orders = null;
    loadOrders();
  });

  // Approve Order Click Listener
  document.querySelectorAll('.admin-approve-order-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const orderId = btn.dataset.id;
      if (!confirm('Approve this payment and dispatch licenses?')) return;
      
      try {
        const ogText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳...';
        
        const res = await fetch('/api/admin-orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, status: 'completed' })
        });
        
        const data = await res.json();
        if (res.ok) {
          showToast('✅ Order approved successfully!', 'success');
          state.orders = null;
          loadOrders(); // Re-render the orders table automatically
        } else {
          showToast('❌ Failed to approve: ' + data.error, 'error');
          btn.disabled = false;
          btn.textContent = ogText;
        }
      } catch (err) {
        showToast('❌ Network error', 'error');
        btn.disabled = false;
        btn.textContent = 'Approve';
      }
    });
  });
}
