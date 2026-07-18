// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Detail Page
// ═══════════════════════════════════════════════════════

import { getProductBySlug, getProducts } from '../data/products.js';
import { getProductReviews, saveUserReview, formatReviewDate } from '../data/reviews.js';
import { formatPrice, formatCrypto, renderStars, getPluginImage, getCategoryName, calculateDiscount, setPageMeta } from '../core/utils.js';
import { addToCart, isInCart, isLoggedIn } from '../core/store.js';
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

  // Detect available OS download options
  const specs = product.specs || {};
  const osOptions = [];
  if (specs.download_win)   osOptions.push({ id: 'windows', label: '🪟 Windows' });
  if (specs.download_mac)   osOptions.push({ id: 'mac',     label: '🍎 macOS' });
  if (specs.download_linux) osOptions.push({ id: 'linux',   label: '🐧 Linux' });
  const needsOsSelect = osOptions.length > 1;
  let selectedOs = osOptions.length === 1 ? osOptions[0].id : null;


  // Set unique SEO meta for this product
  setPageMeta(
    product.name,
    `${product.shortDesc || ''} — Get ${product.name} at up to 70% off retail. ${getCategoryName(product.category)} plugin. Instant download. Pay with crypto.`.trim(),
    getPluginImage(product, 0)
  );

  // ── Fetch Reviews & Calculate True Rating ──
  let allReviews = getProductReviews(product.id, product.category);
  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0 ? (allReviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1) : 0;
  
  // Sort State
  let activeSort = 'helpful';

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
              <span class="stars">${renderStars(avgRating)}</span>
              <span class="text-sm text-secondary">${avgRating} (${totalReviews} reviews)</span>
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
              ${price === 0 ? `
                <button class="btn btn-primary btn-lg" id="product-download-free" style="width: 100%;">
                  ⬇️ Download Free
                </button>
              ` : `
                ${needsOsSelect ? `
                <div id="os-selector" style="margin-bottom:12px;">
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Select your operating system</div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${osOptions.map(os => `
                      <button class="os-option-btn btn btn-ghost" data-os="${os.id}"
                        style="padding:8px 16px; font-size:0.875rem; border:1px solid rgba(255,255,255,0.15); border-radius:var(--radius-md); transition:all 0.2s;">
                        ${os.label}
                      </button>
                    `).join('')}
                  </div>
                </div>` : ''}
                <button class="btn btn-primary btn-lg" id="product-add-cart"
                  ${inCart ? 'disabled style="opacity:0.5"' : ''}
                  ${needsOsSelect && !inCart ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
                  ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
                </button>
                <button class="btn" style="background: rgba(247, 147, 26, 0.1); border: 1px solid rgba(247, 147, 26, 0.3); color: #f7931a;" id="product-buy-crypto">
                  ⚡ Instant Access — Pay with Crypto
                </button>
              `}
            </div>

            <div class="product-trust-badges" style="display:flex; justify-content:space-between; margin-bottom:var(--space-xl); font-size:12px; color:var(--text-muted); border-top:1px solid var(--border-primary); padding-top:var(--space-md);">
              <span>🔒 Secure Payment</span>
              <span>⚡ Instant Delivery</span>
              <span>🔄 Lifetime Updates</span>
            </div>

            <!-- Waveform Visual (decorative) -->
            <div class="audio-player" style="opacity:0.6;">
              <div class="audio-player-header">
                <span>🎛️</span>
                <span style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:1px;">Frequency Spectrum</span>
              </div>
              <div class="audio-waveform" id="audio-waveform" style="pointer-events:none;">
                ${bars.map((h, i) => `<div class="waveform-bar" style="height:${h}%;animation-delay:${(i*0.04).toFixed(2)}s"></div>`).join('')}
              </div>
            </div>

          </div> <!-- /product-info -->
        </div> <!-- /product-detail -->

        <!-- FULL WIDTH BOTTOM SECTION (Tabs) -->
        <div class="product-bottom-section animate-fade-in-up delay-3" style="margin-top: var(--space-3xl);">
          <div class="product-tabs-container" style="margin-top: 0; border-top: none; padding-top: 0;">
            <div class="product-tabs-nav">
              <button class="product-tab active" data-tab="desc">Description</button>
              <button class="product-tab" data-tab="features">Key Features</button>
              <button class="product-tab" data-tab="specs">Specs & Reqs</button>
              <button class="product-tab" data-tab="reviews">Reviews <span style="background:rgba(0,255,136,0.1); color:var(--neon-green); padding:2px 6px; border-radius:12px; font-size:10px; margin-left:6px;">${totalReviews}</span></button>
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
                      .filter(([k]) => !['source_url', 'download_mac', 'download_win', 'download_linux', 'download_manual', 'magnet'].includes(k.toLowerCase()))
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

            <!-- Tab: Reviews -->
            <div class="product-tab-content" id="tab-reviews">
              <div id="reviews-container"></div>
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

    <!-- Write Review Modal (rendered at page root to avoid transform containment viewport issues) -->
    <div id="review-modal" class="modal-overlay" style="display:none; z-index: 100000;">
      <div class="modal" style="max-width:500px;">
        <h2 style="margin-bottom:var(--space-sm);">Write a Review</h2>
        <p style="color:var(--text-secondary); margin-bottom:var(--space-md);">Share your experience with this plugin.</p>
        <form id="write-rev-form">
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;font-size:12px;">Rating</label>
            <select id="wr-rating" class="input" required>
              <option value="5">5 Stars — Excellent</option>
              <option value="4">4 Stars — Good</option>
              <option value="3">3 Stars — Average</option>
              <option value="2">2 Stars — Poor</option>
              <option value="1">1 Star — Terrible</option>
            </select>
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;font-size:12px;">Title</label>
            <input type="text" id="wr-title" class="input" placeholder="Summarize your thoughts" required />
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;font-size:12px;">Review</label>
            <textarea id="wr-text" class="input" rows="4" placeholder="How do you use it? What do you like or dislike?" required></textarea>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;font-size:12px;">Your Name</label>
            <input type="text" id="wr-name" class="input" placeholder="e.g. John Doe" required />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button type="button" class="btn btn-ghost" id="btn-cancel-rev">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-rev">Submit Review</button>
          </div>
        </form>
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
  document.getElementById('product-download-free')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please log in or create a free account to download.', 'error');
      sessionStorage.setItem('pm_redirect_after_login', `/product/${product.slug}`);
      navigate('/login');
      return;
    }
    sessionStorage.setItem('pm_last_order', JSON.stringify({
      items: [product],
      total: 0,
      isFree: true
    }));
    navigate('/order-success');
  });

  // OS selector interaction
  if (needsOsSelect) {
    document.querySelectorAll('.os-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedOs = btn.dataset.os;
        // Update pill styles
        document.querySelectorAll('.os-option-btn').forEach(b => {
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.color = '';
          b.style.background = '';
        });
        btn.style.borderColor = 'var(--neon-green)';
        btn.style.color = 'var(--neon-green)';
        btn.style.background = 'rgba(0,255,136,0.08)';
        // Unlock cart button
        const cartBtn = document.getElementById('product-add-cart');
        if (cartBtn && !inCart) {
          cartBtn.disabled = false;
          cartBtn.style.opacity = '1';
          cartBtn.style.cursor = '';
        }
        const stickyBtn = document.getElementById('sticky-atc-btn');
        if (stickyBtn && !inCart) {
          stickyBtn.disabled = false;
          stickyBtn.style.opacity = '1';
        }
      });
    });
  }

  const addCartBtn = document.getElementById('product-add-cart');
  if (!inCart && addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      if (needsOsSelect && !selectedOs) {
        showToast('Please select your operating system first.', 'error');
        document.getElementById('os-selector')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const added = addToCart({ ...product, selectedOs: selectedOs || null });
      if (added) {
        showToast(`${product.name} added to cart!`, 'success');
        addCartBtn.textContent = '✓ In Cart';
        addCartBtn.disabled = true;
        addCartBtn.style.opacity = '0.5';
      }
    });
  }

  document.getElementById('product-buy-crypto')?.addEventListener('click', () => {
    if (needsOsSelect && !selectedOs) {
      showToast('Please select your operating system first.', 'error');
      document.getElementById('os-selector')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (!isInCart(product.id)) addToCart({ ...product, selectedOs: selectedOs || null });
    navigate('/checkout');
  });

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

  // ── Render Dynamic Reviews ──
  function renderReviews() {
    const revContainer = document.getElementById('reviews-container');
    if (!revContainer) return;

    // Apply Sort
    let sorted = [...allReviews];
    if (activeSort === 'newest') sorted.sort((a,b) => new Date(b.date) - new Date(a.date));
    else if (activeSort === 'highest') sorted.sort((a,b) => b.stars - a.stars);
    else if (activeSort === 'lowest') sorted.sort((a,b) => a.stars - b.stars);
    else if (activeSort === 'helpful') sorted.sort((a,b) => b.helpful - a.helpful);

    // Filter Distributions
    const dist = {5:0,4:0,3:0,2:0,1:0};
    allReviews.forEach(r => { dist[r.stars] = (dist[r.stars] || 0) + 1; });

    revContainer.innerHTML = `
      <div class="review-header">
        <div class="review-summary">
          <div class="review-avg-box">
            <div class="review-avg-number">${avgRating}</div>
            <div class="stars">${renderStars(avgRating)}</div>
            <div class="review-count-text">Based on ${totalReviews} reviews</div>
          </div>
          <div class="review-bars">
            ${[5,4,3,2,1].map(stars => `
              <div class="review-bar-row">
                <span>${stars} ★</span>
                <div class="review-bar-track">
                  <div class="review-bar-fill" style="width: ${(totalReviews > 0 ? (dist[stars]/totalReviews)*100 : 0)}%"></div>
                </div>
                <span style="font-size:12px; color:var(--text-muted); width:20px; text-align:right;">${dist[stars]}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="review-actions">
          <button class="btn btn-primary" id="btn-write-review">✎ Write a Review</button>
        </div>
      </div>

      <div class="review-filters">
        <span>Sort by:</span>
        <select id="review-sort" class="input" style="width:auto; padding:4px 8px;">
          <option value="helpful" ${activeSort === 'helpful' ? 'selected' : ''}>Most Helpful</option>
          <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="highest" ${activeSort === 'highest' ? 'selected' : ''}>Highest Rated</option>
          <option value="lowest" ${activeSort === 'lowest' ? 'selected' : ''}>Lowest Rated</option>
        </select>
      </div>

      <div class="review-list">
        ${sorted.map(r => `
          <div class="review-card ${r.isUser ? 'user-review' : ''}">
            <div class="rev-header">
              <div class="rev-avatar" style="background:hsl(${Array.from(r.author).reduce((a,c)=>a+c.charCodeAt(0),0)%360}, 60%, 40%)">${r.initials}</div>
              <div class="rev-meta">
                <div class="rev-author">${r.author} ${r.verified ? '<span class="rev-badge">✅ Verified Buyer</span>' : ''}</div>
                <div class="rev-date">${formatReviewDate(r.date)}</div>
              </div>
              <div class="rev-stars">${renderStars(r.stars)}</div>
            </div>
            <div class="rev-body">
              <h4 class="rev-title">${r.title}</h4>
              <p class="rev-text">${r.text}</p>
            </div>
            <div class="rev-footer">
              <span class="rev-helpful-txt">Was this helpful?</span>
              <button class="rev-btn" data-id="${r.id}" data-type="yes">Yes (${r.helpful})</button>
              <button class="rev-btn" data-id="${r.id}" data-type="no">No</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Bind Dropdown
    document.getElementById('review-sort')?.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderReviews();
    });

    // Helpful interactions
    document.querySelectorAll('.rev-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        const lsKey = `pm_voted_${id}`;
        if (localStorage.getItem(lsKey)) {
          showToast('You already voted on this review.', 'error');
          return;
        }
        localStorage.setItem(lsKey, 'true');
        showToast('Thanks for your feedback!', 'success');
        
        if (type === 'yes') {
          const rev = allReviews.find(x => x.id === id);
          if (rev) rev.helpful++;
          renderReviews();
        }
      });
    });

    // Modal behavior (open modal)
    document.getElementById('btn-write-review')?.addEventListener('click', () => {
      document.getElementById('review-modal').style.display = 'flex';
    });
  }

  // Trigger initial review render
  renderReviews();

  // Bind modal close/cancel and submit events ONCE (since the modal resides outside of reviews-container and isn't destroyed)
  document.getElementById('btn-cancel-rev')?.addEventListener('click', () => {
    document.getElementById('review-modal').style.display = 'none';
    document.getElementById('write-rev-form')?.reset();
  });
  
  // Form Submit
  document.getElementById('write-rev-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const wrBtn = document.getElementById('btn-submit-rev');
    if (!wrBtn) return;
    wrBtn.disabled = true;
    wrBtn.textContent = 'Submitting...';

    setTimeout(() => {
      const title = document.getElementById('wr-title').value;
      const text = document.getElementById('wr-text').value;
      const name = document.getElementById('wr-name').value;
      const stars = parseInt(document.getElementById('wr-rating').value, 10);
      
      let pName = name.split(' ');
      let initials = pName[0]?.charAt(0);
      if (pName[1]) initials += pName[1].charAt(0);

      const newRev = {
        title, text, author: name, initials: initials.toUpperCase(), stars
      };

      saveUserReview(product.id, newRev);
      // Refresh
      allReviews = getProductReviews(product.id, product.category);
      
      document.getElementById('review-modal').style.display = 'none';
      showToast('Review approved instantly!', 'success');
      
      // Reset submit button state for future uses
      wrBtn.disabled = false;
      wrBtn.textContent = 'Submit Review';
      document.getElementById('write-rev-form')?.reset();

      // Auto sort to Newest so they see it
      activeSort = 'newest';
      renderReviews();
    }, 600);
  });
  // ── Sticky Add-to-Cart Bar ─────────────────────────────────
  const mainCta = document.getElementById('product-add-cart');
  if (mainCta) {
    // Create the sticky bar
    const stickyBar = document.createElement('div');
    stickyBar.id = 'sticky-atc-bar';
    stickyBar.className = 'sticky-atc-bar';
    stickyBar.innerHTML = `
      <div class="sticky-atc-info">
        <span class="sticky-atc-name">${product.name}</span>
        <span class="sticky-atc-price">${formatPrice(price)}</span>
      </div>
      <div class="sticky-atc-actions">
        ${price === 0 ? `
          <button class="btn btn-primary" id="sticky-download-free">
            ⬇️ Download Free
          </button>
        ` : `
          <button class="btn btn-primary" id="sticky-atc-btn" ${inCart ? 'disabled style="opacity:0.5"' : ''}>
            ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
          </button>
          <button class="btn" style="background:rgba(247,147,26,0.1);border:1px solid rgba(247,147,26,0.3);color:#f7931a;" id="sticky-buy-btn">
            ⚡ Buy Now
          </button>
        `}
      </div>
    `;
    // Append to page content so it's auto-cleaned up on route change
    document.getElementById('page-content').appendChild(stickyBar);

    // Show/hide based on whether main CTA is in viewport
    const observer = new IntersectionObserver(
      ([entry]) => stickyBar.classList.toggle('sticky-atc-visible', !entry.isIntersecting),
      { threshold: 0, rootMargin: '-68px 0px 0px 0px' } // account for header height
    );
    observer.observe(mainCta);

    // Sticky bar events
    document.getElementById('sticky-download-free')?.addEventListener('click', () => {
      if (!isLoggedIn()) {
        showToast('Please log in or create a free account to download.', 'error');
        sessionStorage.setItem('pm_redirect_after_login', `/product/${product.slug}`);
        navigate('/login');
        return;
      }
      sessionStorage.setItem('pm_last_order', JSON.stringify({
        items: [product],
        total: 0,
        isFree: true
      }));
      navigate('/order-success');
    });

    document.getElementById('sticky-atc-btn')?.addEventListener('click', () => {
      if (needsOsSelect && !selectedOs) {
        showToast('Please select your operating system first.', 'error');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!isInCart(product.id)) {
        addToCart({ ...product, selectedOs: selectedOs || null });
        showToast(`${product.name} added to cart!`, 'success');
        document.getElementById('sticky-atc-btn').textContent = '✓ In Cart';
        document.getElementById('sticky-atc-btn').disabled = true;
        document.getElementById('sticky-atc-btn').style.opacity = '0.5';
        // Sync main button too
        if (mainCta) { mainCta.textContent = '✓ In Cart'; mainCta.disabled = true; mainCta.style.opacity = '0.5'; }
      }
    });
    document.getElementById('sticky-buy-btn')?.addEventListener('click', () => {
      if (needsOsSelect && !selectedOs) {
        showToast('Please select your operating system first.', 'error');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!isInCart(product.id)) addToCart({ ...product, selectedOs: selectedOs || null });
      navigate('/checkout');
    });


    // Clean up observer when navigating away
    window.addEventListener('popstate', () => { observer.disconnect(); stickyBar?.remove(); }, { once: true });
  }
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
