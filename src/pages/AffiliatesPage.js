// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Affiliates Page (Router Entrypoint)
// ═══════════════════════════════════════════════════════

import { getUser, isLoggedIn } from '../core/store.js';
import { fetchAffiliateByUserId } from '../services/affiliateService.js';
import { renderAffiliateLanding } from './affiliate/AffiliateLanding.js';
import { renderAffiliateDashboard } from './affiliate/AffiliateDashboard.js';

export async function renderAffiliatesPage() {
  const container = document.getElementById('page-content');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center;padding:var(--space-3xl);">⏳ Loading Affiliate Program...</div>`;

  const user = getUser();
  let affiliate = null;

  if (isLoggedIn() && user) {
    try {
      affiliate = await fetchAffiliateByUserId(user.id);
    } catch (err) {
      console.error('Failed to retrieve affiliate details:', err);
    }
  }

  // Route decision: approved affiliates go to dashboard, others to landing info
  if (affiliate && affiliate.status === 'approved') {
    await renderAffiliateDashboard(container, user, affiliate);
  } else {
    renderAffiliateLanding(container, user, affiliate);
  }
}
