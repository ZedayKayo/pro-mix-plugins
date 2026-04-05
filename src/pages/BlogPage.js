// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Blog / Tutorials Page
// ═══════════════════════════════════════════════════════

import { getDiscountPct } from '../services/discountService.js';

const ARTICLES = [
  {
    id: 'eq-techniques',
    title: '5 EQ Techniques Every Mix Engineer Needs to Master',
    excerpt: 'From high-pass filtering to dynamic EQ, these five techniques will transform how you approach equalization in every session.',
    category: 'Mixing',
    tagColor: 'green',
    emoji: '🎚️',
    author: 'Alex Mercer',
    authorInitial: 'AM',
    date: 'Mar 28, 2026',
    readTime: '8 min read',
    featured: true,
    content: `
      <p>Equalization is arguably the most-used tool in any mix engineer's arsenal. But using EQ well goes far beyond boosting highs and cutting muds. Here are the five techniques separating amateur mixes from professional ones.</p>

      <h2>1. High-Pass Everything (Almost)</h2>
      <p>The first rule of clean mixing: high-pass filter every element that doesn't need low-end. Guitars, synths, vocals, hi-hats — run a HPF at 80–120 Hz on nearly everything. The result is a cleaner, less cluttered low end that lets your bass and kick breathe.</p>
      <div class="tip-box"><strong>Pro Tip:</strong> Use a gentle 6dB/oct slope for natural-sounding cuts on vocals, and a steeper 24dB/oct for non-musical elements like room mics or foley.</div>

      <h2>2. Subtractive Before Additive</h2>
      <p>Most beginners boost frequencies to fix problems. Professionals cut first. Before reaching for a boost, ask yourself: "What's making this sound muddy, harsh, or thin?" A narrow cut at the offending frequency is almost always more transparent than a broad boost elsewhere.</p>
      <p>This keeps your gain structure healthy and reduces the risk of inter-plugin clipping as your signal chain builds up.</p>

      <h2>3. Mid/Side EQ for Width Control</h2>
      <p>Mid/Side processing is one of the most powerful — and most underused — techniques in modern mixing. By treating the center (mono) and sides (stereo width) independently, you can:</p>
      <ul>
        <li>High-pass the sides to remove low-end stereo information (reducing phase issues)</li>
        <li>Add high-frequency air only to the sides for width without harshness in the center</li>
        <li>Cut boxiness from the mids without affecting stereo width</li>
      </ul>

      <h2>4. Dynamic EQ Instead of Static Cuts</h2>
      <p>Static EQ cuts work well for consistent problems, but what about resonances that only appear on certain notes? Dynamic EQ only applies the cut when the problem frequency exceeds a threshold — giving you the correction when needed without dulling the sound when it's behaving.</p>
      <div class="tip-box"><strong>Plugin Pick:</strong> FabFilter Pro-Q 3's dynamic mode is industry-standard for this technique. Available on ProMix for ${getDiscountPct()}% off retail.</div>

      <h2>5. Reference Against Commercial Tracks</h2>
      <p>No EQ technique matters if you can't hear your mistakes. Build a habit of A/B referencing against commercial tracks in the same genre. Use a spectrum analyzer to see how your frequency balance compares — and adjust ruthlessly until your mix lives in the same ballpark.</p>
    `
  },
  {
    id: 'compression-guide',
    title: 'How to Use Compression Without Killing the Groove',
    excerpt: 'Over-compression is one of the most common rookie mistakes. Learn how to tame dynamics while keeping the life and energy in your tracks.',
    category: 'Mixing',
    tagColor: 'green',
    emoji: '🔊',
    author: 'Jordan Lee',
    authorInitial: 'JL',
    date: 'Mar 21, 2026',
    readTime: '6 min read',
    featured: false,
    content: `
      <p>Compression is a tool for controlling dynamics — not destroying them. The moment a compressor removes all the transient energy from a kick drum or squashes the life out of a vocal, you've gone too far. Here's how to compress with intention.</p>

      <h2>Understanding Attack and Release</h2>
      <p>Attack and release are the most misunderstood controls on a compressor. Fast attack kills transients (the initial punch). Slow attack lets them through. A fast release causes the compressor to "breathe" with the music (pumping). A slow release compresses more smoothly but can flatten dynamics.</p>
      <div class="tip-box"><strong>Rule of Thumb:</strong> Set attack slow to preserve the punch, then adjust release so the GR meter just recovers before the next transient.</div>

      <h2>Parallel Compression (New York Compression)</h2>
      <p>Parallel compression blends a heavily compressed version of your signal with the unprocessed original. The result: the punch and transients of the dry signal combined with the sustain and density of the compressed signal. Perfect for drums and vocals.</p>

      <h2>Ratio and Threshold: Less is More</h2>
      <p>Aim for 2–4 dB of gain reduction on most sources. If you're seeing 8–10 dB constantly, your threshold is too low. A 4:1 ratio is a good general starting point — use higher ratios (8:1+) only when you want a limiting effect.</p>

      <h2>Multi-Band Compression for Mastering</h2>
      <p>When mastering, multi-band compressors let you treat each frequency range independently. This is especially useful for controlling low-end buildup during loud passages without affecting the high-end clarity of quieter sections.</p>
    `
  },
  {
    id: 'reverb-masterclass',
    title: 'Parallel Reverb: The Secret to Lush, Professional Mixes',
    excerpt: 'Sending reverb to a return track instead of using insert effects gives you exact control over the wet/dry balance and saves CPU.',
    category: 'Mixing',
    tagColor: 'green',
    emoji: '🎵',
    author: 'Sam Torres',
    authorInitial: 'ST',
    date: 'Mar 14, 2026',
    readTime: '5 min read',
    featured: false,
    content: `
      <p>Every pro mix uses reverb. But there's a crucial difference between a reverb that sounds demo-quality and one that sounds like a $2000/day studio. The technique is simple: use parallel (send/return) routing, not insert effects.</p>

      <h2>Why Send/Return Routing?</h2>
      <p>When you use a reverb as a send effect, you run a copy of your signal through a 100% wet reverb and blend it back into the mix using your send level. This means:</p>
      <ul>
        <li>You control exactly how much reverb each track has with the send level</li>
        <li>Multiple tracks can share the same reverb instance (massive CPU saving)</li>
        <li>The dry signal always reaches the listener at full fidelity</li>
      </ul>

      <h2>Pre-Delay: The Most Important Reverb Parameter</h2>
      <p>Pre-delay adds a gap between the direct signal and the reverb tail. Even a small pre-delay of 15–30ms separates the dry and wet signal perceptually, keeping your mix articulate even with long reverb tails.</p>
      <div class="tip-box"><strong>Technique:</strong> Try tempo-syncing your pre-delay to an 1/8th or 1/16th note. This creates rhythmic space that feels musical rather than accidental.</div>

      <h2>Room, Hall, or Plate?</h2>
      <p>Room reverbs are short and early-reflection heavy — great for drums and guitar. Hall reverbs are long and smooth — perfect for strings and pads. Plate reverbs are bright and dense — the classic vocal reverb sound. Understanding these three types and choosing the right one for each element is half the battle.</p>
    `
  },
  {
    id: 'sidechain-pro',
    title: 'Sidechaining Like a Pro: Beyond the Basic Pump',
    excerpt: 'Sidechain compression is not just for EDM. Discover how top engineers use it for tightness, clarity, and creative groove effects.',
    category: 'Production',
    tagColor: 'orange',
    emoji: '⚡',
    author: 'Marcus Obi',
    authorInitial: 'MO',
    date: 'Mar 7, 2026',
    readTime: '7 min read',
    featured: false,
    content: `
      <p>Sidechain compression is one of those techniques that non-engineers hear as "that pumping EDM thing." But in professional mixing, it's a precision tool used subtly in almost every genre — from hip-hop to jazz.</p>

      <h2>The Fundamentals</h2>
      <p>Sidechain compression means using one audio signal (the sidechain input, usually the kick drum) to trigger compression on another signal (the bass, pads, or mix bus). Whenever the kick hits, it ducks the bass — creating a pumping pocket in the low end.</p>

      <h2>Ghost Sidechaining for Constant Pump</h2>
      <p>Don't want audible pumping but need the groove? Use a ghost sidechain — a silent kick pattern (muted in the mix) that triggers the compression. The listener never hears the trigger, but they feel the pulse.</p>

      <h2>Frequency-Specific Sidechaining</h2>
      <p>Using a multiband compressor on your bass, sidechained only in the low band (below 200 Hz), creates a subtle ducking effect that lets the kick punch through without audible pumping. This is a default technique on nearly every professional hip-hop and R&B mix.</p>

      <h2>Sidechain Reverb for Movement</h2>
      <p>Sidechain the reverb on your snare to duck when the snare hits — the reverb blooms as the snare decays, creating a natural, breathing effect. This keeps reverb from cluttering transients while still providing depth between beats.</p>
    `
  },
  {
    id: 'mastering-diy',
    title: 'Mastering Your Own Music: When to DIY and When to Hire',
    excerpt: 'Self-mastering is a viable option for many producers. But knowing when you need a dedicated mastering engineer can save your release.',
    category: 'Mastering',
    tagColor: 'blue',
    emoji: '💿',
    author: 'Alex Mercer',
    authorInitial: 'AM',
    date: 'Feb 28, 2026',
    readTime: '9 min read',
    featured: false,
    content: `
      <p>The mastering debate has never been more charged. With plugins like iZotope Ozone now offering AI-assisted mastering, self-mastering has never been more accessible. But it has real limitations. Here's an honest assessment.</p>

      <h2>When DIY Mastering Makes Sense</h2>
      <p>Self-mastering is appropriate when: you're releasing on streaming platforms only, you have a well-treated listening space, you have multiple hours before your deadline, and the mix is genuinely finished (mastering won't fix a bad mix).</p>

      <h2>The Loudness War: Target LUFS by Platform</h2>
      <p>Don't master to "as loud as possible." Master to target platform's integrated loudness: Spotify normalizes to -14 LUFS, Apple Music to -16 LUFS, YouTube to -14 LUFS. Mastering louder than these targets results in your track being turned down — all that limiting effort wasted.</p>
      <div class="tip-box"><strong>Recommended Chain:</strong> Subtle EQ → Multi-band compression → Stereo widening → Limiting to -1 dBTP true peak. Keep total gain reduction under 3 dB for natural results.</div>

      <h2>When to Hire a Professional</h2>
      <p>Hire a mastering engineer when: you're releasing physically (vinyl, CD), you have a full album that needs cohesion, your mix is subjective about the low end, or you have a specific sound or label requirement. A second set of trained ears on calibrated monitors in a treated room is irreplaceable.</p>
    `
  },
  {
    id: 'synth-programming',
    title: 'Synth Programming 101: From Init to Signature Sound',
    excerpt: 'Stop browsing presets and start programming. Understanding these core synthesis concepts unlocks every synth you will ever own.',
    category: 'Production',
    tagColor: 'orange',
    emoji: '🎹',
    author: 'Jordan Lee',
    authorInitial: 'JL',
    date: 'Feb 20, 2026',
    readTime: '10 min read',
    featured: false,
    content: `
      <p>Every preset you've ever loved started as an init patch. Understanding the signal chain of a synthesizer — oscillators → filter → amplifier, shaped by envelopes and LFOs — means you can recreate any sound you hear, in any synth you own.</p>

      <h2>The Basic Signal Chain</h2>
      <p>Sound starts at the oscillator (the source waveform), passes through a filter (subtractive tone shaping), then an amplifier (volume control), and finally hits any effects. Envelopes shape how these parameters change over time. LFOs add rhythmic modulation.</p>

      <h2>ADSR: The Shape of Every Sound</h2>
      <p>Attack is how long it takes the sound to reach full volume. Decay is the drop from peak to sustain level. Sustain is the held level (not a time value). Release is how long the sound fades after you release the key. Understanding this one concept unlocks 80% of sound design.</p>

      <h2>Filter Cutoff + Resonance</h2>
      <p>The filter cutoff determines which frequencies pass through. Resonance boosts the frequencies around the cutoff, creating that classic synth "growl." High resonance + envelope modulation on the filter = the classic analog sweep you hear on every vintage synth recording.</p>
    `
  },
];

let currentArticleId = null;

export function renderBlogPage() {
  const container = document.getElementById('page-content');
  currentArticleId = null;

  const searchParams = new URLSearchParams(window.location.search);
  const articleParam = searchParams.get('article');
  if (articleParam) {
    const article = ARTICLES.find(a => a.id === articleParam);
    if (article) {
      renderArticle(container, article);
      return;
    }
  }

  renderBlogList(container);
}

function renderBlogList(container) {
  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  container.innerHTML = `
    <div class="info-hero">
      <div class="container">
        <span class="info-hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Knowledge Base
        </span>
        <h1>Mixing &amp; Production Blog</h1>
        <p>Pro techniques, plugin tutorials, and industry insights — written by engineers who use these tools every day.</p>
      </div>
    </div>

    <div class="section">
      <div class="container">
        <!-- Category Filter -->
        <div class="faq-categories" id="blog-cats" style="margin-bottom: var(--space-2xl);">
          <button class="faq-cat-btn active" data-cat="all">All Articles</button>
          <button class="faq-cat-btn" data-cat="Mixing">🎚️ Mixing</button>
          <button class="faq-cat-btn" data-cat="Production">🎹 Production</button>
          <button class="faq-cat-btn" data-cat="Mastering">💿 Mastering</button>
        </div>

        <div class="blog-grid" id="blog-grid">
          ${featured ? `
          <article class="blog-card blog-featured-card" data-article="${featured.id}">
            <div class="blog-card-thumb-placeholder" style="background: linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,212,255,0.04));">${featured.emoji}</div>
            <div class="blog-card-body">
              <div class="blog-card-tags"><span class="blog-tag ${featured.tagColor}">${featured.category}</span><span class="blog-tag" style="background:rgba(255,255,255,0.05);color:var(--text-muted);border-color:var(--border-primary);">Featured</span></div>
              <h2 class="blog-card-title">${featured.title}</h2>
              <p class="blog-card-excerpt">${featured.excerpt}</p>
              <div class="blog-card-meta">
                <div class="blog-card-author">
                  <div class="blog-card-avatar">${featured.authorInitial}</div>
                  <span>${featured.author}</span>
                </div>
                <span>${featured.date} · ${featured.readTime}</span>
              </div>
            </div>
          </article>
          ` : ''}

          ${rest.map(article => `
          <article class="blog-card" data-article="${article.id}" data-category="${article.category}">
            <div class="blog-card-thumb-placeholder" style="background: linear-gradient(135deg, rgba(0,255,136,0.05), rgba(0,0,0,0.3));">${article.emoji}</div>
            <div class="blog-card-body">
              <div class="blog-card-tags"><span class="blog-tag ${article.tagColor}">${article.category}</span></div>
              <h3 class="blog-card-title">${article.title}</h3>
              <p class="blog-card-excerpt">${article.excerpt}</p>
              <div class="blog-card-meta">
                <div class="blog-card-author">
                  <div class="blog-card-avatar">${article.authorInitial}</div>
                  <span>${article.author}</span>
                </div>
                <span>${article.readTime}</span>
              </div>
            </div>
          </article>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Category filter
  document.getElementById('blog-cats')?.addEventListener('click', e => {
    const btn = e.target.closest('.faq-cat-btn');
    if (!btn) return;
    document.querySelectorAll('#blog-cats .faq-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    document.querySelectorAll('#blog-grid article[data-category]').forEach(card => {
      if (cat === 'all' || card.dataset.category === cat) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Article click
  document.querySelectorAll('[data-article]').forEach(card => {
    card.addEventListener('click', () => {
      const article = ARTICLES.find(a => a.id === card.dataset.article);
      if (article) renderArticle(document.getElementById('page-content'), article);
    });
  });
}

function renderArticle(container, article) {
  currentArticleId = article.id;
  container.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="blog-article animate-fade-in-up">
          <button class="blog-article-back" id="blog-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Blog
          </button>

          <div class="blog-article-header">
            <div class="blog-card-tags" style="margin-bottom: var(--space-md);">
              <span class="blog-tag ${article.tagColor}">${article.category}</span>
            </div>
            <h1>${article.title}</h1>
            <div class="blog-article-meta">
              <div class="blog-card-author">
                <div class="blog-card-avatar">${article.authorInitial}</div>
                <div>
                  <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);">${article.author}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);">ProMix Staff Engineer</div>
                </div>
              </div>
              <span style="font-size:var(--text-sm);color:var(--text-muted);">${article.date}</span>
              <span style="font-size:var(--text-sm);color:var(--text-muted);">${article.readTime}</span>
            </div>
          </div>

          <div style="font-size:72px;text-align:center;padding:var(--space-2xl);background:linear-gradient(135deg,rgba(0,255,136,0.05),rgba(0,212,255,0.03));border-radius:var(--radius-xl);border:1px solid var(--border-primary);margin-bottom:var(--space-2xl);">
            ${article.emoji}
          </div>

          <div class="blog-article-content">
            ${article.content}
          </div>

          <div style="margin-top:var(--space-3xl);padding:var(--space-xl);background:linear-gradient(135deg,rgba(0,255,136,0.06),rgba(0,212,255,0.03));border:1px solid rgba(0,255,136,0.15);border-radius:var(--radius-xl);text-align:center;">
            <h3 style="margin-bottom:var(--space-sm);">Get the plugins we use in this article</h3>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">All industry-standard plugins — ${getDiscountPct()}% off retail price.</p>
            <a href="/store" class="btn btn-primary">Browse Plugin Store →</a>
          </div>

          <div style="margin-top:var(--space-2xl);">
            <h3 style="margin-bottom:var(--space-lg);">More Articles</h3>
            <div class="blog-grid" style="grid-template-columns:repeat(2,1fr);">
              ${ARTICLES.filter(a => a.id !== article.id).slice(0,2).map(a => `
              <article class="blog-card" data-article="${a.id}" style="cursor:pointer;">
                <div class="blog-card-body">
                  <div class="blog-card-tags"><span class="blog-tag ${a.tagColor}">${a.category}</span></div>
                  <h4 class="blog-card-title" style="font-size:var(--text-base);">${a.title}</h4>
                  <div class="blog-card-meta" style="margin-top:var(--space-md);">
                    <span style="font-size:var(--text-xs);">${a.author}</span>
                    <span style="font-size:var(--text-xs);">${a.readTime}</span>
                  </div>
                </div>
              </article>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('blog-back')?.addEventListener('click', () => {
    renderBlogList(document.getElementById('page-content'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('[data-article]').forEach(card => {
    card.addEventListener('click', () => {
      const a = ARTICLES.find(x => x.id === card.dataset.article);
      if (a) {
        renderArticle(document.getElementById('page-content'), a);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}
