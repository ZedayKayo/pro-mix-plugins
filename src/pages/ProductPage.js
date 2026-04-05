// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Detail Page
// ═══════════════════════════════════════════════════════

import { getProductBySlug, getProducts } from '../data/products.js';
import { formatPrice, formatCrypto, renderStars, getPluginImage, getCategoryName, calculateDiscount } from '../core/utils.js';
import { addToCart, isInCart } from '../core/store.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';
import { renderProductCard, initProductCardEvents } from '../components/ProductCard.js';

export function renderProductPage(params) {
  const container = document.getElementById('page-content');
  const product = getProductBySlug(params.slug);

  if (!product) {
    container.innerHTML = `
      <div class="section" style="text-align:center; padding: var(--space-4xl);">
        <h2>Plugin not found</h2>
        <p style="margin: var(--space-md) 0;">The plugin you're looking for doesn't exist.</p>
        <a href="/store" class="btn btn-primary">Browse Store</a>
      </div>
    `;
    return;
  }

  const price = product.salePrice || product.price;
  const inCart = isInCart(product.id);
  const related = getProducts().filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const totalImages = product.images.length;

  // Generate waveform bars
  const bars = Array.from({ length: 60 }, () => Math.random() * 80 + 10);

  const CAT_GRADIENTS = {
    eq:         'linear-gradient(135deg,#00ff88 0%,#0090cc 100%)',
    compressor: 'linear-gradient(135deg,#ff6b2b 0%,#ff3b5c 100%)',
    reverb:     'linear-gradient(135deg,#00d4ff 0%,#a855f7 100%)',
    delay:      'linear-gradient(135deg,#a855f7 0%,#ff3b5c 100%)',
    synth:      'linear-gradient(135deg,#e040fb 0%,#00e5ff 100%)',
    distortion: 'linear-gradient(135deg,#ff8f5e 0%,#facc15 100%)',
    mastering:  'linear-gradient(135deg,#00b4d8 0%,#0077b6 100%)',
    bundle:     'linear-gradient(135deg,#f9c74f 0%,#f3722c 100%)',
    utility:    'linear-gradient(135deg,#4cc9f0 0%,#4361ee 100%)',
  };
  const grad = CAT_GRADIENTS[product.category] || 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.5))';

  container.innerHTML = `
    <div class="section">
      <div class="container container-narrow">
        <!-- Breadcrumb -->
        <div class="product-breadcrumb animate-fade-in">
          <a href="/">Home</a>
          <span>›</span>
          <a href="/store">Store</a>
          <span>›</span>
          <a href="/store?category=${product.category}">${getCategoryName(product.category)}</a>
          <span>›</span>
          <span style="color: var(--text-primary)">${product.name}</span>
        </div>

        <div class="product-detail">
          <!-- LEFT: Gallery -->
          <div class="product-gallery animate-fade-in-up">

            <!-- Main image area with nav arrows -->
            <div class="product-gallery-main" style="background: ${grad};" id="gallery-main-wrap">
              <img src="${getPluginImage(product, 0)}" alt="${product.name}" id="gallery-main-img" />

              ${totalImages > 1 ? `
              <!-- Prev / Next arrows -->
              <button class="gallery-arrow gallery-arrow-prev" id="gallery-prev" aria-label="Previous image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button class="gallery-arrow gallery-arrow-next" id="gallery-next" aria-label="Next image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <!-- Image counter -->
              <div class="gallery-counter" id="gallery-counter">
                <span id="gallery-current-num">1</span> / <span>${totalImages}</span>
              </div>
              ` : ''}

              <!-- Zoom icon hint -->
              <div class="gallery-zoom-hint" id="gallery-zoom-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                Click to zoom
              </div>
            </div>

            <!-- Thumbnail strip -->
            <div class="product-gallery-thumbs" id="gallery-thumbs">
              ${product.images.map((_, i) => `
                <div class="product-thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}">
                  <img src="${getPluginImage(product, i)}" alt="Screenshot ${i + 1}" loading="lazy" />
                </div>
              `).join('')}
            </div>

          </div>

          <!-- RIGHT: Info -->
          <div class="product-info animate-fade-in-up delay-2">
            <div class="flex items-center gap-sm" style="margin-bottom: var(--space-sm);">
              <span class="badge badge-${product.isNew ? 'green' : product.isTrending ? 'blue' : 'purple'}">${product.isNew ? 'New Release' : product.isTrending ? 'Trending' : getCategoryName(product.category)}</span>
              <span class="text-xs text-muted">v${product.version}</span>
            </div>

            <h1 class="product-title">${product.name}</h1>
            <p class="product-subtitle">${product.shortDesc}</p>

            <div class="product-rating-row">
              <span class="stars">${renderStars(product.rating)}</span>
              <span class="text-sm text-secondary">${product.rating} (${product.reviews} reviews)</span>
            </div>

            <!-- Price Block -->
            <div class="product-price-block">
              <div>
                <div class="product-price-main">${formatPrice(price)}</div>
                ${product.salePrice ? `<span class="original-price" style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8em; margin-left: 8px;">${formatPrice(product.price)}</span>
                <span class="sale-badge" style="background: rgba(255, 107, 43, 0.1); color: var(--neon-orange); padding: 4px 8px; border-radius: 4px; font-size: 0.6em; vertical-align: middle; margin-left: 8px; border: 1px solid rgba(255,107,43,0.3);">-${calculateDiscount(product.price, product.salePrice)}% OFF</span>` : ''}
              </div>
              <div class="product-crypto-prices">
                <span class="crypto-price-tag" title="Bitcoin">₿ ${formatCrypto(product.cryptoPrices.BTC, 'BTC')}</span>
                <span class="crypto-price-tag" title="Ethereum">Ξ ${formatCrypto(product.cryptoPrices.ETH, 'ETH')}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="product-actions">
              <button class="btn btn-primary btn-lg" id="product-add-cart" ${inCart ? 'disabled style="opacity:0.5"' : ''}>
                ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
              </button>
              <button class="btn" style="background: rgba(247, 147, 26, 0.1); border: 1px solid rgba(247, 147, 26, 0.3); color: #f7931a;" id="product-buy-crypto">
                ⚡ Instant Access — Pay with Crypto
              </button>
            </div>

            <div class="product-trust-badges" style="display:flex; justify-content:space-between; margin-bottom:var(--space-xl); font-size:12px; color:var(--text-muted); border-top:1px solid var(--border-primary); padding-top:var(--space-md);">
              <span>🔒 Secure Payment</span>
              <span>⚡ Instant Delivery</span>
              <span>🔄 Lifetime Updates</span>
            </div>

            <!-- Audio Demo -->
            ${product.audioDemo ? `
              <div class="audio-player">
                <div class="audio-player-header">
                  <span>🎵</span>
                  <span>Audio Demo</span>
                </div>
                <div class="audio-player-controls">
                  <div class="audio-progress-wrapper">
                    <div class="audio-waveform" id="audio-waveform" style="opacity: 0.5;">
                      ${bars.map((h, i) => `<div class="waveform-bar" style="height:${h}%" data-bar="${i}"></div>`).join('')}
                    </div>
                    <div class="audio-time" style="justify-content: center;">
                      <span style="color: var(--text-tertiary); font-family: var(--font-display); letter-spacing: 1px; font-size: 11px; text-transform: uppercase;">Audio Preview Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

          </div> <!-- /product-info -->
        </div> <!-- /product-detail -->

        <!-- FULL WIDTH BOTTOM SECTION (Tabs) -->
        <div class="product-bottom-section animate-fade-in-up delay-3" style="margin-top: var(--space-3xl);">
          <div class="product-tabs-container" style="margin-top: 0; border-top: none; padding-top: 0;">
            <div class="product-tabs-nav">
              <button class="product-tab active" data-tab="desc">Description</button>
              <button class="product-tab" data-tab="features">Key Features</button>
              <button class="product-tab" data-tab="specs">Specs & Reqs</button>
            </div>

            <!-- Tab: Description -->
            <div class="product-tab-content active" id="tab-desc">
              <p style="line-height: 1.7; color: var(--text-secondary);">${product.description}</p>
            </div>

            <!-- Tab: Features -->
            <div class="product-tab-content" id="tab-features">
              <div class="feature-list" style="margin-top: 0;">
                ${product.features.map(f => `<div class="feature-item">${f}</div>`).join('')}
              </div>
            </div>

            <!-- Tab: Specs & Reqs -->
            <div class="product-tab-content" id="tab-specs">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-xl);">
                <div>
                  <h4 style="margin-bottom: var(--space-sm); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">Specifications</h4>
                  <table class="specs-table" style="margin-bottom: var(--space-lg);">
                    ${Object.entries(product.specs)
                      .filter(([k]) => !['source_url', 'download_mac', 'download_win', 'magnet'].includes(k.toLowerCase()))
                      .map(([k, v]) => `<tr><td>${k}</td><td style="word-break: break-word;">${v}</td></tr>`)
                      .join('')}
                  </table>
                  <h4 style="margin-bottom: var(--space-sm); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">DAW Compatibility</h4>
                  <div class="product-daw-compat">
                    ${product.dawCompat.map(d => {
                      const dawNames = { 'fl-studio': 'FL Studio', ableton: 'Ableton', 'pro-tools': 'Pro Tools', logic: 'Logic Pro', cubase: 'Cubase', reaper: 'Reaper', 'studio-one': 'Studio One' };
                      return `<span class="tag">${dawNames[d] || d}</span>`;
                    }).join('')}
                  </div>
                </div>
                <div>
                  <h4 style="margin-bottom: var(--space-sm); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">System Requirements</h4>
                  <table class="specs-table">
                    <tr><td>OS</td><td>${product.systemReqs.os}</td></tr>
                    <tr><td>RAM</td><td>${product.systemReqs.ram}</td></tr>
                    <tr><td>Disk</td><td>${product.systemReqs.disk}</td></tr>
                    <tr><td>CPU</td><td>${product.systemReqs.cpu}</td></tr>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RELATED PLUGINS -->
        ${related.length > 0 ? `
          <div style="margin-top: var(--space-3xl);">
            <div class="section-title">
              <h2>Related Plugins</h2>
            </div>
            <div class="products-grid" id="related-grid">
              ${related.map((p, i) => renderProductCard(p, i)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // ── Gallery State ─────────────────────────────────────
  let currentIndex = 0;
  const images = product.images.map((_, i) => getPluginImage(product, i));
  const mainImg   = document.getElementById('gallery-main-img');
  const counterEl = document.getElementById('gallery-current-num');
  const thumbStrip = document.getElementById('gallery-thumbs');

  function goToImage(idx, animate = true) {
    if (images.length === 0) return;
    currentIndex = (idx + images.length) % images.length;

    // Fade transition on main image
    if (animate && mainImg) {
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = images[currentIndex];
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 160);
    } else if (mainImg) {
      mainImg.src = images[currentIndex];
    }

    // Update counter
    if (counterEl) counterEl.textContent = currentIndex + 1;

    // Update active thumb
    document.querySelectorAll('.product-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === currentIndex);
    });

    // Scroll active thumb into view
    const activeThumb = thumbStrip?.querySelector(`.product-thumb[data-thumb="${currentIndex}"]`);
    if (activeThumb && thumbStrip) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  // Thumbnail clicks
  document.querySelectorAll('.product-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => goToImage(parseInt(thumb.dataset.thumb)));
  });

  // Prev / Next arrows
  document.getElementById('gallery-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    goToImage(currentIndex - 1);
  });
  document.getElementById('gallery-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    goToImage(currentIndex + 1);
  });

  // Keyboard navigation
  function handleKeyNav(e) {
    if (e.key === 'ArrowLeft')  goToImage(currentIndex - 1);
    if (e.key === 'ArrowRight') goToImage(currentIndex + 1);
    if (e.key === 'Escape')     closeLightbox();
  }
  document.addEventListener('keydown', handleKeyNav);

  // Touch/swipe support on main image
  const galleryWrap = document.getElementById('gallery-main-wrap');
  let touchStartX = 0;
  galleryWrap?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  galleryWrap?.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goToImage(diff > 0 ? currentIndex + 1 : currentIndex - 1);
  });

  // Image transition style
  if (mainImg) {
    mainImg.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
  }

  // ── Lightbox ──────────────────────────────────────────
  let lightboxEl = null;

  function openLightbox(idx) {
    currentIndex = idx;
    if (lightboxEl) closeLightbox();

    lightboxEl = document.createElement('div');
    lightboxEl.className = 'gallery-lightbox';
    lightboxEl.innerHTML = `
      <div class="gallery-lb-backdrop"></div>
      <button class="gallery-lb-close" id="lb-close" aria-label="Close">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      ${images.length > 1 ? `
      <button class="gallery-lb-arrow gallery-lb-prev" id="lb-prev" aria-label="Previous">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="gallery-lb-arrow gallery-lb-next" id="lb-next" aria-label="Next">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      ` : ''}
      <div class="gallery-lb-img-wrap">
        <img src="${images[currentIndex]}" alt="${product.name}" class="gallery-lb-img" id="lb-img" />
      </div>
      <div class="gallery-lb-counter" id="lb-counter">${currentIndex + 1} / ${images.length}</div>
      ${images.length > 1 ? `
      <div class="gallery-lb-dots" id="lb-dots">
        ${images.map((_, i) => `<span class="gallery-lb-dot ${i === currentIndex ? 'active' : ''}" data-dot="${i}"></span>`).join('')}
      </div>
      ` : ''}
    `;
    document.body.appendChild(lightboxEl);
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => lightboxEl.classList.add('open'));

    // Events
    document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
    lightboxEl.querySelector('.gallery-lb-backdrop')?.addEventListener('click', closeLightbox);

    document.getElementById('lb-prev')?.addEventListener('click', (e) => { e.stopPropagation(); lbGoTo(currentIndex - 1); });
    document.getElementById('lb-next')?.addEventListener('click', (e) => { e.stopPropagation(); lbGoTo(currentIndex + 1); });

    // Dot navigation
    document.querySelectorAll('.gallery-lb-dot').forEach(dot => {
      dot.addEventListener('click', (e) => { e.stopPropagation(); lbGoTo(parseInt(dot.dataset.dot)); });
    });

    // Touch on lightbox
    let lbTouchX = 0;
    lightboxEl.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
    lightboxEl.addEventListener('touchend', (e) => {
      const diff = lbTouchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) lbGoTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
    });
  }

  function lbGoTo(idx) {
    if (images.length <= 1) return;
    currentIndex = (idx + images.length) % images.length;

    const lbImg = document.getElementById('lb-img');
    if (lbImg) {
      lbImg.style.opacity = '0';
      lbImg.style.transform = 'scale(0.96)';
      setTimeout(() => {
        lbImg.src = images[currentIndex];
        lbImg.style.opacity = '1';
        lbImg.style.transform = 'scale(1)';
      }, 150);
    }
    const lbCounter = document.getElementById('lb-counter');
    if (lbCounter) lbCounter.textContent = `${currentIndex + 1} / ${images.length}`;
    document.querySelectorAll('.gallery-lb-dot').forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));

    // Also sync main gallery
    goToImage(currentIndex, true);
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (lightboxEl && lightboxEl.parentNode) lightboxEl.parentNode.removeChild(lightboxEl);
      lightboxEl = null;
    }, 250);
  }

  // Click main image to open lightbox
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.addEventListener('click', () => openLightbox(currentIndex));
  }
  // Click zoom hint to open lightbox too
  document.getElementById('gallery-zoom-hint')?.addEventListener('click', () => openLightbox(currentIndex));

  // Override keyboard to also control lightbox
  document.removeEventListener('keydown', handleKeyNav);
  document.addEventListener('keydown', (e) => {
    if (lightboxEl) {
      if (e.key === 'ArrowLeft')  lbGoTo(currentIndex - 1);
      if (e.key === 'ArrowRight') lbGoTo(currentIndex + 1);
      if (e.key === 'Escape')     closeLightbox();
    } else {
      if (e.key === 'ArrowLeft')  goToImage(currentIndex - 1);
      if (e.key === 'ArrowRight') goToImage(currentIndex + 1);
    }
  });

  // ── Other Events ──────────────────────────────────────
  const addCartBtn = document.getElementById('product-add-cart');
  if (!inCart && addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const added = addToCart(product);
      if (added) {
        showToast(`${product.name} added to cart!`, 'success');
        addCartBtn.textContent = '✓ In Cart';
        addCartBtn.disabled = true;
        addCartBtn.style.opacity = '0.5';
      }
    });
  }

  document.getElementById('product-buy-crypto')?.addEventListener('click', () => {
    if (!isInCart(product.id)) addToCart(product);
    navigate('/checkout');
  });

  initAudioPlayer();
  initProductCardEvents(document.getElementById('related-grid'));

  // Tabs
  const tabs = document.querySelectorAll('.product-tab');
  const contents = document.querySelectorAll('.product-tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

function initAudioPlayer() {
  const playBtn = document.getElementById('demo-play-btn');
  const waveform = document.getElementById('audio-waveform');
  if (!playBtn || !waveform) return;

  let playing = false;
  let progress = 0;
  let interval = null;
  const bars = waveform.querySelectorAll('.waveform-bar');
  const totalBars = bars.length;

  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? '⏸' : '▶';
    if (playing) {
      interval = setInterval(() => {
        progress++;
        if (progress >= totalBars) { progress = 0; bars.forEach(b => b.classList.remove('played')); }
        bars[progress]?.classList.add('played');
        const currentEl = document.getElementById('audio-current');
        if (currentEl) {
          const secs = Math.floor(progress * 2.5);
          currentEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        }
      }, 100);
    } else {
      clearInterval(interval);
    }
  });

  waveform.addEventListener('click', (e) => {
    const rect = waveform.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    progress = Math.floor(pct * totalBars);
    bars.forEach((b, i) => b.classList.toggle('played', i <= progress));
  });
}
