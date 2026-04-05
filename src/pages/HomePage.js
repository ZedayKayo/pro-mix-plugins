// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Premium Home Page
// ═══════════════════════════════════════════════════════

import { getFeaturedProducts, getTrendingProducts, getNewProducts } from '../data/products.js';
import { renderProductCard, initProductCardEvents } from '../components/ProductCard.js';
import { initQuickViewModal } from '../components/QuickViewModal.js';
import { formatPrice, getPluginImage, sanitizeHTML } from '../core/utils.js';
import { navigate } from '../core/router.js';
import { getDiscountPct } from '../services/discountService.js';

export function renderHomePage() {
  const featured = getFeaturedProducts();
  const trending  = getTrendingProducts();
  const latest    = getNewProducts();
  const container = document.getElementById('page-content');
  const discountPct = getDiscountPct();

  container.innerHTML = `

    <!-- ══ HERO ══ -->
    <section class="hp-hero">
      <div class="hp-hero-bg">
        <div class="hp-orb hp-orb-1"></div>
        <div class="hp-orb hp-orb-2"></div>
        <div class="hp-orb hp-orb-3"></div>
        <div class="hp-grid-lines"></div>
      </div>

      <div class="container">
        <div class="hp-hero-inner">
          <div class="hp-hero-content animate-fade-in-up">
            <div class="hp-badge">
              <span class="hp-badge-dot"></span>
              <span>50,000+ producers trust Pro-Mix</span>
            </div>

            <h1 class="hp-headline">
              Professional Plugins.<br/>
              <span class="hp-headline-accent">Industry Price.</span>
            </h1>

            <p class="hp-subheadline">
              Access the world's most powerful audio plugins — EQs, compressors, reverbs, synthesizers — at up to ${discountPct}% off retail. Pay with crypto. Download instantly.
            </p>

            <div class="hp-trust-row">
              <div class="hp-trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Instant delivery
              </div>
              <div class="hp-trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secure checkout
              </div>
              <div class="hp-trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Lifetime license
              </div>
            </div>

            <div class="hp-hero-actions">
              <button class="hp-btn-primary" id="hero-browse-btn">
                Browse Plugins
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <button class="hp-btn-secondary" id="hero-bundle-btn">
                View Bundles — Save ${discountPct}%
              </button>
            </div>
          </div>

          <div class="hp-hero-visual animate-fade-in-up" style="animation-delay:0.15s">
            <div class="hp-waveform">
              ${Array.from({length: 40}).map((_,i) => `
                <div class="hp-wave-bar" style="animation-delay: ${(i * 0.06).toFixed(2)}s; height: ${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}px"></div>
              `).join('')}
            </div>
            <div class="hp-hero-stats">
              <div class="hp-stat">
                <div class="hp-stat-val">${discountPct}%</div>
                <div class="hp-stat-label">Off Retail</div>
              </div>
              <div class="hp-stat-sep"></div>
              <div class="hp-stat">
                <div class="hp-stat-val">50K+</div>
                <div class="hp-stat-label">Producers</div>
              </div>
              <div class="hp-stat-sep"></div>
              <div class="hp-stat">
                <div class="hp-stat-val">4.9★</div>
                <div class="hp-stat-label">Avg Rating</div>
              </div>
              <div class="hp-stat-sep"></div>
              <div class="hp-stat">
                <div class="hp-stat-val">₿</div>
                <div class="hp-stat-label">Crypto OK</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrolling brand ticker -->
      <div class="hp-ticker-wrap">
        <div class="hp-ticker">
          ${['FabFilter','iZotope','Native Instruments','Arturia','Waves','Spectrasonics','u-he','Valhalla DSP','Baby Audio','Xfer Records','Kilohearts','Output','Plugin Alliance','Soundtoys','Slate Digital',
             'FabFilter','iZotope','Native Instruments','Arturia','Waves','Spectrasonics','u-he','Valhalla DSP','Baby Audio','Xfer Records','Kilohearts','Output','Plugin Alliance','Soundtoys','Slate Digital']
            .map(b => `<span class="hp-ticker-item">${b}</span>`).join('<span class="hp-ticker-dot">·</span>')}
        </div>
      </div>
    </section>

    <!-- ══ FEATURED CAROUSEL ══ -->
    <section class="hp-section">
      <div class="container">
        <div class="hp-section-head">
          <div>
            <div class="hp-section-label">⭐ Hand-Picked</div>
            <h2 class="hp-section-title">Featured Plugins</h2>
          </div>
          <a href="/store" class="hp-see-all" id="featured-see-all">View all plugins →</a>
        </div>
        <div class="hp-carousel" id="featured-carousel">
          <div class="hp-carousel-track" id="carousel-track">
            ${featured.map((p, i) => `
              <div class="hp-carousel-slide" data-slide="${i}">
                <div class="hp-carousel-img" style="background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,212,255,0.06))">
                  <img src="${getPluginImage(p)}" alt="${sanitizeHTML(p.name)}" />
                </div>
                <div class="hp-carousel-overlay">
                  <span class="hp-carousel-cat">${p.category.toUpperCase()}</span>
                  <h3 class="hp-carousel-name">${sanitizeHTML(p.name)}</h3>
                  <p class="hp-carousel-desc">${sanitizeHTML(p.shortDesc || '')}</p>
                  <div class="hp-carousel-footer">
                    <span class="hp-carousel-price">${formatPrice(p.salePrice || p.price)}</span>
                    <a href="/product/${p.slug}" class="hp-carousel-btn" data-carousel-link="${p.slug}">View Details →</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="hp-carousel-nav hp-prev" id="carousel-prev">‹</button>
          <button class="hp-carousel-nav hp-next" id="carousel-next">›</button>
        </div>
        <div class="hp-carousel-dots" id="carousel-dots">
          ${featured.map((_, i) => `<button class="hp-dot ${i===0?'active':''}" data-dot="${i}"></button>`).join('')}
        </div>
      </div>
    </section>

    <!-- ══ HOW IT WORKS ══ -->
    <section class="hp-section hp-how-section">
      <div class="container">
        <div class="hp-section-head centered">
          <div class="hp-section-label">Simple Process</div>
          <h2 class="hp-section-title">Get Your Plugin in 3 Steps</h2>
        </div>
        <div class="hp-steps">
          <div class="hp-step animate-fade-in-up delay-1">
            <div class="hp-step-num">01</div>
            <div class="hp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h4 class="hp-step-title">Choose Your Plugin</h4>
            <p class="hp-step-desc">Browse 80+ professional plugins across every category — EQ, compression, reverb, synthesis, and more.</p>
          </div>
          <div class="hp-step-arrow">→</div>
          <div class="hp-step animate-fade-in-up delay-2">
            <div class="hp-step-num">02</div>
            <div class="hp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h4 class="hp-step-title">Pay Securely</h4>
            <p class="hp-step-desc">Checkout using Bitcoin, Ethereum, USDT, or other crypto methods. Private, fast, and globally accepted.</p>
          </div>
          <div class="hp-step-arrow">→</div>
          <div class="hp-step animate-fade-in-up delay-3">
            <div class="hp-step-num">03</div>
            <div class="hp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h4 class="hp-step-title">Download Instantly</h4>
            <p class="hp-step-desc">Access your plugin immediately. Includes installation instructions and lifetime access to updates.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FEATURES ══ -->
    <section class="hp-section" style="background: var(--bg-secondary)">
      <div class="container">
        <div class="hp-section-head centered">
          <div class="hp-section-label">Why Pro-Mix?</div>
          <h2 class="hp-section-title">Built for Serious Producers</h2>
        </div>
        <div class="hp-features">
          <div class="hp-feature animate-fade-in-up delay-1">
            <div class="hp-feature-icon" style="--fi-color: rgba(0,255,136,0.12); --fi-stroke: var(--neon-green)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            <h4>Studio-Grade Sound</h4>
            <p>Every plugin is 64-bit precision, professionally optimized, and tested across major DAWs. Zero compromise on quality.</p>
          </div>
          <div class="hp-feature animate-fade-in-up delay-2">
            <div class="hp-feature-icon" style="--fi-color: rgba(0,212,255,0.12); --fi-stroke: var(--neon-blue)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h4>Instant Download</h4>
            <p>No waiting, no approval queue. Once payment confirms, your plugin download link is available immediately in your dashboard.</p>
          </div>
          <div class="hp-feature animate-fade-in-up delay-3">
            <div class="hp-feature-icon" style="--fi-color: rgba(168,85,247,0.12); --fi-stroke: var(--neon-purple)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h4>Up to ${discountPct}% Off</h4>
            <p>Our pricing model gives independent producers access to industry-standard tools at a fraction of retail cost. Always.</p>
          </div>
          <div class="hp-feature animate-fade-in-up delay-4">
            <div class="hp-feature-icon" style="--fi-color: rgba(255,107,43,0.12); --fi-stroke: var(--neon-orange)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h4>All DAWs Supported</h4>
            <p>VST3, AU, AAX formats for FL Studio, Ableton, Logic, Pro Tools, Cubase, Studio One — if you mix in it, it works.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ LATEST RELEASES ══ -->
    <section class="hp-section">
      <div class="container">
        <div class="hp-section-head">
          <div>
            <div class="hp-section-label">Just Dropped</div>
            <h2 class="hp-section-title">Latest Releases</h2>
          </div>
          <a href="/store?sort=newest" class="hp-see-all" id="latest-see-all">See all →</a>
        </div>
        <div class="products-grid" id="latest-grid">
          ${latest.slice(0,8).map((p, i) => renderProductCard(p, i)).join('')}
        </div>
      </div>
    </section>

    <!-- ══ TESTIMONIALS ══ -->
    <section class="hp-section hp-testimonials-section">
      <div class="container">
        <div class="hp-section-head centered">
          <div class="hp-section-label">Producer Stories</div>
          <h2 class="hp-section-title">Used by Creators Worldwide</h2>
        </div>
        <div class="hp-testimonials">
          <div class="hp-testimonial animate-fade-in-up delay-1">
            <div class="hp-testimonial-stars">★★★★★</div>
            <p class="hp-testimonial-text">"FabFilter Pro-Q 3 at 30% of retail? I thought it was too good to be true. Downloaded, installed, works perfectly in Ableton. This is the real deal."</p>
            <div class="hp-testimonial-author">
              <div class="hp-testimonial-avatar" style="background: linear-gradient(135deg,#00ff88,#00d4ff)">M</div>
              <div>
                <div class="hp-testimonial-name">Marcus K.</div>
                <div class="hp-testimonial-role">Hip-hop Producer · Atlanta</div>
              </div>
            </div>
          </div>
          <div class="hp-testimonial animate-fade-in-up delay-2">
            <div class="hp-testimonial-stars">★★★★★</div>
            <p class="hp-testimonial-text">"I run a home studio and can't afford full retail prices. Pro-Mix gave me iZotope Ozone and Serum for less than a single plugin costs elsewhere. Incredible."</p>
            <div class="hp-testimonial-author">
              <div class="hp-testimonial-avatar" style="background: linear-gradient(135deg,#a855f7,#ff3b5c)">S</div>
              <div>
                <div class="hp-testimonial-name">Sofia R.</div>
                <div class="hp-testimonial-role">Singer-Songwriter · Madrid</div>
              </div>
            </div>
          </div>
          <div class="hp-testimonial animate-fade-in-up delay-3">
            <div class="hp-testimonial-stars">★★★★★</div>
            <p class="hp-testimonial-text">"Payment was smooth with USDT, download was instant, and the installation guide is clear. This is how plugin stores should work."</p>
            <div class="hp-testimonial-author">
              <div class="hp-testimonial-avatar" style="background: linear-gradient(135deg,#ff6b2b,#facc15)">D</div>
              <div>
                <div class="hp-testimonial-name">Dev P.</div>
                <div class="hp-testimonial-role">Mix Engineer · Mumbai</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ BUNDLE OFFER ══ -->
    <section class="hp-section">
      <div class="container">
        <div class="hp-bundle-card animate-fade-in-up">
          <div class="hp-bundle-tag">⚡ Limited-time offer</div>
          <div class="hp-bundle-content">
            <div>
              <h2 class="hp-bundle-title">Get Everything.<br/>Pay Once.</h2>
              <p class="hp-bundle-desc">Our complete bundle includes every plugin in the store — plus all future releases. The best value in professional audio production.</p>
              <div class="hp-bundle-pills">
                <span>80+ Plugins</span>
                <span>All Formats</span>
                <span>Lifetime Updates</span>
              </div>
            </div>
            <div class="hp-bundle-price-block">
              <div class="hp-bundle-was">Was $2,400+</div>
              <div class="hp-bundle-now">${formatPrice(399.99)}</div>
              <div class="hp-bundle-save">You save $2,000+</div>
              <button class="hp-btn-primary hp-bundle-cta" id="bundle-cta-btn">
                Get Full Bundle
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FAQ ══ -->
    <section class="hp-section hp-faq-section" style="background: var(--bg-secondary)">
      <div class="container hp-faq-container">
        <div class="hp-section-head centered" style="margin-bottom: var(--space-2xl)">
          <div class="hp-section-label">Got Questions?</div>
          <h2 class="hp-section-title">Frequently Asked</h2>
        </div>
        <div class="hp-faq-list">
          ${[
            {
              q: "Why are prices lower than official versions?",
              a: "Our plugins are optimized and modified for accessibility and affordability, allowing users to access professional tools at a significantly reduced cost. We work to make studio-grade production tools available to independent creators worldwide."
            },
            {
              q: "Are the plugins tested and working?",
              a: "Yes. Every plugin in our catalog is individually tested across FL Studio, Ableton Live, Logic Pro, and Pro Tools before listing. We include version-specific installation notes to ensure compatibility."
            },
            {
              q: "How do I install a plugin after downloading?",
              a: "Each download includes a detailed installation guide specific to that plugin. General steps: extract the downloaded archive, run the installer, point it to your VST3/AU/AAX folder, and rescan in your DAW. Full guides are available in your Dashboard."
            },
            {
              q: "What do I need before installing?",
              a: "You need: a compatible DAW (FL Studio, Ableton, Logic, Pro Tools, Cubase, or Studio One), Windows 10+ or macOS 10.14+, 4 GB RAM minimum, and approximately 500 MB–2 GB disk space depending on the plugin."
            },
            {
              q: "Do I need to disable my antivirus?",
              a: "Some security software may flag modified plugin installers as false positives. If installation is blocked, temporarily disable real-time protection, install, then re-enable. The files are safe — this is a routine precaution for modified software."
            },
            {
              q: "What payment methods are accepted?",
              a: "We accept Bitcoin (BTC), Ethereum (ETH), and USDT (Tether). Crypto payments are private, borderless, and confirmed within minutes. Your download link is generated automatically upon payment confirmation."
            },
          ].map((faq, i) => `
            <div class="hp-faq-item" id="faq-${i}">
              <button class="hp-faq-q" data-faq="${i}">
                <span>${faq.q}</span>
                <svg class="hp-faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div class="hp-faq-a" id="faq-a-${i}">${faq.a}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- ══ FINAL CTA ══ -->
    <section class="hp-cta-section">
      <div class="hp-cta-bg">
        <div class="hp-orb hp-orb-1" style="opacity:0.4"></div>
        <div class="hp-orb hp-orb-2" style="opacity:0.3"></div>
      </div>
      <div class="container">
        <div class="hp-cta-content animate-fade-in-up">
          <h2 class="hp-cta-title">Your Sound.<br/>Elevated.</h2>
          <p class="hp-cta-sub">80+ plugins. One store. Priced for creators.</p>
          <div class="hp-hero-actions">
            <button class="hp-btn-primary hp-btn-lg" id="final-cta-btn">
              Start Browsing
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  // Init
  initQuickViewModal();
  initProductCardEvents(document.getElementById('latest-grid'));
  initCarousel(featured.length);

  // Navigation
  document.getElementById('hero-browse-btn')?.addEventListener('click',  () => navigate('/store'));
  document.getElementById('hero-bundle-btn')?.addEventListener('click',  () => navigate('/store?category=bundle'));
  document.getElementById('bundle-cta-btn')?.addEventListener('click',   () => navigate('/store?category=bundle'));
  document.getElementById('final-cta-btn')?.addEventListener('click',    () => navigate('/store'));
  document.getElementById('featured-see-all')?.addEventListener('click', e => { e.preventDefault(); navigate('/store'); });
  document.getElementById('latest-see-all')?.addEventListener('click',   e => { e.preventDefault(); navigate('/store?sort=newest'); });

  // Carousel links (prevent full reload)
  document.querySelectorAll('[data-carousel-link]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(`/product/${a.dataset.carouselLink}`); });
  });

  // FAQ accordion
  document.querySelectorAll('.hp-faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.faq;
      const panel = document.getElementById(`faq-a-${id}`);
      const item  = document.getElementById(`faq-${id}`);
      const isOpen = item.classList.contains('open');
      // close all
      document.querySelectorAll('.hp-faq-item').forEach(el => el.classList.remove('open'));
      document.querySelectorAll('.hp-faq-a').forEach(el => el.style.maxHeight = '0');
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

// ── Carousel ──────────────────────────────────────────
function initCarousel(slideCount) {
  if (!slideCount) return;
  let current = 0;
  const track = document.getElementById('carousel-track');
  const dots   = document.querySelectorAll('.hp-dot');

  function goTo(i) {
    current = ((i % slideCount) + slideCount) % slideCount;
    if (track) track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle('active', j === current));
  }

  document.getElementById('carousel-prev')?.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  document.getElementById('carousel-next')?.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.dot); resetAutoplay(); }));

  let timer;
  const resetAutoplay = () => {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 6000);
  };

  const carousel = document.getElementById('featured-carousel');
  if (carousel) {
    resetAutoplay();
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', resetAutoplay);

    let sx = 0;
    carousel.addEventListener('touchstart', e => { sx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
    carousel.addEventListener('touchend',   e => {
      const dx = sx - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) goTo(dx > 0 ? current + 1 : current - 1);
      resetAutoplay();
    }, { passive: true });
  }
}
