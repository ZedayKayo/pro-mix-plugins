import { supabase } from '../lib/supabase.js';

// FETCH Products
export const fetchProducts = async (page = 1, pageSize = 100) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  
  // Convert snake_case db columns back to camelCase used in the frontend
  return data.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    developer: p.developer,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    type: p.type || [],
    dawCompat: p.daw_compat || [],
    price: p.price,
    salePrice: p.sale_price,
    cryptoPrices: p.crypto_prices || {},
    rating: p.rating,
    reviews: p.reviews,
    description: p.description,
    shortDesc: p.short_desc,
    features: p.features || [],
    specs: p.specs || {},
    systemReqs: p.system_reqs || {},
    images: p.images || [],
    audioDemo: p.audio_demo,
    videoDemo: p.video_demo,
    productPage: p.product_page,
    isFeatured: p.is_featured,
    isTrending: p.is_trending,
    isNew: p.is_new,
    releaseDate: p.release_date,
    version: p.version,
    color: p.color,
    tags: p.tags || [],
    cpu_usage_level: p.cpu_usage_level,
  }));
};

// INSERT Product
export const insertProduct = async (product) => {
  const dbProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    developer: product.developer,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    type: product.type,
    daw_compat: product.dawCompat,
    price: product.price,
    sale_price: product.salePrice,
    crypto_prices: product.cryptoPrices,
    rating: product.rating,
    reviews: product.reviews,
    description: product.description,
    short_desc: product.shortDesc,
    features: product.features,
    specs: product.specs,
    system_reqs: product.systemReqs,
    images: product.images,
    audio_demo: product.audioDemo,
    video_demo: product.videoDemo,
    product_page: product.productPage,
    is_featured: product.isFeatured,
    is_trending: product.isTrending,
    is_new: product.isNew,
    release_date: product.releaseDate,
    version: product.version,
    color: product.color,
    tags: product.tags,
    cpu_usage_level: product.cpu_usage_level,
  };

  const { data, error } = await supabase
    .from('products')
    .insert([dbProduct])
    .select();

  if (error) {
    console.error("Error inserting product:", error);
    throw error;
  }
  return data[0];
};

// UPDATE Product
export const updateProduct = async (product) => {
  const dbProduct = {
    name: product.name,
    slug: product.slug,
    developer: product.developer,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    type: product.type,
    daw_compat: product.dawCompat,
    price: product.price,
    sale_price: product.salePrice,
    crypto_prices: product.cryptoPrices,
    rating: product.rating,
    reviews: product.reviews,
    description: product.description,
    short_desc: product.shortDesc,
    features: product.features,
    specs: product.specs,
    system_reqs: product.systemReqs,
    images: product.images,
    audio_demo: product.audioDemo,
    video_demo: product.videoDemo,
    product_page: product.productPage,
    is_featured: product.isFeatured,
    is_trending: product.isTrending,
    is_new: product.isNew,
    release_date: product.releaseDate,
    version: product.version,
    color: product.color,
    tags: product.tags,
    cpu_usage_level: product.cpu_usage_level,
  };

  const { data, error } = await supabase
    .from('products')
    .update(dbProduct)
    .eq('id', product.id)
    .select();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }
  return data[0];
};

// DELETE Product
export const removeProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// DELETE ALL Products (clear entire inventory)
export const clearAllProducts = async () => {
  // Supabase requires a filter for bulk deletes — "id is not null" covers every row
  const { error } = await supabase
    .from('products')
    .delete()
    .not('id', 'is', null);

  if (error) {
    console.error("Error clearing all products:", error);
    throw error;
  }
};
