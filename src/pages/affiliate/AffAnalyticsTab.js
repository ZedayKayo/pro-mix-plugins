// ═══════════════════════════════════════════════════════
// Affiliate Analytics Tab
// ═══════════════════════════════════════════════════════

import { fetchAffiliateClicks } from '../../services/affiliateService.js';
import { renderDailyClicksChart, renderDonut } from './AffCharts.js';

export async function renderAnalyticsTab(affiliate) {
  const clicks = await fetchAffiliateClicks(affiliate.id, 30);

  // Aggregate data
  const byDay = {};
  const byCountry = {};
  const byDevice  = {};
  const byBrowser = {};
  const bySource  = {};

  clicks.forEach(c => {
    const day = c.clicked_at?.substring(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
    if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    if (c.device)  byDevice[c.device]   = (byDevice[c.device]   || 0) + 1;
    if (c.browser) byBrowser[c.browser] = (byBrowser[c.browser] || 0) + 1;
    const src = c.utm_source || (c.referrer_url ? new URL(c.referrer_url).hostname : 'Direct');
    bySource[src] = (bySource[src] || 0) + 1;
  });

  const topCountries = Object.entries(byCountry).sort((a,b) => b[1]-a[1]).slice(0,6);
  const topSources   = Object.entries(bySource).sort((a,b) => b[1]-a[1]).slice(0,5);
  const totalClicks  = clicks.length;

  const deviceColors = { desktop: 'var(--neon-green)', mobile: 'var(--neon-blue)', tablet: 'var(--neon-orange)' };

  return `
    <div class="aff-content-header">
      <div>
        <h2 class="aff-content-title">Analytics</h2>
        <p class="aff-content-subtitle">Last 30 days · ${totalClicks} clicks recorded</p>
      </div>
    </div>

    <!-- Daily Clicks Chart -->
    <div class="aff-panel">
      <div class="aff-panel-header">
        <h3 class="aff-panel-title">Daily Clicks (30 days)</h3>
        <span class="text-xs text-muted">${totalClicks} total</span>
      </div>
      <div class="aff-panel-body">
        <div class="aff-chart-wrap">
          ${renderDailyClicksChart(byDay)}
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);">
      <!-- Traffic Sources -->
      <div class="aff-panel">
        <div class="aff-panel-header"><h3 class="aff-panel-title">Traffic Sources</h3></div>
        <div class="aff-panel-body">
          ${topSources.length ? topSources.map(([src, cnt]) => `
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);">
              <span class="text-sm" style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${src}</span>
              <div style="flex:2;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${Math.round(cnt/totalClicks*100)}%;background:var(--neon-blue);border-radius:3px;"></div>
              </div>
              <span class="text-sm text-muted" style="width:32px;text-align:right;">${cnt}</span>
            </div>`).join('') 
          : `<p class="text-sm text-muted text-center">No data yet.</p>`}
        </div>
      </div>

      <!-- Countries -->
      <div class="aff-panel">
        <div class="aff-panel-header"><h3 class="aff-panel-title">Top Countries</h3></div>
        <div class="aff-panel-body">
          ${topCountries.length ? topCountries.map(([country, cnt]) => `
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);">
              <span class="text-sm" style="flex:1;">${country}</span>
              <div style="flex:2;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${Math.round(cnt/totalClicks*100)}%;background:var(--neon-green);border-radius:3px;"></div>
              </div>
              <span class="text-sm text-muted" style="width:32px;text-align:right;">${cnt}</span>
            </div>`).join('') 
          : `<p class="text-sm text-muted text-center">No data yet.</p>`}
        </div>
      </div>

      <!-- Devices -->
      <div class="aff-panel">
        <div class="aff-panel-header"><h3 class="aff-panel-title">Devices</h3></div>
        <div class="aff-panel-body">
          <div class="aff-donut-wrap">
            ${renderDonut(byDevice, deviceColors, totalClicks)}
            <div class="aff-donut-legend">
              ${Object.entries(byDevice).map(([d, n]) => `
                <div class="aff-legend-item">
                  <div class="aff-legend-dot" style="background:${deviceColors[d] || 'var(--text-muted)'}"></div>
                  <span class="aff-legend-label">${d.charAt(0).toUpperCase()+d.slice(1)}</span>
                  <span class="aff-legend-pct">${totalClicks ? Math.round(n/totalClicks*100) : 0}%</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Browsers -->
      <div class="aff-panel">
        <div class="aff-panel-header"><h3 class="aff-panel-title">Browsers</h3></div>
        <div class="aff-panel-body">
          ${Object.entries(byBrowser).sort((a,b) => b[1]-a[1]).slice(0,5).map(([b, n]) => `
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);">
              <span class="text-sm" style="flex:1;">${b}</span>
              <div style="flex:2;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${totalClicks ? Math.round(n/totalClicks*100) : 0}%;background:var(--neon-purple);border-radius:3px;"></div>
              </div>
              <span class="text-sm text-muted" style="width:32px;text-align:right;">${n}</span>
            </div>`).join('') || `<p class="text-sm text-muted text-center">No data yet.</p>`}
        </div>
      </div>
    </div>`;
}
