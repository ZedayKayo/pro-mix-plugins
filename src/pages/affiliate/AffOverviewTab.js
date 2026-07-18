// ═══════════════════════════════════════════════════════
// Affiliate Overview Tab
// ═══════════════════════════════════════════════════════

import { kpiCard, fmtAmt, timeAgo, renderSparkline, generateMockMonthlyData } from './AffCharts.js';

export function renderOverviewTab(affiliate, stats, notifications) {
  const s = stats || {};
  const cr = (s.conversion_rate || 0).toFixed(2);

  return `
    <div class="aff-stats-grid">
      ${kpiCard('🖱️', 'Total Clicks',      s.total_clicks || 0,              'green',  `${s.unique_clicks || 0} unique`)}
      ${kpiCard('🛒', 'Total Orders',       s.total_orders || 0,              'blue',   `$${fmtAmt(s.confirmed_sales)} confirmed`)}
      ${kpiCard('💰', 'Commission Earned',  '$' + fmtAmt(s.commission_earned), 'orange', `$${fmtAmt(s.commission_paid)} paid`)}
      ${kpiCard('📈', 'Conversion Rate',    cr + '%',                         'purple', `$${fmtAmt(s.avg_order_value)} avg order`)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:var(--space-lg);">
      <div class="aff-panel">
        <div class="aff-panel-header">
          <h3 class="aff-panel-title">Monthly Earnings</h3>
          <span class="text-xs text-muted">Last 6 months</span>
        </div>
        <div class="aff-panel-body">
          <div class="aff-chart-wrap">${renderSparkline(generateMockMonthlyData(s.commission_earned || 0))}</div>
          <div class="aff-chart-labels">
            ${['Jan','Feb','Mar','Apr','May','Jun'].map(m => `<span class="aff-chart-label">${m}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="aff-panel">
        <div class="aff-panel-header"><h3 class="aff-panel-title">Recent Activity</h3></div>
        <div class="aff-panel-body" style="padding:0;">
          <div class="aff-activity-feed">
            ${notifications.length ? notifications.map(n => `
              <div class="aff-activity-item" style="padding:12px var(--space-lg);">
                <div class="aff-activity-icon ${n.type === 'new_sale' ? 'sale' : n.type === 'payout_sent' ? 'payout' : 'click'}">
                  ${n.type === 'new_sale' ? '💰' : n.type === 'payout_sent' ? '💸' : '🔔'}
                </div>
                <div class="aff-activity-text">
                  <div class="aff-activity-title">${n.title}</div>
                  <div class="aff-activity-time">${timeAgo(n.created_at)}</div>
                </div>
              </div>`).join('')
            : `<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted);font-size:var(--text-sm);">
                No recent activity yet.<br>Share your link to start!
               </div>`}
          </div>
        </div>
      </div>
    </div>

    <div class="aff-balance-grid" style="margin-top:var(--space-lg);">
      <div class="aff-balance-card pending">
        <div class="aff-balance-label">Pending Balance</div>
        <div class="aff-balance-amount">$${fmtAmt(s.commission_pending)}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">Awaiting approval</div>
      </div>
      <div class="aff-balance-card available">
        <div class="aff-balance-label">Available to Withdraw</div>
        <div class="aff-balance-amount">$${fmtAmt((s.commission_earned || 0) - (s.commission_paid || 0) - (s.commission_pending || 0))}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">Ready for payout</div>
      </div>
      <div class="aff-balance-card paid">
        <div class="aff-balance-label">Total Paid Out</div>
        <div class="aff-balance-amount">$${fmtAmt(s.commission_paid)}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">Lifetime earnings</div>
      </div>
    </div>`;
}
