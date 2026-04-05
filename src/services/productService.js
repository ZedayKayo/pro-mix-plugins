import { supabase } from '../lib/supabase.js';

// ─────────────────────────────────────────────────────────────────────────────
// READ  — direct Supabase (anon key is fine; products are publicly readable)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchProducts = async (page = 1, pageSize = 100) => {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Convert snake_case DB columns → camelCase used by the frontend
  return data.map(p => ({
    id:            p.id,
    name:          p.name,
    slug:          p.slug,
    developer:     p.developer,
    brand:         p.brand,
    category:      p.category,
    subcategory:   p.subcategory,
    type:          p.type || [],
    dawCompat:     p.daw_compat || [],
    price:         p.price,
    salePrice:     p.sale_price,
    cryptoPrices:  p.crypto_prices || {},
    rating:        p.rating,
    reviews:       p.reviews,
    description:   p.description,
    shortDesc:     p.short_desc,
    features:      p.features || [],
    specs:         p.specs || {},
    systemReqs:    p.system_reqs || {},
    images:        p.images || [],
    audioDemo:     p.audio_demo,
    videoDemo:     p.video_demo,
    productPage:   p.product_page,
    isFeatured:    p.is_featured,
    isTrending:    p.is_trending,
    isNew:         p.is_new,
    releaseDate:   p.release_date,
    version:       p.version,
    color:         p.color,
    tags:          p.tags || [],
    cpu_usage_level: p.cpu_usage_level,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITES — go through /api/admin-product (service role key, bypasses RLS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Central fetch helper for all admin product mutations.
 * Throws a descriptive Error on any failure so callers can show a real message.
 */
async function adminProductAPI(body) {
  const res = await fetch('/api/admin-product', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.error || json.hint || `HTTP ${res.status}`;
    console.error('🔴 admin-product API error:', json);
    throw new Error(msg);
  }

  return json;
}

// INSERT
export const insertProduct = async (product) => {
  await adminProductAPI({ action: 'insert', product });
};

// UPDATE
export const updateProduct = async (product) => {
  await adminProductAPI({ action: 'update', product });
};

// DELETE
export const removeProduct = async (id) => {
  await adminProductAPI({ action: 'delete', id });
};

// BULK INSERT
export const bulkInsertProducts = async (products) => {
  await adminProductAPI({ action: 'bulk-insert', products });
};

// DELETE ALL
export const clearAllProducts = async () => {
  await adminProductAPI({ action: 'clear-all' });
};
