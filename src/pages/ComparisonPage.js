// ═══════════════════════════════════════════
// PRO-MIX PLUGINS — Comparison Page
// ═══════════════════════════════════════════

import { comparisonsDB, getPluginById } from '../data/index.js';
import { navigate } from '../core/router.js';

export function renderComparisonsPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="section">
      <div class="container">
        <div style="text-align:center; margin-bottom: var(--space-3xl);">
          <h1 style="font-size: var(--text-4xl); margin-bottom: var(--space-md);">Plugin Comparisons</h1>
          <p class="text-secondary" style="max-width:560px; margin:0 auto;">
            In-depth side-by-side comparisons of the most popular audio plugins to help you make the right choice.
          </p>
        </div>

        <div class="products-grid" id="comparisons-grid">
          ${comparisonsDB.map(comp => {
            const pA = getPluginById(comp.plugin_a_id);
            const pB = getPluginById(comp.plugin_b_id);
            return `
              <div class="card comparison-card animate-fade-in-up" data-slug="${comp.slug}" style="cursor:pointer; padding: var(--space-lg);">
                <div class="flex items-center gap-md" style="margin-bottom: var(--space-md);">
                  <div class="comparison-plugin-chip">${pA ? pA.developer : ''}</div>
                  <span style="font-size: var(--text-lg); color: var(--text-muted);">vs</span>
                  <div class="comparison-plugin-chip">${pB ? pB.developer : ''}</div>
                </div>
                <h3 style="font-size: var(--text-md); margin-bottom: var(--space-sm);">${comp.title}</h3>
                <p class="text-sm text-secondary" style="margin-bottom: var(--space-md);">${comp.meta_description}</p>
                <div style="display:flex; flex-wrap:wrap; gap: var(--space-2xs);">
                  ${comp.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.comparison-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`/compare/${card.dataset.slug}`);
    });
  });
}

export function renderComparisonDetailPage(params) {
  const container = document.getElementById('page-content');
  const comp = comparisonsDB.find(c => c.slug === params.slug);
  if (!comp) { navigate('/compare'); return; }

  const pA = getPluginById(comp.plugin_a_id);
  const pB = getPluginById(comp.plugin_b_id);
  if (!pA || !pB) { navigate('/compare'); return; }

  const categories = Object.entries(comp.winner_category);

  container.innerHTML = `
    <div class="section">
      <div class="container">
        <!-- Breadcrumb -->
        <div class="product-breadcrumb animate-fade-in">
          <a href="/">Home</a><span>›</span>
          <a href="/compare">Comparisons</a><span>›</span>
          <span>${comp.title}</span>
        </div>

        <!-- Head -->
        <div style="text-align:center; margin-bottom: var(--space-3xl);">
          <h1 style="font-size: var(--text-3xl); margin-bottom: var(--space-md);">${comp.title}</h1>
          <p class="text-secondary" style="max-width:600px; margin:0 auto;">${comp.meta_description}</p>
        </div>

        <!-- Hero Versus -->
        <div class="comparison-hero animate-fade-in-up">
          <div class="comparison-hero-plugin">
            <div class="comparison-avatar" style="background: var(--neon-green-subtle); color: var(--neon-green);">${pA.developer.charAt(0)}</div>
            <h3>${pA.name}</h3>
            <div class="badge badge-green" style="margin-bottom: var(--space-xs);">${pA.category}</div>
            <p class="text-sm text-secondary">${pA.short_description}</p>
            <div class="comparison-price">
              <span class="text-xl font-bold" style="color: var(--neon-green);">$${pA.average_sale_price}</span>
              <span class="text-xs text-muted"> avg sale / $${pA.official_price_usd} MSRP</span>
            </div>
          </div>

          <div class="vs-badge">VS</div>

          <div class="comparison-hero-plugin">
            <div class="comparison-avatar" style="background: var(--neon-blue-subtle); color: var(--neon-blue);">${pB.developer.charAt(0)}</div>
            <h3>${pB.name}</h3>
            <div class="badge badge-blue" style="margin-bottom: var(--space-xs);">${pB.category}</div>
            <p class="text-sm text-secondary">${pB.short_description}</p>
            <div class="comparison-price">
              <span class="text-xl font-bold" style="color: var(--neon-blue);">$${pB.average_sale_price}</span>
              <span class="text-xs text-muted"> avg sale / $${pB.official_price_usd} MSRP</span>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="card" style="padding: var(--space-xl); margin-bottom: var(--space-xl); border-left: 3px solid var(--neon-green);">
          <h3 style="margin-bottom: var(--space-sm);">Our Verdict</h3>
          <p class="text-secondary" style="line-height: 1.8;">${comp.summary}</p>
        </div>

        <!-- Category Winners -->
        <div style="margin-bottom: var(--space-3xl);">
          <h3 style="margin-bottom: var(--space-lg);">Category Breakdown</h3>
          <div style="display:flex; flex-direction:column; gap: var(--space-sm);">
            ${categories.map(([cat, winner]) => {
              const isA = winner === pA.name || winner === pA.developer || winner.includes(pA.developer.split(' ')[0]);
              const isB = winner === pB.name || winner === pB.developer || winner.includes(pB.developer.split(' ')[0]);
              const isTie = winner === 'Both';
              return `
                <div class="flex items-center gap-md comparison-row">
                  <span class="text-sm" style="width:200px; flex-shrink:0; color: var(--text-secondary);">${cat}</span>
                  <div class="comparison-bar-wrap">
                    <div class="comparison-bar-a ${isA || isTie ? 'active' : ''}"></div>
                    <div class="comparison-bar-label">${winner}</div>
                    <div class="comparison-bar-b ${isB || isTie ? 'active' : ''}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Feature Tables -->
        <div class="comparison-table-grid">
          <div class="card" style="padding: var(--space-lg);">
            <h4 style="color: var(--neon-green); margin-bottom: var(--space-md);">${pA.name}</h4>
            <table class="specs-table">
              <tr><td>Developer</td><td>${pA.developer}</td></tr>
              <tr><td>Category</td><td>${pA.category}</td></tr>
              <tr><td>Subcategory</td><td>${pA.subcategory}</td></tr>
              <tr><td>Released</td><td>${pA.release_year}</td></tr>
              <tr><td>MSRP</td><td>$${pA.official_price_usd}</td></tr>
              <tr><td>Avg Sale</td><td>$${pA.average_sale_price}</td></tr>
              <tr><td>Formats</td><td>${pA.supported_formats.join(', ')}</td></tr>
              <tr><td>CPU</td><td>${pA.cpu_usage_level}</td></tr>
            </table>
            <button class="btn btn-primary" style="width:100%; margin-top: var(--space-md);" data-view="${pA.id}">View Plugin →</button>
          </div>

          <div class="card" style="padding: var(--space-lg);">
            <h4 style="color: var(--neon-blue); margin-bottom: var(--space-md);">${pB.name}</h4>
            <table class="specs-table">
              <tr><td>Developer</td><td>${pB.developer}</td></tr>
              <tr><td>Category</td><td>${pB.category}</td></tr>
              <tr><td>Subcategory</td><td>${pB.subcategory}</td></tr>
              <tr><td>Released</td><td>${pB.release_year}</td></tr>
              <tr><td>MSRP</td><td>$${pB.official_price_usd}</td></tr>
              <tr><td>Avg Sale</td><td>$${pB.average_sale_price}</td></tr>
              <tr><td>Formats</td><td>${pB.supported_formats.join(', ')}</td></tr>
              <tr><td>CPU</td><td>${pB.cpu_usage_level}</td></tr>
            </table>
            <button class="btn btn-secondary" style="width:100%; margin-top: var(--space-md);" data-view="${pB.id}">View Plugin →</button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Navigate to plugin store detail
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plugin = getPluginById(btn.dataset.view);
      if (plugin) navigate(`/product/${plugin.id}`);
    });
  });
}
