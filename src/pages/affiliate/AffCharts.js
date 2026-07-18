// ═══════════════════════════════════════════════════════
// Affiliate Charts — SVG sparkline, click chart, donut
// ═══════════════════════════════════════════════════════

export function renderSparkline(data) {
  if (!data || data.length === 0) return '<div style="text-align:center;padding:40px;color:var(--text-muted);">No earnings data yet.</div>';
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 500, H = 160, pad = 16;
  const xStep = (W - pad * 2) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: pad + i * xStep,
    y: pad + (1 - d.v / max) * (H - pad * 2),
    v: d.v,
  }));
  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `M ${points[0].x},${H} ${points.map(p => `L ${p.x},${p.y}`).join(' ')} L ${points[points.length-1].x},${H} Z`;
  return `
    <svg viewBox="0 0 ${W} ${H}" class="aff-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="aff-chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--neon-green)" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="var(--neon-green)" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" class="aff-chart-area"/>
      <path d="${linePath}" class="aff-chart-line"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" class="aff-chart-dot"><title>$${p.v.toFixed(2)}</title></circle>`).join('')}
    </svg>`;
}

export function renderDailyClicksChart(byDay) {
  const now = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 29 + i);
    return d.toISOString().substring(0, 10);
  });
  const vals = days.map(d => byDay[d] || 0);
  const max  = Math.max(...vals, 1);
  const W = 600, H = 140, pad = 12;
  const xStep = (W - pad * 2) / (days.length - 1);
  const points = vals.map((v, i) => ({
    x: pad + i * xStep,
    y: pad + (1 - v / max) * (H - pad * 2),
    v,
  }));
  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `M ${points[0].x},${H} ${points.map(p => `L ${p.x},${p.y}`).join(' ')} L ${points[points.length-1].x},${H} Z`;
  return `
    <svg viewBox="0 0 ${W} ${H}" class="aff-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="clicks-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--neon-blue)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--neon-blue)" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#clicks-gradient)"/>
      <path d="${linePath}" fill="none" stroke="var(--neon-blue)" stroke-width="2" stroke-linecap="round"/>
      ${points.filter((_, i) => i % 7 === 0 || i === 29).map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--neon-blue)" stroke="var(--bg-card)" stroke-width="2"><title>${p.v} click${p.v !== 1 ? 's' : ''}</title></circle>`).join('')}
    </svg>
    <div class="aff-chart-labels" style="margin-top:4px;">
      ${[0, 6, 13, 20, 29].map(i => `<span class="aff-chart-label">${days[i]?.substring(5)}</span>`).join('')}
    </div>`;
}

export function renderDonut(data, colors, total) {
  if (!total || !Object.keys(data).length) {
    return `<svg viewBox="0 0 80 80" width="80" height="80"><circle cx="40" cy="40" r="30" fill="none" stroke="var(--border-primary)" stroke-width="12"/></svg>`;
  }
  const r = 30, circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = Object.entries(data).map(([key, val]) => {
    const pct = val / total;
    const seg = { key, pct, dashArray: `${pct * circ} ${circ}`, dashOffset: -offset * circ, color: colors[key] || 'var(--text-muted)' };
    offset += pct;
    return seg;
  });
  return `<svg viewBox="0 0 80 80" width="80" height="80" style="transform:rotate(-90deg)">
    ${segments.map(s => `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${s.color}" stroke-width="12"
      stroke-dasharray="${s.dashArray}" stroke-dashoffset="${s.dashOffset}" opacity="0.85"/>`).join('')}
  </svg>`;
}

export function kpiCard(icon, label, value, colorClass, sub = '') {
  return `
    <div class="aff-kpi-card ${colorClass}">
      <div class="aff-kpi-icon">${icon}</div>
      <div class="aff-kpi-value">${value}</div>
      <div class="aff-kpi-label">${label}</div>
      ${sub ? `<div class="aff-kpi-change">${sub}</div>` : ''}
    </div>`;
}

export function fmtAmt(n) {
  return (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function generateMockMonthlyData(total) {
  if (!total) return [0,0,0,0,0,0].map(() => ({ v: 0 }));
  return [0.05, 0.1, 0.15, 0.2, 0.25, 0.25].map(m => ({ v: total * m }));
}
