// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Detail Page
// ═══════════════════════════════════════════════════════

import { getProductBySlug, getProducts } from '../data/products.js';
import { formatPrice, formatCrypto, renderStars, getPluginImage, getCategoryName } from '../core/utils.js';
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
  const img = getPluginImage(product);
  const related = getProducts().filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  // Generate waveform bars
  const bars = Array.from({ length: 60 }, () => Math.random() * 80 + 10);

  container.innerHTML = `
    <div class="section">
      <div class="container">
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
            <div class="product-gallery-main">
              <img src="${img}" alt="${product.name}" id="gallery-main-img" />
            </div>
            <div class="product-gallery-thumbs">
              ${product.images.map((_, i) => `
                <div class="product-thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}">
                  <img src="${getPluginImage(product, i)}" alt="Thumbnail ${i + 1}" />
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
                ${product.salePrice ? `<div class="text-sm text-muted flex items-center gap-xs" style="margin-top: 4px;">
                  <span style="text-decoration: line-through;">${formatPrice(product.price)}</span>
                  <span style="color: var(--neon-orange); border: 1px solid var(--neon-orange); border-radius: 4px; padding: 2px 6px; font-weight: bold; background: rgba(255, 107, 43, 0.1);">-70% OFF</span>
                </div>` : ''}
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
              <button class="btn btn-secondary btn-lg" id="product-buy-crypto">₿ Buy with Crypto</button>
            </div>

            <!-- Audio Demo -->
            ${product.audioDemo ? `
              <div class="audio-player">
                <div class="audio-player-header">
                  <span>🎵</span>
                  <span>Audio Demo</span>
                </div>
                <div class="audio-player-controls">
                  <button class="play-btn" id="demo-play-btn">▶</button>
                  <div class="audio-progress-wrapper">
                    <div class="audio-waveform" id="audio-waveform">
                      ${bars.map((h, i) => `<div class="waveform-bar" style="height:${h}%" data-bar="${i}"></div>`).join('')}
                    </div>
                    <div class="audio-time">
                      <span id="audio-current">0:00</span>
                      <span id="audio-duration">2:30</span>
                    </div>
                  </div>
                  <div class="volume-control">
                    <span>🔊</span>
                    <input type="range" class="daw-slider volume-slider" min="0" max="100" value="80" />
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Description -->
            <div style="margin-bottom: var(--space-xl);">
              <h4 style="margin-bottom: var(--space-sm);">Description</h4>
              <p>${product.description}</p>
            </div>

            <!-- Features -->
            <div class="product-features">
              <h4>Key Features</h4>
              <div class="feature-list">
                ${product.features.map(f => `<div class="feature-item">${f}</div>`).join('')}
              </div>
            </div>

            <!-- DAW Compatibility -->
            <div style="margin-bottom: var(--space-xl);">
              <h4 style="margin-bottom: var(--space-sm);">DAW Compatibility</h4>
              <div class="product-daw-compat">
                ${product.dawCompat.map(d => {
                  const dawNames = { 'fl-studio': 'FL Studio', ableton: 'Ableton', 'pro-tools': 'Pro Tools', logic: 'Logic Pro', cubase: 'Cubase', reaper: 'Reaper', 'studio-one': 'Studio One' };
                  return `<span class="tag">${dawNames[d] || d}</span>`;
                }).join('')}
              </div>
            </div>

            <!-- Specs -->
            <div class="product-specs">
              <h4 style="margin-bottom: var(--space-sm);">Specifications</h4>
              <table class="specs-table">
                ${Object.entries(product.specs).map(([k, v]) => `
                  <tr><td>${k}</td><td>${v}</td></tr>
                `).join('')}
              </table>
            </div>

            <!-- System Requirements -->
            <div style="margin-bottom: var(--space-xl);">
              <h4 style="margin-bottom: var(--space-sm);">System Requirements</h4>
              <table class="specs-table">
                <tr><td>Operating System</td><td>${product.systemReqs.os}</td></tr>
                <tr><td>RAM</td><td>${product.systemReqs.ram}</td></tr>
                <tr><td>Disk Space</td><td>${product.systemReqs.disk}</td></tr>
                <tr><td>Processor</td><td>${product.systemReqs.cpu}</td></tr>
              </table>
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

  // Events
  const addCartBtn = document.getElementById('product-add-cart');
  if (addCartBtn && !inCart) {
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

  // Audio player simulation
  initAudioPlayer();

  // Related grid events
  initProductCardEvents(document.getElementById('related-grid'));

  // Thumbnail clicks
  document.querySelectorAll('.product-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const mainImg = document.getElementById('gallery-main-img');
      const newSrc = thumb.querySelector('img').src;
      if (mainImg) mainImg.src = newSrc;
    });
  });

  // Lightbox for main image
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0'; overlay.style.left = '0';
      overlay.style.width = '100vw'; overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0,0,0,0.9)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'zoom-out';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease-in-out';
      
      const imgClone = document.createElement('img');
      imgClone.src = mainImg.src;
      imgClone.style.maxWidth = '90%';
      imgClone.style.maxHeight = '90%';
      imgClone.style.borderRadius = 'var(--radius-lg)';
      imgClone.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
      imgClone.style.transform = 'scale(0.95)';
      imgClone.style.transition = 'transform 0.2s ease-out';
      
      overlay.appendChild(imgClone);
      document.body.appendChild(overlay);
      
      // Trigger animation
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        imgClone.style.transform = 'scale(1)';
      });
      
      overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        imgClone.style.transform = 'scale(0.95)';
        setTimeout(() => document.body.removeChild(overlay), 200);
      });
    });
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
        if (progress >= totalBars) {
          progress = 0;
          bars.forEach(b => b.classList.remove('played'));
        }
        bars[progress]?.classList.add('played');
        
        // Update time
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

  // Click on waveform to seek
  waveform.addEventListener('click', (e) => {
    const rect = waveform.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    progress = Math.floor(pct * totalBars);
    bars.forEach((b, i) => b.classList.toggle('played', i <= progress));
  });
}
