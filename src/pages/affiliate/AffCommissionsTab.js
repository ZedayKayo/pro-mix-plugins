// ═══════════════════════════════════════════════════════
// Affiliate Commissions Tab
// ═══════════════════════════════════════════════════════

import { fetchAffiliateCommissions, exportCommissionsCSV } from '../../services/affiliateService.js';
import { fmtAmt } from './AffCharts.js';

export async function renderCommissionsTab(affiliate) {
  const { data: commissions, count } = await fetchAffiliateCommissions(affiliate.id);
  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Commission History</h2>
        <p class="aff-content-subtitle">${count} total commission${count !== 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-ghost btn-sm" id="export-commissions-btn" ${!commissions.length ? 'disabled' : ''}>⬇ Export CSV</button>
    </div>

    <div class="aff-panel">
      <div class="aff-table-wrap">
        <table class="aff-table">
          <thead>
            <tr>
              <th>Date</th><th>Products</th><th>Order $</th>
              <th>Rate</th><th>Commission</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${commissions.length ? commissions.map(c => `
              <tr>
                <td class="mono">${new Date(c.created_at).toLocaleDateString()}</td>
                <td class="text-primary">${c.product_names || '—'}</td>
                <td class="text-primary">$${fmtAmt(c.order_amount)}</td>
                <td>${c.commission_pct}%</td>
                <td style="color:var(--neon-green);font-weight:600;">$${fmtAmt(c.commission_amt)}</td>
                <td><span class="badge badge-${c.status}" style="border-radius:var(--radius-full);padding:3px 10px;font-size:11px;font-weight:600;">${c.status.toUpperCase()}</span></td>
              </tr>`).join('')
            : `<tr><td colspan="6" style="text-align:center;padding:var(--space-3xl);color:var(--text-muted);">No commissions yet — start sharing your referral link!</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

export function bindCommissionsTabEvents(affiliate) {
  document.getElementById('export-commissions-btn')?.addEventListener('click', async () => {
    const { data } = await fetchAffiliateCommissions(affiliate.id, 0, 1000);
    exportCommissionsCSV(data);
  });
}
