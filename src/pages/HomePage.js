// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Home Page
// ═══════════════════════════════════════════════════════

import { getFeaturedProducts, getTrendingProducts, getNewProducts } from '../data/products.js';
import { renderProductCard, initProductCardEvents } from '../components/ProductCard.js';
import { formatPrice, getPluginImage } from '../core/utils.js';
import { navigate } from '../core/router.js';

export function renderHomePage() {
  const featured = getFeaturedProducts();
  const trending = getTrendingProducts();
  const latest = getNewProducts();
  const container = document.getElementById('page-content');

  container.innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="hero-grid-bg"></div>
      </div>
      <div class="container">
        <div class="hero-content animate-fade-in-up">
          <div class="hero-badge">
            <span>🔥</span> New Release — Voltage Distortion v1.0
          </div>
          <h1>Craft Your <span class="accent">Perfect Sound</span></h1>
          <p>Professional audio plugins designed for producers and engineers who demand studio-quality processing. Pay with crypto, download instantly.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="hero-browse-btn">Browse Plugins</button>
            <button class="btn btn-secondary btn-lg" id="hero-bundle-btn">View Bundle — Save 60%</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="number">12</div>
              <div class="label">Plugins</div>
            </div>
            <div class="hero-stat">
              <div class="number">50K+</div>
              <div class="label">Users</div>
            </div>
            <div class="hero-stat">
              <div class="number">4.8</div>
              <div class="label">Avg Rating</div>
            </div>
            <div class="hero-stat">
              <div class="number">₿</div>
              <div class="label">Crypto Pay</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED CAROUSEL -->
    <section class="section carousel-section">
      <div class="container">
        <div class="section-title">
          <h2>Featured Plugins</h2>
          <a href="/store" class="see-all">See all →</a>
        </div>
        <div class="carousel-wrapper" id="featured-carousel">
          <div class="carousel-track" id="carousel-track">
            ${featured.map((p, i) => `
              <div class="carousel-slide" data-slide="${i}">
                <img class="carousel-slide-image" src="${getPluginImage(p)}" alt="${p.name}" />
                <div class="carousel-slide-overlay">
                  <span class="badge badge-green" style="margin-bottom: 8px;">Featured</span>
                  <h3>${p.name}</h3>
                  <p>${p.shortDesc}</p>
                  <div class="flex items-center gap-md">
                    <span style="font-size: var(--text-xl); font-weight: 700; color: var(--neon-green);">${formatPrice(p.salePrice || p.price)}</span>
                    <a href="/product/${p.slug}" class="btn btn-sm btn-primary">View Details</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="carousel-nav carousel-prev" id="carousel-prev">‹</button>
          <button class="carousel-nav carousel-next" id="carousel-next">›</button>
        </div>
        <div class="carousel-dots" id="carousel-dots">
          ${featured.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></button>`).join('')}
        </div>
      </div>
    </section>

    <!-- LATEST RELEASES -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Latest Releases</h2>
          <a href="/store?sort=newest" class="see-all">See all →</a>
        </div>
        <div class="products-grid" id="latest-grid">
          ${latest.map((p, i) => renderProductCard(p, i)).join('')}
        </div>
      </div>
    </section>

    <!-- TRENDING -->
    <section class="section" style="background: var(--bg-secondary);">
      <div class="container">
        <div class="section-title">
          <h2>Trending Now</h2>
          <a href="/store?sort=rating" class="see-all">See all →</a>
        </div>
        <div class="products-grid" id="trending-grid">
          ${trending.slice(0, 6).map((p, i) => renderProductCard(p, i)).join('')}
        </div>
      </div>
    </section>

    <!-- WHY PRO-MIX STATS -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Why Pro-Mix?</h2>
        </div>
        <div class="stats-row">
          <div class="stat-card animate-fade-in-up delay-1">
            <span class="stat-card-icon">🎵</span>
            <h4>64-bit</h4>
            <p>Studio-grade audio processing with zero compromises</p>
          </div>
          <div class="stat-card animate-fade-in-up delay-2">
            <span class="stat-card-icon">⚡</span>
            <h4>Low CPU</h4>
            <p>Optimized algorithms that won't slow your sessions</p>
          </div>
          <div class="stat-card animate-fade-in-up delay-3">
            <span class="stat-card-icon">₿</span>
            <h4>Crypto Pay</h4>
            <p>Accept BTC, ETH, and USDT — instant downloads</p>
          </div>
          <div class="stat-card animate-fade-in-up delay-4">
            <span class="stat-card-icon">🔄</span>
            <h4>Free Updates</h4>
            <p>Lifetime access to updates and new features</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA BANNER -->
    <section class="section">
      <div class="container">
        <div class="cta-banner animate-fade-in-up">
          <h2>Get the Complete Bundle</h2>
          <p>All 11 plugins, future releases included, for one incredible price. Save over 60% compared to buying individually.</p>
          <button class="btn btn-primary btn-lg" id="cta-bundle-btn">View Bundle — ${formatPrice(399.99)}</button>
        </div>
      </div>
    </section>
  `;

  // Init events
  initCarousel(featured.length);
  initProductCardEvents(document.getElementById('latest-grid'));
  initProductCardEvents(document.getElementById('trending-grid'));

  document.getElementById('hero-browse-btn')?.addEventListener('click', () => navigate('/store'));
  document.getElementById('hero-bundle-btn')?.addEventListener('click', () => navigate('/product/promix-bundle'));
  document.getElementById('cta-bundle-btn')?.addEventListener('click', () => navigate('/product/promix-bundle'));
}

function initCarousel(slideCount) {
  let current = 0;
  const track = document.getElementById('carousel-track');
  const dots = document.querySelectorAll('.carousel-dot');

  function goTo(index) {
    current = ((index % slideCount) + slideCount) % slideCount;
    if (track) track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  document.getElementById('carousel-prev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('carousel-next')?.addEventListener('click', () => goTo(current + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.dot))));

  // Auto-play
  let autoPlay = setInterval(() => goTo(current + 1), 5000);
  const carousel = document.getElementById('featured-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
    carousel.addEventListener('mouseleave', () => {
      autoPlay = setInterval(() => goTo(current + 1), 5000);
    });
  }
}
