// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Utility Helpers
// ═══════════════════════════════════════════════════════

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function sanitizeHTML(str) {
  if (typeof str !== 'string' || !str) return str || '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export function formatCrypto(amount, symbol) {
  if (symbol === 'USDT') return `${amount.toFixed(2)} USDT`;
  if (symbol === 'BTC') return `${amount.toFixed(6)} BTC`;
  if (symbol === 'ETH') return `${amount.toFixed(4)} ETH`;
  return `${amount} ${symbol}`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'innerHTML') {
      el.innerHTML = val;
    } else if (key === 'textContent') {
      el.textContent = val;
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(val)) {
        el.dataset[dk] = dv;
      }
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

export function renderStars(rating, maxStars = 5) {
  let html = '';
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(rating)) {
      html += '★';
    } else if (i - 0.5 <= rating) {
      html += '★'; // half star rendered as full for simplicity
    } else {
      html += '<span class="empty">★</span>';
    }
  }
  return html;
}

export function truncate(str, len = 80) {
  if (str.length <= len) return str;
  return str.slice(0, len).trim() + '…';
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function getCategoryName(categoryId) {
  const map = {
    eq: 'Equalizer', compressor: 'Compressor', reverb: 'Reverb',
    delay: 'Delay', synth: 'Synthesizer', distortion: 'Distortion',
    mastering: 'Mastering', utility: 'Utility',
  };
  return map[categoryId] || categoryId;
}

export function getPluginImage(product, index = 0) {
  // First priority: use the real image from the product
  let realImg = null;
  if (Array.isArray(product.images)) {
    realImg = product.images[index || 0];
  } else if (typeof product.images === 'string') {
    try {
      const arr = JSON.parse(product.images);
      realImg = Array.isArray(arr) ? arr[index || 0] : product.images;
    } catch(e) {
      realImg = product.images; // fallback: assume it's just a single URL string
    }
  }

  if (realImg && realImg !== '/images/placeholder.jpg') {
    return realImg;
  }

  // Fallback: branded SVG placeholder (only when no real image)
  const colors = {
    '#00ff88': ['#00ff88', '#00cc6a'],
    '#ff6b2b': ['#ff6b2b', '#ff8f5e'],
    '#00d4ff': ['#00d4ff', '#0090cc'],
    '#a855f7': ['#a855f7', '#7c3aed'],
    '#ff3b5c': ['#ff3b5c', '#e11d48'],
  };
  const [c1, c2] = colors[product.color] || ['#00ff88', '#00cc6a'];
  const name = (product.name || 'Plugin').replace(/[<>&"]/g, '');
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#12121a"/>
          <stop offset="100%" style="stop-color:#1a1a28"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${c1}"/>
          <stop offset="100%" style="stop-color:${c2}"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <circle cx="200" cy="130" r="50" fill="url(#accent)" opacity="0.15" filter="url(#glow)"/>
      <rect x="120" y="80" width="160" height="100" rx="12" fill="none" stroke="url(#accent)" stroke-width="1.5" opacity="0.4"/>
      <rect x="140" y="100" width="30" height="40" rx="4" fill="url(#accent)" opacity="0.25"/>
      <rect x="178" y="95" width="30" height="50" rx="4" fill="url(#accent)" opacity="0.35"/>
      <rect x="216" y="105" width="30" height="35" rx="4" fill="url(#accent)" opacity="0.2"/>
      <circle cx="155" cy="160" r="8" fill="none" stroke="url(#accent)" stroke-width="1.5" opacity="0.5"/>
      <circle cx="193" cy="160" r="8" fill="none" stroke="url(#accent)" stroke-width="1.5" opacity="0.5"/>
      <circle cx="231" cy="160" r="8" fill="none" stroke="url(#accent)" stroke-width="1.5" opacity="0.5"/>
      <text x="200" y="230" text-anchor="middle" fill="${c1}" font-family="sans-serif" font-size="16" font-weight="600" opacity="0.9">${name}</text>
      <text x="200" y="255" text-anchor="middle" fill="#6a6a82" font-family="sans-serif" font-size="11">PRO-MIX PLUGINS</text>
    </svg>
  `)}`;
}

