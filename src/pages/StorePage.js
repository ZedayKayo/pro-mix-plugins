// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Store Page (Full-featured)
// ═══════════════════════════════════════════════════════

import { filterProducts, categories, pluginTypes, dawList, getBrandList, getFeaturedProducts } from '../data/products.js';
import { renderProductCard, initProductCardEvents } from '../components/ProductCard.js';
import { initQuickViewModal } from '../components/QuickViewModal.js';
import { on } from '../core/store.js';
import { getWishlist, getRecentlyViewed } from '../core/wishlist.js';
import { navigate } from '../core/router.js';
import { formatPrice, getPluginImage, sanitizeHTML } from '../core/utils.js';

const PAGE_SIZE = 20;

export function renderStorePage(params) {
  const container = document.getElementById('page-content');
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch   = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') ? [searchParams.get('category')] : [];
  const initialSort     = searchParams.get('sort') || 'newest';

  const state = {
    category:   initialCategory,
    brand:      [],
    type:       [],
    daw:        [],
    priceRange: [0, 600],
    freeOnly:   false,
    search:     initialSearch,
    sort:       initialSort,
    view:       'grid',
    page:       1,
  };

  // ── Skeleton cards ──────────────────────────────
  const skeletonCards = Array.from({ length: 8 }).map(() => `
    <div class="product-card skeleton-card">
      <div class="skeleton-img"></div>
      <div class="pc-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
        <div class="pc-footer" style="margin-top:auto; padding-top:var(--space-sm); border-top:1px solid var(--border-primary);">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="store-page-wrap">

      <!-- ── Slim store header ── -->
      <div class="store-slim-header">
        <div class="container container-wide store-slim-inner">
          <div class="store-slim-left">
            <h1 class="store-slim-title">Plugin Store</h1>
            <span class="store-count-badge" id="store-count">Loading…</span>
          </div>
          <div class="store-slim-right">
            <div class="store-search-wrap">
              <svg class="store-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="store-search-input" id="store-search" placeholder="Search plugins…" value="${initialSearch}" autocomplete="off" />
            </div>
            <div class="view-toggle" id="view-toggle">
              <button class="active" data-view="grid" title="Grid view">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="9" y="1" width="5" height="5" rx="1"/><rect x="1" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
              </button>
              <button data-view="list" title="List view">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
            <select class="sort-select" id="sort-select">
              <option value="newest"     ${initialSort==='newest'     ?'selected':''}>Newest</option>
              <option value="price-asc"  ${initialSort==='price-asc'  ?'selected':''}>Price ↑</option>
              <option value="price-desc" ${initialSort==='price-desc' ?'selected':''}>Price ↓</option>
              <option value="rating"     ${initialSort==='rating'     ?'selected':''}>Top Rated</option>
              <option value="name"       ${initialSort==='name'       ?'selected':''}>A → Z</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ── Filter bar ── -->
      <div class="store-filter-bar-wrap">
        <div class="container container-wide">
          <div class="store-filter-bar" id="store-filter-bar">
            <div class="category-pills" id="category-pills">
              <button class="filter-pill" data-free-filter id="free-pill">🆓 FREE</button>
              ${categories.map(c => {
                const active = initialCategory.includes(c.id);
                return `<button class="filter-pill ${active?'active':''}" data-category="${c.id}">${c.icon} ${c.name}</button>`;
              }).join('')}
            </div>
            <div class="filter-bar-sep"></div>
            <div class="filter-dropdowns">

              <details class="filter-dropdown" id="fs-brand">
                <summary class="filter-dropdown-btn">Brand <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></summary>
                <div class="dropdown-content">
                  ${getBrandList().map(b=>`
                    <label class="filter-option" data-filter="brand" data-value="${b}">
                      <span class="filter-checkbox"></span><span>${b}</span>
                    </label>`).join('')}
                </div>
              </details>

              <details class="filter-dropdown" id="fs-type">
                <summary class="filter-dropdown-btn">Format <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></summary>
                <div class="dropdown-content">
                  ${pluginTypes.map(t=>`
                    <label class="filter-option" data-filter="type" data-value="${t.id}">
                      <span class="filter-checkbox"></span><span>${t.name}</span>
                    </label>`).join('')}
                </div>
              </details>

              <details class="filter-dropdown" id="fs-daw">
                <summary class="filter-dropdown-btn">DAW <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></summary>
                <div class="dropdown-content">
                  ${dawList.map(d=>`
                    <label class="filter-option" data-filter="daw" data-value="${d.id}">
                      <span class="filter-checkbox"></span><span>${d.name}</span>
                    </label>`).join('')}
                </div>
              </details>

              <details class="filter-dropdown" id="fs-price">
                <summary class="filter-dropdown-btn">Price <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></summary>
                <div class="dropdown-content" style="min-width:220px;padding:var(--space-md) var(--space-lg)">
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-sm)">Max price</div>
                  <input type="range" class="daw-slider" id="price-slider" min="0" max="600" value="600" step="10"/>
                  <div class="price-range-labels">
                    <span>Free</span>
                    <span id="price-label" style="color:var(--neon-green);font-weight:700">$600+</span>
                  </div>
                </div>
              </details>

              <button class="filter-clear-btn" id="clear-filters">↺ Clear</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Active filter chips ── -->
      <div class="store-active-filters" id="active-filters" style="display:none">
        <div class="container container-wide">
          <div class="active-chips" id="active-chips"></div>
        </div>
      </div>

      <!-- ── Trust badges ── -->
      <div class="store-trust-bar">
        <div class="container container-wide">
          <div class="trust-badges">
            <span class="trust-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Secure Crypto Payment</span>
            <span class="trust-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Instant Digital Delivery</span>
            <span class="trust-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Lifetime License</span>
            <span class="trust-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 24/7 Support</span>
            <span class="trust-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> −70% vs Retail</span>
          </div>
        </div>
      </div>

      <!-- ── Featured strip ── -->
      <div class="store-featured-strip" id="featured-strip" style="display:none">
        <div class="container container-wide">
          <div class="featured-strip-header">
            <span class="featured-strip-label">⭐ Featured Picks</span>
          </div>
          <div class="featured-strip-scroll" id="featured-scroll"></div>
        </div>
      </div>

      <!-- ── Compare bar (floating) ── -->
      <div class="compare-bar" id="compare-bar" style="display:none">
        <div class="compare-bar-inner">
          <span class="compare-bar-label">Comparing: <strong id="compare-count">0</strong>/3 plugins</span>
          <button class="btn btn-primary btn-sm" id="compare-go">Compare Now →</button>
          <button class="btn btn-ghost btn-sm" id="compare-clear">Clear</button>
        </div>
      </div>

      <!-- ── Main content ── -->
      <div class="section" style="padding-top:var(--space-xl)">
        <div class="container container-wide">

          <!-- Skeleton (visible while loading) -->
          <div class="products-grid skeleton-visible" id="skeleton-grid">
            ${skeletonCards}
          </div>

          <!-- Real grid (hidden until data arrives) -->
          <div class="products-grid" id="products-grid" style="display:none"></div>

          <!-- Load More -->
          <div class="load-more-wrap" id="load-more-wrap" style="display:none">
            <button class="btn btn-ghost load-more-btn" id="load-more-btn">
              Load More Plugins
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <!-- Empty state -->
          <div id="no-results" class="store-empty-state" style="display:none">
            <div class="store-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </div>
            <h3 class="store-empty-title">No plugins found</h3>
            <p class="store-empty-sub">Try adjusting your filters or clearing your search query.</p>
            <button class="btn btn-primary" id="no-results-clear">Clear All Filters</button>
          </div>

          <!-- Recently Viewed -->
          <div id="recently-viewed-wrap" style="display:none; margin-top: var(--space-3xl)">
            <div class="section-title">
              <h2>Recently Viewed</h2>
            </div>
            <div class="products-grid" id="recently-viewed-grid" style="grid-template-columns:repeat(4,1fr)"></div>
          </div>
        </div>
      </div>

    </div>
  `;

  // ── Init quick view modal ──────────────────────
  initQuickViewModal();

  const grid       = document.getElementById('products-grid');
  const skeleton   = document.getElementById('skeleton-grid');
  const noResults  = document.getElementById('no-results');
  const loadMoreW  = document.getElementById('load-more-wrap');

  // ── Featured strip ─────────────────────────────
  function renderFeaturedStrip() {
    const featured = getFeaturedProducts().slice(0, 6);
    if (featured.length === 0) return;
    const strip = document.getElementById('featured-strip');
    const scroll = document.getElementById('featured-scroll');
    if (!strip || !scroll) return;
    strip.style.display = 'block';

    const CAT_GRADS = {
      eq:'linear-gradient(135deg,#00ff88,#0090cc)',compressor:'linear-gradient(135deg,#ff6b2b,#ff3b5c)',
      reverb:'linear-gradient(135deg,#00d4ff,#a855f7)',delay:'linear-gradient(135deg,#a855f7,#ff3b5c)',
      synth:'linear-gradient(135deg,#e040fb,#00e5ff)',distortion:'linear-gradient(135deg,#ff8f5e,#facc15)',
      mastering:'linear-gradient(135deg,#00b4d8,#0077b6)',bundle:'linear-gradient(135deg,#f9c74f,#f3722c)',
      utility:'linear-gradient(135deg,#4cc9f0,#4361ee)',
    };

    scroll.innerHTML = featured.map(p => {
      const grad = CAT_GRADS[p.category] || 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.5))';
      const price = p.salePrice || p.price;
      return `
        <div class="feat-card" data-slug="${p.slug}" style="--feat-grad:${grad}">
          <div class="feat-card-img">
            <img src="${getPluginImage(p)}" alt="${sanitizeHTML(p.name)}" loading="lazy"/>
          </div>
          <div class="feat-card-body">
            <div class="feat-card-name">${sanitizeHTML(p.name)}</div>
            <div class="feat-card-price">${formatPrice(price)}</div>
          </div>
        </div>
      `;
    }).join('');

    scroll.addEventListener('click', e => {
      const card = e.target.closest('.feat-card');
      if (card?.dataset.slug) navigate(`/product/${card.dataset.slug}`);
    });
  }
  renderFeaturedStrip();

  // ── Update count badge ─────────────────────────
  function updateCount(total, shown) {
    const el = document.getElementById('store-count');
    if (el) el.textContent = total === shown
      ? `${total} plugin${total !== 1 ? 's' : ''}`
      : `Showing ${shown} of ${total}`;
  }

  // ── Active filter chips ────────────────────────
  function renderActiveChips() {
    const wrap  = document.getElementById('active-filters');
    const chips = document.getElementById('active-chips');
    if (!wrap || !chips) return;

    const items = [];
    state.category.forEach(v => { const c = categories.find(x=>x.id===v); if(c) items.push({type:'category',value:v,label:`${c.icon} ${c.name}`}); });
    state.brand.forEach(v   => items.push({type:'brand',   value:v, label:`Brand: ${v}`}));
    state.type.forEach(v    => items.push({type:'type',    value:v, label:`Format: ${v.toUpperCase()}`}));
    state.daw.forEach(v     => { const d=dawList.find(x=>x.id===v); if(d) items.push({type:'daw',value:v,label:`DAW: ${d.name}`}); });
    if (state.freeOnly)       items.push({type:'free',     value:'free',label:'🆓 FREE only'});
    if (state.priceRange[1] < 600) items.push({type:'price',value:'price',label:`Max: $${state.priceRange[1]}`});

    if (items.length === 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    chips.innerHTML = items.map(item => `
      <span class="active-chip" data-chip-type="${item.type}" data-chip-value="${item.value}">
        ${item.label}
        <button class="chip-remove" aria-label="Remove filter">×</button>
      </span>
    `).join('') + `<button class="chip-clear-all" id="chip-clear-all">Clear all</button>`;

    chips.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const chip = btn.closest('.active-chip');
        const { chipType, chipValue } = chip.dataset;
        removeFilter(chipType, chipValue);
      });
    });
    document.getElementById('chip-clear-all')?.addEventListener('click', clearAllFilters);
  }

  function removeFilter(type, value) {
    if (type === 'category') {
      state.category = state.category.filter(v => v !== value);
      document.querySelectorAll(`[data-category="${value}"]`).forEach(el => el.classList.remove('active'));
    } else if (type === 'brand' || type === 'type' || type === 'daw') {
      state[type] = state[type].filter(v => v !== value);
      document.querySelectorAll(`[data-filter="${type}"][data-value="${value}"]`).forEach(el => el.classList.remove('active'));
    } else if (type === 'free') {
      state.freeOnly = false;
      document.getElementById('free-pill')?.classList.remove('active');
    } else if (type === 'price') {
      state.priceRange = [0, 600];
      const s = document.getElementById('price-slider'); if (s) s.value = 600;
      const l = document.getElementById('price-label');  if (l) l.textContent = '$600+';
    }
    state.page = 1;
    renderProducts();
  }

  // ── Render products ────────────────────────────
  let allResults = [];
  function renderProducts() {
    allResults = filterProducts(state);
    if (state.freeOnly) allResults = allResults.filter(p => !p.price || p.price === 0);

    skeleton.style.display = 'none';
    renderActiveChips();
    updateCount(allResults.length, Math.min(state.page * PAGE_SIZE, allResults.length));

    if (allResults.length === 0) {
      grid.style.display = 'none';
      noResults.style.display = 'flex';
      loadMoreW.style.display = 'none';
    } else {
      noResults.style.display = 'none';
      grid.style.display = '';
      renderPage();
    }

    renderRecentlyViewed();
  }

  function renderPage() {
    const pageItems = allResults.slice(0, state.page * PAGE_SIZE);
    grid.innerHTML = pageItems.map((p, i) => renderProductCard(p, i)).join('');
    initProductCardEvents(grid);
    loadMoreW.style.display = allResults.length > pageItems.length ? 'flex' : 'none';
    updateCount(allResults.length, pageItems.length);
  }

  // ── Recently Viewed ────────────────────────────
  function renderRecentlyViewed() {
    const rvIds = getRecentlyViewed();
    const rvWrap = document.getElementById('recently-viewed-wrap');
    const rvGrid = document.getElementById('recently-viewed-grid');
    if (!rvWrap || !rvGrid || rvIds.length === 0) return;

    import('../data/products.js').then(({ getProducts }) => {
      const all = getProducts();
      const products = rvIds.map(id => all.find(p => p.id === id)).filter(Boolean).slice(0, 4);
      if (products.length === 0) return;
      rvWrap.style.display = 'block';
      rvGrid.innerHTML = products.map((p, i) => renderProductCard(p, i)).join('');
      initProductCardEvents(rvGrid);
    });
  }

  // Initial render
  renderProducts();

  // ── Close dropdowns on outside click ──────────
  document.addEventListener('click', (e) => {
    if (!e.target.closest('details.filter-dropdown')) {
      document.querySelectorAll('details.filter-dropdown').forEach(d => d.removeAttribute('open'));
    }
  });
  document.querySelectorAll('details.filter-dropdown').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        document.querySelectorAll('details.filter-dropdown').forEach(d => {
          if (d !== details) d.removeAttribute('open');
        });
      }
    });
  });

  // ── Category pills ─────────────────────────────
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category;
      const idx = state.category.indexOf(cat);
      if (idx === -1) { state.category.push(cat); btn.classList.add('active'); }
      else { state.category.splice(idx, 1); btn.classList.remove('active'); }
      state.page = 1;
      renderProducts();
    });
  });

  // ── FREE pill ──────────────────────────────────
  document.getElementById('free-pill')?.addEventListener('click', function() {
    state.freeOnly = !state.freeOnly;
    this.classList.toggle('active', state.freeOnly);
    state.page = 1;
    renderProducts();
  });

  // ── Dropdown filter options ────────────────────
  document.querySelectorAll('.filter-option').forEach(label => {
    label.addEventListener('click', e => {
      e.preventDefault();
      const { filter: filterType, value } = label.dataset;
      const isActive = label.classList.toggle('active');
      if (isActive) { if (!state[filterType].includes(value)) state[filterType].push(value); }
      else           { state[filterType] = state[filterType].filter(v => v !== value); }
      state.page = 1;
      renderProducts();
    });
  });

  // ── Price slider ───────────────────────────────
  const priceSlider = document.getElementById('price-slider');
  const priceLabel  = document.getElementById('price-label');
  priceSlider?.addEventListener('input', e => {
    const val = parseInt(e.target.value);
    state.priceRange = [0, val];
    if (priceLabel) priceLabel.textContent = val >= 600 ? '$600+' : `$${val}`;
    state.page = 1;
    renderProducts();
  });

  // ── View toggle ────────────────────────────────
  document.getElementById('view-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    state.view = btn.dataset.view;
    document.querySelectorAll('#view-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    grid.classList.toggle('list-view', state.view === 'list');
  });

  // ── Sort ───────────────────────────────────────
  document.getElementById('sort-select')?.addEventListener('change', e => {
    state.sort = e.target.value;
    state.page = 1;
    renderProducts();
  });

  // ── Search ─────────────────────────────────────
  document.getElementById('store-search')?.addEventListener('input', e => {
    state.search = e.target.value;
    state.page = 1;
    renderProducts();
  });

  // ── Load More ──────────────────────────────────
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    state.page++;
    renderPage();
    updateCount(allResults.length, Math.min(state.page * PAGE_SIZE, allResults.length));
  });

  // ── Clear filters ──────────────────────────────
  function clearAllFilters() {
    state.category = []; state.brand = []; state.type = [];
    state.daw = []; state.priceRange = [0, 600];
    state.search = ''; state.freeOnly = false; state.page = 1;
    document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
    document.querySelectorAll('[data-category],[data-free-filter]').forEach(b => b.classList.remove('active'));
    const s = document.getElementById('store-search'); if (s) s.value = '';
    if (priceSlider) priceSlider.value = 600;
    if (priceLabel) priceLabel.textContent = '$600+';
    renderProducts();
  }
  document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
  document.getElementById('no-results-clear')?.addEventListener('click', clearAllFilters);

  // ── Compare bar ────────────────────────────────
  function updateCompareBar(list) {
    const bar = document.getElementById('compare-bar');
    const cnt = document.getElementById('compare-count');
    if (!bar) return;
    bar.style.display = list.length > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = list.length;
  }
  // Show on init if session has data
  const initCompare = JSON.parse(sessionStorage.getItem('pmx_compare') || '[]');
  updateCompareBar(initCompare);

  document.addEventListener('compare:updated', e => updateCompareBar(e.detail));

  document.getElementById('compare-go')?.addEventListener('click', () => {
    const ids = sessionStorage.getItem('pmx_compare') || '[]';
    navigate(`/compare?ids=${encodeURIComponent(ids)}`);
  });
  document.getElementById('compare-clear')?.addEventListener('click', () => {
    sessionStorage.removeItem('pmx_compare');
    updateCompareBar([]);
    document.querySelectorAll('.pc-compare-btn').forEach(b => b.classList.remove('active'));
  });

  // ── Inventory update (Supabase async load) ─────
  const unsubscribe = on('inventory:updated', () => {
    if (document.getElementById('products-grid')) {
      renderProducts();
      renderFeaturedStrip();
    } else {
      unsubscribe();
    }
  });
}
