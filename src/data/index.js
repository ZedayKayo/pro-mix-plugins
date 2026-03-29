// ═══════════════════════════════════════════
// PRO-MIX PLUGINS — Master Data Index
// Merges all plugin data and provides unified API
// ═══════════════════════════════════════════

import { pluginsDB } from './products-db.js';
import { pluginsDB_part2 } from './products-db-part2.js';
import { bundlesDB, comparisonsDB } from './bundles-db.js';

// Merge all plugins into a single flat array
export const allPlugins = [...pluginsDB, ...pluginsDB_part2];

// Re-export bundles and comparisons
export { bundlesDB, comparisonsDB };

// ── Lookup helpers ──────────────────────────

export function getPluginById(id) {
  return allPlugins.find(p => p.id === id) || null;
}

export function getPluginsByBrand(brand) {
  return allPlugins.filter(p => p.brand === brand);
}

export function getPluginsByCategory(category) {
  return allPlugins.filter(p => p.category === category);
}

export function getPluginsBySubcategory(sub) {
  return allPlugins.filter(p => p.subcategory === sub);
}

export function searchPlugins(query) {
  const q = query.toLowerCase();
  return allPlugins.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.developer.toLowerCase().includes(q) ||
    p.short_description.toLowerCase().includes(q) ||
    (p.tags && p.tags.some(t => t.includes(q)))
  );
}

export function filterPlugins({ category, subcategory, brand, maxPrice, daw, search, sort } = {}) {
  let results = [...allPlugins];
  if (category && category.length) results = results.filter(p => category.includes(p.category));
  if (subcategory && subcategory.length) results = results.filter(p => subcategory.includes(p.subcategory));
  if (brand && brand.length) results = results.filter(p => brand.includes(p.brand));
  if (maxPrice !== undefined) results = results.filter(p => p.average_sale_price <= maxPrice);
  if (daw && daw.length) results = results.filter(p => daw.some(d => p.supported_daw.includes(d)));
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.developer.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.includes(q)))
    );
  }
  if (sort) {
    if (sort === 'price-asc') results.sort((a, b) => a.average_sale_price - b.average_sale_price);
    if (sort === 'price-desc') results.sort((a, b) => b.average_sale_price - a.average_sale_price);
    if (sort === 'newest') results.sort((a, b) => b.release_year - a.release_year);
    if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
  }
  return results;
}

export function getComparisonBySlug(slug) {
  return comparisonsDB.find(c => c.slug === slug) || null;
}

export function getBundleById(id) {
  return bundlesDB.find(b => b.id === id) || null;
}

// ── Metadata lists ──────────────────────────

export const allBrands = [...new Set(allPlugins.map(p => p.brand))].sort();
export const allCategories = [...new Set(allPlugins.map(p => p.category))];
export const allSubcategories = [...new Set(allPlugins.map(p => p.subcategory))];
export const allFormats = ['VST', 'VST3', 'AU', 'AAX'];
export const allDAWs = ['FL Studio', 'Ableton Live', 'Logic Pro', 'Cubase', 'Studio One', 'Pro Tools'];
