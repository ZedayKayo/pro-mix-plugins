// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Store Page
// ═══════════════════════════════════════════════════════

import { filterProducts, categories, pluginTypes, dawList, getBrandList, getProductBySlug } from '../data/products.js';
import { renderProductCard, initProductCardEvents } from '../components/ProductCard.js';
import { on } from '../core/store.js';

export function renderStorePage(params) {
  const container = document.getElementById('page-content');

  // Parse search params from URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') ? [searchParams.get('category')] : [];
  const initialSort = searchParams.get('sort') || 'newest';

  // Is desktop? sidebar open by default on desktop
  const isDesktop = () => window.innerWidth >= 1024;
  const isMobile = () => window.innerWidth < 768;
  const defaultOpen = isMobile() ? '' : 'open';
  const defaultCaret = isMobile() ? '▸' : '▾';

  const state = {
    category: initialCategory,
    brand: [],
    type: [],
    daw: [],
    priceRange: [0, 600],
    search: initialSearch,
    sort: initialSort,
    view: 'grid',
    sidebarOpen: isDesktop(),
  };

  container.innerHTML = `
    <div class="section">
      <div class="container">
        <!-- TOP BAR: title + search + view + sort -->
        <div class="store-top-bar">
          <h1>Plugin Store</h1>

          <div class="store-top-controls">
            <!-- Search (moved from sidebar) -->
            <div class="input-group store-search-wrap">
              <span class="search-input-icon">🔍</span>
              <input
                type="text"
                class="input search-input store-search-input"
                id="store-search"
                placeholder="Search plugins…"
                value="${initialSearch}"
              />
            </div>

            <!-- Filter toggle (mobile) -->
            <button class="btn btn-ghost btn-sm store-filter-toggle" id="store-filter-toggle" title="Toggle Filters">
              ☰ Filters
            </button>

            <!-- View toggle -->
            <div class="view-toggle" id="view-toggle">
              <button class="active" data-view="grid" title="Grid view">▦</button>
              <button data-view="list" title="List view">☰</button>
            </div>

            <!-- Sort -->
            <select class="sort-select" id="sort-select">
              <option value="newest" ${initialSort === 'newest' ? 'selected' : ''}>Newest</option>
              <option value="price-asc" ${initialSort === 'price-asc' ? 'selected' : ''}>Price ↑</option>
              <option value="price-desc" ${initialSort === 'price-desc' ? 'selected' : ''}>Price ↓</option>
              <option value="rating" ${initialSort === 'rating' ? 'selected' : ''}>Top Rated</option>
              <option value="name" ${initialSort === 'name' ? 'selected' : ''}>A → Z</option>
            </select>
          </div>
        </div>

        <div class="store-layout">
          <!-- SIDEBAR FILTERS -->
          <aside class="store-sidebar" id="store-sidebar">
            <div class="filter-panel">
            
              <!-- Filters Header with Toggle All -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                <h3 style="margin:0; font-size: var(--text-md);">Filters</h3>
                <button class="btn btn-ghost btn-xs" id="toggle-all-filters" data-state="${defaultOpen ? 'open' : 'closed'}" style="padding: 2px 8px; font-size: 12px;">
                  ${defaultOpen ? 'Minimize All' : 'Expand All'}
                </button>
              </div>

              <!-- Category -->
              <div class="filter-section" id="fs-category">
                <button class="filter-section-title filter-collapse-btn" data-section="category">
                  Category
                  <span class="filter-caret" id="caret-category">${defaultCaret}</span>
                </button>
                <div class="filter-options filter-collapse-body ${defaultOpen}" id="body-category">
                  ${categories.map(c => `
                    <label class="filter-option ${initialCategory.includes(c.id) ? 'active' : ''}" data-filter="category" data-value="${c.id}">
                      <span class="filter-checkbox"></span>
                      <span>${c.icon} ${c.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Brand -->
              <div class="filter-section" id="fs-brand">
                <button class="filter-section-title filter-collapse-btn" data-section="brand">
                  Brand
                  <span class="filter-caret" id="caret-brand">${defaultCaret}</span>
                </button>
                <div class="filter-options filter-collapse-body ${defaultOpen}" id="body-brand">
                  ${getBrandList().map(b => `
                    <label class="filter-option" data-filter="brand" data-value="${b}">
                      <span class="filter-checkbox"></span>
                      <span>${b}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Plugin Type / Format -->
              <div class="filter-section" id="fs-type">
                <button class="filter-section-title filter-collapse-btn" data-section="type">
                  Format
                  <span class="filter-caret" id="caret-type">${defaultCaret}</span>
                </button>
                <div class="filter-options filter-collapse-body ${defaultOpen}" id="body-type">
                  ${pluginTypes.map(t => `
                    <label class="filter-option" data-filter="type" data-value="${t.id}">
                      <span class="filter-checkbox"></span>
                      <span>${t.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- DAW Compatibility -->
              <div class="filter-section" id="fs-daw">
                <button class="filter-section-title filter-collapse-btn" data-section="daw">
                  DAW
                  <span class="filter-caret" id="caret-daw">${defaultCaret}</span>
                </button>
                <div class="filter-options filter-collapse-body ${defaultOpen}" id="body-daw">
                  ${dawList.map(d => `
                    <label class="filter-option" data-filter="daw" data-value="${d.id}">
                      <span class="filter-checkbox"></span>
                      <span>${d.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Price Range -->
              <div class="filter-section" id="fs-price">
                <button class="filter-section-title filter-collapse-btn" data-section="price">
                  Price Range
                  <span class="filter-caret" id="caret-price">${defaultCaret}</span>
                </button>
                <div class="filter-collapse-body ${defaultOpen}" id="body-price">
                  <div class="price-range" style="padding: var(--space-sm) 0;">
                    <input type="range" class="daw-slider" id="price-slider" min="0" max="600" value="600" step="10" />
                    <div class="price-range-labels">
                      <span>$0</span>
                      <span id="price-label">$600</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn btn-ghost" id="clear-filters" style="width:100%; margin-top: var(--space-md);">
                Clear All Filters
              </button>
            </div>
          </aside>

          <!-- PRODUCT GRID -->
          <main>
            <div class="products-grid" id="products-grid"></div>
            <div id="no-results" style="display:none; text-align:center; padding: var(--space-4xl);">
              <div style="font-size:48px; margin-bottom: var(--space-md); opacity:0.3;">🔍</div>
              <h3>No plugins found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  `;

  const grid = document.getElementById('products-grid');
  const noResults = document.getElementById('no-results');
  const sidebar = document.getElementById('store-sidebar');

  // ── Sidebar visibility ─────────────────────────────
  function syncSidebar() {
    sidebar.classList.toggle('sidebar-open', state.sidebarOpen);
    sidebar.classList.toggle('sidebar-closed', !state.sidebarOpen);
  }
  syncSidebar();

  // On resize: auto-open on desktop, keep user preference on mobile
  window.addEventListener('resize', () => {
    if (isDesktop()) {
      state.sidebarOpen = true;
      syncSidebar();
    }
  });

  // Filter toggle button (mobile)
  document.getElementById('store-filter-toggle')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    syncSidebar();
  });

  // ── Collapsible filter sections ─────────────────────
  document.querySelectorAll('.filter-collapse-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      const body = document.getElementById(`body-${section}`);
      const caret = document.getElementById(`caret-${section}`);
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      caret.textContent = isOpen ? '▸' : '▾';
    });
  });

  // Toggle All Filters button
  document.getElementById('toggle-all-filters')?.addEventListener('click', (e) => {
    const btn = e.target;
    const isCurrentlyOpen = btn.dataset.state === 'open';
    const newState = !isCurrentlyOpen;
    
    // Update button text and state
    btn.dataset.state = newState ? 'open' : 'closed';
    btn.textContent = newState ? 'Minimize All' : 'Expand All';
    
    // Update all sections
    ['category', 'brand', 'type', 'daw', 'price'].forEach(section => {
      const body = document.getElementById(`body-${section}`);
      const caret = document.getElementById(`caret-${section}`);
      if (body) body.classList.toggle('open', newState);
      if (caret) caret.textContent = newState ? '▾' : '▸';
    });
  });

  // ── Products rendering ─────────────────────────────
  function renderProducts() {
    const results = filterProducts(state);
    if (results.length === 0) {
      grid.style.display = 'none';
      noResults.style.display = 'block';
    } else {
      grid.style.display = '';
      noResults.style.display = 'none';
      grid.innerHTML = results.map((p, i) => renderProductCard(p, i)).join('');
      initProductCardEvents(grid);
    }
  }
  renderProducts();

  // ── View Toggle ────────────────────────────────────
  document.getElementById('view-toggle')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    state.view = btn.dataset.view;
    document.querySelectorAll('#view-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    grid.classList.toggle('list-view', state.view === 'list');
  });

  // ── Sort ───────────────────────────────────────────
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderProducts();
  });

  // ── Search ─────────────────────────────────────────
  document.getElementById('store-search')?.addEventListener('input', (e) => {
    state.search = e.target.value;
    renderProducts();
  });

  // ── Filter clicks ──────────────────────────────────
  document.querySelectorAll('.filter-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const filterType = opt.dataset.filter;
      const value = opt.dataset.value;
      opt.classList.toggle('active');
      if (opt.classList.contains('active')) {
        state[filterType].push(value);
      } else {
        state[filterType] = state[filterType].filter(v => v !== value);
      }
      renderProducts();
    });
  });

  // ── Price slider ───────────────────────────────────
  const priceSlider = document.getElementById('price-slider');
  const priceLabel = document.getElementById('price-label');
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      state.priceRange = [0, val];
      priceLabel.textContent = `$${val}`;
      renderProducts();
    });
  }

  // ── Clear filters ──────────────────────────────────
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    state.category = [];
    state.brand = [];
    state.type = [];
    state.daw = [];
    state.priceRange = [0, 600];
    state.search = '';
    document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
    const searchEl = document.getElementById('store-search');
    if (searchEl) searchEl.value = '';
    if (priceSlider) priceSlider.value = 600;
    if (priceLabel) priceLabel.textContent = '$600';
    renderProducts();
  });

  // ── Re-render when Supabase inventory loads ────────
  // StorePage renders before async DB fetch completes, so listen for the update
  const unsubscribe = on('inventory:updated', () => {
    if (document.getElementById('products-grid')) {
      renderProducts();
    } else {
      // Page was navigated away, clean up listener
      unsubscribe();
    }
  });
}
