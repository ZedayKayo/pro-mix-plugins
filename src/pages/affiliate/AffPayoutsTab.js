// ═══════════════════════════════════════════════════════
// Affiliate Payouts Tab
// ═══════════════════════════════════════════════════════

import { fetchAffiliatePayouts, fetchAffiliateDashboardStats } from '../../services/affiliateService.js';
import { fmtAmt } from './AffCharts.js';
import { sanitizeHTML } from '../../core/utils.js';

export async function renderPayoutsTab(affiliate) {
  const [payouts, stats] = await Promise.all([
    fetchAffiliatePayouts(affiliate.id),
    fetchAffiliateDashboardStats(affiliate.id),
  ]);

  const s = stats || {};
  const available = Math.max(0, (s.commission_earned || 0) - (s.commission_paid || 0) - (s.commission_pending || 0));

  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Payouts</h2>
        <p class="aff-content-subtitle">Minimum payout: $20 · Paid monthly in crypto</p>
      </div>
    </div>

    <div class="aff-balance-grid">
      <div class="aff-balance-card pending">
        <div class="aff-balance-label">Pending Balance</div>
        <div class="aff-balance-amount">$${fmtAmt(s.commission_pending)}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">Awaiting order approval</div>
      </div>
      <div class="aff-balance-card available">
        <div class="aff-balance-label">Available Balance</div>
        <div class="aff-balance-amount">$${fmtAmt(available)}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">${available >= 20 ? '✅ Ready to withdraw' : `Need $${(20 - available).toFixed(2)} more`}</div>
      </div>
      <div class="aff-balance-card paid">
        <div class="aff-balance-label">Lifetime Paid</div>
        <div class="aff-balance-amount">$${fmtAmt(s.commission_paid)}</div>
        <div class="text-xs text-muted" style="margin-top:4px;">All-time payouts sent</div>
      </div>
    </div>

    <!-- Payment Method Info -->
    <div class="aff-panel">
      <div class="aff-panel-header"><h3 class="aff-panel-title">Payment Method</h3></div>
      <div class="aff-panel-body">
        <div style="display:flex;align-items:center;gap:var(--space-lg);flex-wrap:wrap;">
          <div style="flex:1;">
            <div class="text-sm text-muted" style="margin-bottom:4px;">Method</div>
            <div style="font-weight:600;color:var(--neon-green);">${sanitizeHTML(affiliate.payment_method || 'Not set')}</div>
          </div>
          <div style="flex:2;">
            <div class="text-sm text-muted" style="margin-bottom:4px;">Wallet Address</div>
            <div class="mono text-sm">${sanitizeHTML(affiliate.payment_address || 'Not configured')}</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="edit-payment-btn">Edit</button>
        </div>
      </div>
    </div>

    <!-- Payout History -->
    <div class="aff-panel">
      <div class="aff-panel-header">
        <h3 class="aff-panel-title">Payout History</h3>
      </div>
      <div class="aff-table-wrap">
        <table class="aff-table">
          <thead>
            <tr><th>Date</th><th>Amount</th><th>Currency</th><th>Tx Hash</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${payouts.length ? payouts.map(p => `
              <tr>
                <td class="mono">${new Date(p.created_at).toLocaleDateString()}</td>
                <td style="color:var(--neon-green);font-weight:600;">$${fmtAmt(p.amount)}</td>
                <td>${p.currency}</td>
                <td class="mono text-sm">${p.tx_hash ? p.tx_hash.substring(0, 12) + '…' : '—'}</td>
                <td><span class="badge badge-${p.status === 'sent' ? 'paid' : p.status}" style="border-radius:var(--radius-full);padding:3px 10px;font-size:11px;">${p.status.toUpperCase()}</span></td>
              </tr>`).join('') 
            : `<tr><td colspan="5" style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);">No payouts yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

export function bindPayoutsTabEvents(switchTabCallback) {
  document.getElementById('edit-payment-btn')?.addEventListener('click', () => {
    // Navigate to profile tab to edit payment address
    switchTabCallback('profile');
  });
}
