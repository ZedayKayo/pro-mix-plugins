// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Admin Write API
// Handles all admin mutations using the service role key.
// Bypasses RLS entirely — no silent hangs, no GRANT issues.
//
// POST /api/admin-product
//   { action: 'insert',                product: {...} }
//   { action: 'update',                product: {...} }
//   { action: 'delete',                id: '...' }
//   { action: 'bulk-insert',           products: [...] }
//   { action: 'clear-all' }
//   { action: 'save-discount',         pct: 70 }
//   { action: 'bulk-update-prices',    pct: 70 }
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toDbRow(product) {
  return {
    id:              product.id,
    name:            product.name,
    slug:            product.slug,
    developer:       product.developer,
    brand:           product.brand,
    category:        product.category,
    subcategory:     product.subcategory,
    type:            product.type,
    daw_compat:      product.dawCompat,
    price:           product.price,
    sale_price:      product.salePrice,
    crypto_prices:   product.cryptoPrices,
    rating:          product.rating,
    reviews:         product.reviews,
    description:     product.description,
    short_desc:      product.shortDesc,
    features:        product.features,
    specs:           product.specs,
    system_reqs:     product.systemReqs,
    images:          product.images,
    audio_demo:      product.audioDemo,
    video_demo:      product.videoDemo,
    product_page:    product.productPage,
    is_featured:     product.isFeatured,
    is_trending:     product.isTrending,
    is_new:          product.isNew,
    release_date:    product.releaseDate,
    version:         product.version,
    color:           product.color,
    tags:            product.tags,
    cpu_usage_level: product.cpu_usage_level,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, product, products, id, pct } = req.body;

  try {

    // ── INSERT ────────────────────────────────────────────
    if (action === 'insert') {
      const { error } = await supabase.from('products').insert([toDbRow(product)]);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── UPDATE ────────────────────────────────────────────
    if (action === 'update') {
      const { id: _id, ...rest } = toDbRow(product);
      const { error } = await supabase
        .from('products').update(rest).eq('id', product.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── DELETE ────────────────────────────────────────────
    if (action === 'delete') {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── BULK INSERT ───────────────────────────────────────
    if (action === 'bulk-insert') {
      const rows = products.map(toDbRow);
      const { error } = await supabase.from('products').insert(rows);
      if (error) throw error;
      return res.status(200).json({ ok: true, count: rows.length });
    }

    // ── CLEAR ALL ─────────────────────────────────────────
    if (action === 'clear-all') {
      const { error } = await supabase
        .from('products').delete().not('id', 'is', null);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── SAVE DISCOUNT % ───────────────────────────────────
    if (action === 'save-discount') {
      const clamped = Math.max(1, Math.min(99, Math.round(pct)));
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 1, discount_pct: clamped, updated_at: new Date().toISOString() });
      if (error) throw error;
      return res.status(200).json({ ok: true, pct: clamped });
    }

    // ── BULK UPDATE SALE PRICES ───────────────────────────
    if (action === 'bulk-update-prices') {
      const clamped = Math.max(1, Math.min(99, Math.round(pct)));
      const mult = (100 - clamped) / 100;

      const { data: allProducts, error: fetchErr } = await supabase
        .from('products').select('id, price');
      if (fetchErr) throw fetchErr;
      if (!allProducts || allProducts.length === 0) {
        return res.status(200).json({ ok: true, updated: 0 });
      }

      const updates = allProducts
        .filter(p => p.price && p.price > 0)
        .map(p => ({ id: p.id, sale_price: Math.round(p.price * mult) }));

      if (updates.length > 0) {
        const { error: upsertErr } = await supabase
          .from('products').upsert(updates, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      }

      return res.status(200).json({ ok: true, updated: updates.length });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('[admin-product] Error:', action, err.message, err.code);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code:  err.code,
      hint:  err.hint,
    });
  }
}
