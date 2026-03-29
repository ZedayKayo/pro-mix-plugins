// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Supabase Data Seeder
// Run this file with: node seed.js
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables directly from .env file
const envPath = new URL('.env', import.meta.url).pathname;
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else {
  console.error("❌ Could not find .env file. Please make sure it exists.");
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file.");
  process.exit(1);
}

// Ensure the db is clean using a service key if possible, but anon key might not have delete rights if RLS is strict.
// Assuming RLS allows insert for now.
const supabase = createClient(supabaseUrl, supabaseKey);

// We need to import the data from the JS files.
// Because we are running this in Node, we can dynamically import the data.
import { allPlugins, bundlesDB } from './src/data/index.js';

function promixPrice(msrp) {
  return msrp ? Math.round(msrp * 0.3) : 0;
}

const productsToInsert = [];

// Prepare Plugins
for (const p of allPlugins) {
  const msrp = p.official_price_usd || 0;
  const sp = promixPrice(msrp);
  const eff = sp < msrp && msrp > 0 ? sp : msrp;

  productsToInsert.push({
    id: p.id,
    name: p.name,
    slug: p.id,
    developer: p.developer,
    brand: p.brand,
    category: 'utility', // Simplification for seeder
    subcategory: p.subcategory || 'Other',
    type: ['vst3', 'au'],
    daw_compat: ['fl-studio', 'ableton'],
    price: msrp,
    sale_price: msrp > 0 ? sp : null,
    crypto_prices: { BTC: +(eff/90000).toFixed(6), ETH: +(eff/3200).toFixed(5), USDT: eff },
    rating: 4.5 + Math.random() * 0.5,
    reviews: Math.floor(100 + Math.random() * 400),
    description: p.full_description || p.short_description || '',
    short_desc: p.short_description || '',
    features: p.key_features || [],
    specs: {},
    system_reqs: {},
    images: [p.image_url || '/images/placeholder.jpg'],
    audio_demo: null,
    video_demo: p.demo_video_url || null,
    product_page: p.official_product_page || '#',
    is_featured: false,
    is_trending: false,
    is_new: false,
    release_date: \`\${p.release_year || 2020}-01-01\`,
    version: p.latest_version || '1.0',
    color: '#00ff88',
    tags: p.tags || [],
    cpu_usage_level: p.cpu_usage_level || 'Medium'
  });
}

// Prepare Bundles
for (const b of bundlesDB) {
  const msrp = b.official_price_usd || 0;
  const sp = b.average_sale_price || promixPrice(msrp);

  productsToInsert.push({
    id: b.id,
    name: b.name,
    slug: b.id,
    developer: b.developer,
    brand: b.developer,
    category: 'bundle',
    subcategory: 'Bundle',
    type: ['vst3', 'au'],
    daw_compat: ['fl-studio', 'ableton'],
    price: msrp,
    sale_price: sp,
    crypto_prices: { BTC: +(sp/90000).toFixed(6), ETH: +(sp/3200).toFixed(5), USDT: sp },
    rating: 4.8 + Math.random() * 0.2,
    reviews: Math.floor(200 + Math.random() * 500),
    description: b.description || '',
    short_desc: \`\${b.total_plugins} Plugins Included\`,
    features: ['Includes all standard formats', \`Bundle of \${b.total_plugins} products\`, 'Lifetime license'],
    specs: {},
    system_reqs: {},
    images: [b.image_url || '/images/placeholder.jpg'],
    audio_demo: null,
    video_demo: null,
    product_page: '#',
    is_featured: true,
    is_trending: false,
    is_new: false,
    release_date: '2024-01-01',
    version: 'Latest',
    color: '#ff6b2b',
    tags: b.tags || [],
    cpu_usage_level: 'Medium'
  });
}

async function seed() {
  console.log(\`📦 Preparing to insert \${productsToInsert.length} products into Supabase...\`);
  
  // Insert in chunks of 50 to avoid payload limits
  const chunkSize = 50;
  for (let i = 0; i < productsToInsert.length; i += chunkSize) {
    const chunk = productsToInsert.slice(i, i + chunkSize);
    
    // Upsert so we can run this multiple times without duplication errors
    const { data, error } = await supabase
      .from('products')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(\`❌ Error inserting chunk \${i/chunkSize + 1}:\`, error.message);
    } else {
      console.log(\`✅ Successfully inserted chunk \${i/chunkSize + 1}/\${Math.ceil(productsToInsert.length/chunkSize)}\`);
    }
  }
  
  console.log("🎉 Seeding complete!");
}

seed();
