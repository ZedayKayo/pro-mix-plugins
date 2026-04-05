// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Product Data (Real DB Adapter)
// ═══════════════════════════════════════════════════════

import { allPlugins, bundlesDB } from './index.js';
import { applyDiscount } from '../services/discountService.js';

export const categories = [
  { id: 'bundle', name: 'Bundles', icon: '📦' },
  { id: 'eq', name: 'Equalizer', icon: '🎚️' },
  { id: 'compressor', name: 'Compressor', icon: '🔊' },
  { id: 'reverb', name: 'Reverb', icon: '🎵' },
  { id: 'delay', name: 'Delay', icon: '⏱️' },
  { id: 'synth', name: 'Synthesizer', icon: '🎹' },
  { id: 'distortion', name: 'Distortion/Sat', icon: '⚡' },
  { id: 'mastering', name: 'Mastering', icon: '💿' },
  { id: 'utility', name: 'Utility/Other', icon: '🔧' },
];

export const pluginTypes = [
  { id: 'vst3', name: 'VST3' },
  { id: 'au', name: 'AU' },
  { id: 'aax', name: 'AAX' },
];

export const dawList = [
  { id: 'fl-studio', name: 'FL Studio' },
  { id: 'ableton', name: 'Ableton Live' },
  { id: 'pro-tools', name: 'Pro Tools' },
  { id: 'logic', name: 'Logic Pro' },
  { id: 'cubase', name: 'Cubase' },
  { id: 'studio-one', name: 'Studio One' },
];

// ── Schema mappers ───────────────────────────────────
// Maps subcategory string from allPlugins → UI category id
const subcatMap = {
  // Effects
  'EQ': 'eq', 'Equalizer': 'eq',
  'Compressor': 'compressor',
  'Limiter': 'mastering',
  'Reverb': 'reverb',
  'Delay': 'delay',
  'Distortion': 'distortion',
  'Saturation': 'distortion',
  'Multiband Processor': 'mastering',
  'Stereo Imaging': 'utility',
  'Pitch Correction': 'utility',
  // Instruments
  'Synthesizer': 'synth',
  'Wavetable Synth': 'synth',
  'Subtractive Synth': 'synth',
  'Granular Synth': 'synth',
  'Sampler': 'synth',
  'Drum Sampler': 'synth',
  // Other
  'bundle': 'bundle',
  'Bundle': 'bundle'
};

// Maps top-level category from allPlugins → UI category id (fallback when subcatMap misses)
const catMap = {
  'Mixing Plugin': 'eq',
  'Creative Effect': 'distortion',
  'Mastering Plugin': 'mastering',
  'VST Instrument': 'synth',
  'Sampler': 'synth',
  'Drum Machine': 'synth',
  'Utility': 'utility',
  'bundle': 'bundle',
};

const fmtMap = { 'VST': 'vst', 'VST3': 'vst3', 'AU': 'au', 'AAX': 'aax' };
const dawMap = {
  'FL Studio': 'fl-studio', 'Ableton Live': 'ableton', 'Pro Tools': 'pro-tools',
  'Logic Pro': 'logic', 'Cubase': 'cubase', 'Studio One': 'studio-one',
};

// Editorial collections
const featuredIds = new Set([
  'fabfilter-pro-q3','izotope-ozone-11','xfer-serum',
  'spectrasonics-omnisphere-2','ni-kontakt-7','uhe-diva',
]);
const trendingIds = new Set([
  'xfer-serum','fabfilter-pro-q3','fabfilter-pro-l2','izotope-ozone-11',
  'valhalla-room','soundtoys-decapitator','arturia-pigments-4','ni-massive-x',
]);
const newIds = new Set([
  'fabfilter-pro-r2','izotope-rx-10','arturia-pigments-4',
  'baby-audio-ihny2','kilohearts-phase-plant','output-portal',
]);

// Pro-Mix dynamic discount (controlled from Admin Panel → Settings)
function promixPrice(msrp) {
  return applyDiscount(msrp);
}
function buildCryptoPrices(usd) {
  return { BTC: +(usd / 90000).toFixed(6), ETH: +(usd / 3200).toFixed(5), USDT: usd };
}

function adapt(p) {
  const msrp = p.official_price_usd || 0;
  const sp = promixPrice(msrp);
  const effectivePrice = sp < msrp && msrp > 0 ? sp : msrp;
  // Resolve UI category: subcategory first, then top-level category, then fallback
  const uiCategory = subcatMap[p.subcategory] || catMap[p.category] || 'utility';
  return {
    id: p.id,
    name: p.name,
    slug: p.id,
    developer: p.developer,
    brand: p.brand,
    category: uiCategory,
    subcategory: p.subcategory,
    type: (p.supported_formats || []).map(f => fmtMap[f]).filter(Boolean),
    dawCompat: (p.supported_daw || []).map(d => dawMap[d]).filter(Boolean),
    price: msrp,
    salePrice: msrp > 0 ? sp : null,
    cryptoPrices: buildCryptoPrices(effectivePrice || 1),
    rating: +(4.3 + Math.random() * 0.65).toFixed(1),
    reviews: 50 + Math.floor(Math.random() * 430),
    description: p.full_description || '',
    shortDesc: p.short_description || '',
    features: p.key_features || [],
    specs: {
      'Format': (p.supported_formats || []).join(', '),
      'OS': (p.supported_os || []).join(' / '),
      'CPU Usage': p.cpu_usage_level || '—',
      'Download': `${p.download_size_mb || 0} MB`,
      'Version': p.latest_version || '—',
    },
    systemReqs: {
      os: (p.system_requirements && p.system_requirements.os_versions) || 'Windows 10+ / macOS 10.14+',
      ram: (p.system_requirements && p.system_requirements.min_ram) || '4 GB',
      disk: `${p.download_size_mb || 0} MB`,
      cpu: (p.system_requirements && p.system_requirements.min_cpu) || 'Intel Core i5',
    },
    images: [
      p.image_url || 'https://placehold.co/400x400/1a1a2e/00ff88?text=' + encodeURIComponent(p.name || 'Plugin'),
    ],
    audioDemo: null,
    videoDemo: p.demo_video_url || null,
    productPage: p.official_product_page || '#',
    isFeatured: featuredIds.has(p.id),
    isTrending: trendingIds.has(p.id),
    isNew: newIds.has(p.id),
    releaseDate: `${p.release_year || 2020}-01-01`,
    version: p.latest_version || '1.0',
    color: '#00ff88',
    tags: p.tags || [],
    cpu_usage_level: p.cpu_usage_level || 'Medium',
  };
}

function adaptBundle(b) {
  const msrp = b.official_price_usd || 0;
  const sp = b.average_sale_price || promixPrice(msrp);
  return {
    id: b.id,
    name: b.name,
    slug: b.id,
    developer: b.developer,
    brand: b.developer,
    category: 'bundle',
    subcategory: 'Bundle',
    type: ['vst3', 'au', 'aax'],
    dawCompat: ['fl-studio', 'ableton', 'pro-tools', 'logic', 'cubase', 'studio-one'],
    price: msrp,
    salePrice: sp,
    cryptoPrices: buildCryptoPrices(sp || msrp),
    rating: +(4.5 + Math.random() * 0.5).toFixed(1),
    reviews: 100 + Math.floor(Math.random() * 500),
    description: b.description || '',
    shortDesc: `${b.total_plugins} Plugins Included`,
    features: ['Includes all standard formats', `Bundle of ${b.total_plugins} products`, 'Lifetime license'],
    specs: {
      'Format': 'VST3, AU, AAX',
      'OS': 'Windows 10+ / macOS 11+',
      'Contains': `${b.total_plugins} Plugins`
    },
    systemReqs: { os: 'Windows 10+ / macOS 11+', ram: '8 GB', disk: '10 GB', cpu: 'Intel i5 / Apple Silicon' },
    images: [b.image_url || '/images/placeholder.jpg', b.image_url || '/images/placeholder.jpg'],
    audioDemo: null,
    videoDemo: null,
    productPage: '#',
    isFeatured: true,
    isTrending: b.id.includes('fabfilter') || b.id.includes('izotope'),
    isNew: false,
    releaseDate: '2024-01-01',
    version: 'Latest',
    color: '#ff6b2b',
    tags: b.tags || [],
  };
}

import { getInventory } from '../core/store.js';

// The "products" array in this file was previously used everywhere.
// Now, we provide a getter function to access the live unified database state.
export function getProducts() {
  return getInventory();
}

export function getBrandList() {
  return [...new Set(getProducts().filter(p => p.category !== 'bundle').map(p => p.brand))].sort();
}

// ── Public API (unchanged interface) ────────────────
// ── Public API ────────────────
export function getProductBySlug(slug) {
  return getProducts().find(p => p.slug === slug || p.id === slug) || null;
}
export function getFeaturedProducts() { return getProducts().filter(p => p.isFeatured); }
export function getTrendingProducts() { return getProducts().filter(p => p.isTrending); }
export function getNewProducts() { return getProducts().filter(p => p.isNew); }
export function getProductsByCategory(cat) { return getProducts().filter(p => p.category === cat); }

export function filterProducts({ category, brand, type, daw, priceRange, search, sort } = {}) {
  let r = getProducts();
  if (category && category.length) r = r.filter(p => category.includes(p.category));
  if (brand && brand.length) r = r.filter(p => brand.includes(p.brand));
  if (type && type.length) r = r.filter(p => p.type.some(t => type.includes(t)));
  if (daw && daw.length) r = r.filter(p => p.dawCompat.some(d => daw.includes(d)));
  if (priceRange) {
    const eff = p => p.salePrice != null ? p.salePrice : p.price;
    r = r.filter(p => eff(p) >= priceRange[0] && eff(p) <= priceRange[1]);
  }
  if (search) {
    const q = search.toLowerCase();
    r = r.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.developer || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.includes(q))
    );
  }
  if (sort === 'price-asc') r.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  if (sort === 'price-desc') r.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  if (sort === 'rating') r.sort((a, b) => b.rating - a.rating);
  if (sort === 'newest') r.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  if (sort === 'name') r.sort((a, b) => a.name.localeCompare(b.name));

  // Default hoisting: always show bundles at the very top of the grid.
  r.sort((a, b) => {
    if (a.category === 'bundle' && b.category !== 'bundle') return -1;
    if (b.category === 'bundle' && a.category !== 'bundle') return 1;
    return 0;
  });

  return r;
}
