// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Admin Panel
// ═══════════════════════════════════════════════════════

import { getInventory, saveProduct, deleteProduct, loadInventory, on } from '../core/store.js';
import { getBrandList, categories } from '../data/products.js';
import { formatPrice, sanitizeHTML } from '../core/utils.js';
import { showToast } from '../components/Toast.js';
import { autoFillPluginData } from '../services/aiService.js';
import { clearAllProducts } from '../services/productService.js';

export function renderAdminPanel(params) {
  const container = document.getElementById('page-content');
  
  const state = {
    products: getInventory(),
    search: '',
    editingProduct: null,
  };

  // ── Modal: lives on document.body so re-renders can't destroy it ──
  function ensureModal() {
    let existing = document.getElementById('product-modal');
    if (existing) existing.remove(); // Fix Stale Closure bug to prevent editing duplicates

    const modalEl = document.createElement('div');
    modalEl.id = 'product-modal';
    modalEl.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; align-items:center; justify-content:center;';
    modalEl.innerHTML = `
      <div class="modal-content glass-panel" style="width:100%; max-width:620px; border-radius:var(--radius-lg); max-height:90vh; display:flex; flex-direction:column; margin:auto; overflow:hidden; position:relative;">
        
        <!-- HEADER (Fixed) -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-xl); border-bottom:1px solid var(--border-primary); background:var(--bg-card); z-index:10; flex-shrink:0;">
          <h2 id="modal-title" style="margin:0;">Add Product</h2>
          <button type="button" id="modal-close-x" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; line-height:1;">✕</button>
        </div>

        <form id="product-form" style="display:flex; flex-direction:column; overflow:hidden; flex:1; min-height:0;">
          
          <!-- BODY (Scrollable) -->
          <div style="padding:var(--space-lg) var(--space-xl); overflow-y:auto; flex:1;">
            
            <!-- QUICK FILL UI -->
            <div style="background:rgba(0,255,136,0.07); padding:var(--space-md); border-radius:var(--radius-md); margin-bottom:var(--space-lg); border:1px solid rgba(0,255,136,0.2);">
              <label class="text-sm" style="color:var(--neon-green); font-weight:600; display:block; margin-bottom:var(--space-xs);">🪄 Quick Fill — AI Auto-Fill</label>
              <p class="text-xs text-secondary" style="margin:0 0 var(--space-xs) 0;">Paste a plugin name, any product URL, or a <strong style="color:var(--neon-blue);">RuTracker link</strong> — AI will extract &amp; translate all data automatically.</p>
              <div style="display:flex; gap:var(--space-sm);">
                <input type="text" class="input" id="f-quick-fill" placeholder="e.g. FabFilter Pro-Q 3  —or—  https://rutracker.org/forum/viewtopic.php?t=..." style="flex:1;" />
                <button type="button" class="btn btn-primary" id="btn-quick-fill" style="white-space:nowrap;">✨ Auto-Fill</button>
              </div>
              <div id="quick-fill-status" class="text-sm" style="margin-top:6px; display:none;"></div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); margin-bottom:var(--space-md);">
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Product Name *</label>
                <input type="text" class="input" id="f-name" required />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Brand *</label>
                <input type="text" class="input" id="f-brand" required list="brand-options" />
                <datalist id="brand-options">
                  ${getBrandList().map(b => `<option value="${b}">`).join('')}
                </datalist>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Developer</label>
                <input type="text" class="input" id="f-dev" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Category *</label>
                <select class="input" id="f-category" required>
                  ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Subcategory</label>
                <input type="text" class="input" id="f-subcat" placeholder="e.g. Wavetable Synth" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Formats (comma-separated)</label>
                <input type="text" class="input" id="f-type" placeholder="vst3, au, aax" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">DAWs (comma-separated)</label>
                <input type="text" class="input" id="f-daw" placeholder="fl-studio, ableton, logic" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Image URLs (one per line) *</label>
                <textarea class="input" id="f-image" rows="3" placeholder="https://image1.jpg\\nhttps://image2.jpg" required></textarea>
                <div style="margin-top: 4px;">
                  <label for="f-image-upload" style="cursor: pointer; color: var(--neon-blue); font-size: 0.8em; text-decoration: underline;">Or upload multiple image files</label>
                  <input type="file" id="f-image-upload" accept="image/*" multiple style="display: none;" />
                </div>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Video Demo URL</label>
                <input type="url" class="input" id="f-video" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Product Page URL</label>
                <input type="url" class="input" id="f-url" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Source/RuTracker URL</label>
                <input type="url" class="input" id="f-sourceurl" placeholder="https://rutracker.org/..." />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">MSRP (Original Price $) *</label>
                <input type="number" class="input" id="f-price" min="0" step="0.01" required />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Sale Price (-70%) *</label>
                <input type="number" class="input" id="f-saleprice" min="0" step="0.01" required />
              </div>
            </div>
            
            <div style="margin-bottom:var(--space-md);">
              <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Short Description *</label>
              <textarea class="input" id="f-desc" rows="2" required></textarea>
            </div>

            <div style="margin-bottom:var(--space-md);">
              <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Full Description</label>
              <textarea class="input" id="f-fulldesc" rows="4"></textarea>
            </div>

            <div style="margin-bottom:var(--space-md);">
              <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Key Features (one per line)</label>
              <textarea class="input" id="f-features" rows="3" placeholder="- Feature 1\\n- Feature 2"></textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); padding:var(--space-md); background:rgba(255,255,255,0.02); border-radius:var(--radius-md); margin-bottom:var(--space-md);">
              <div>
                <label class="text-sm" style="display:block; margin-bottom:8px; font-weight:bold;">Specs</label>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <input type="text" class="input input-sm" id="f-spec-format" placeholder="Format (e.g. VST3, AU, AAX)" />
                  <input type="text" class="input input-sm" id="f-spec-os" placeholder="OS (e.g. Windows 10+ / macOS 11+)" />
                  <input type="text" class="input input-sm" id="f-spec-cpu" placeholder="CPU Usage (e.g. Low, Medium, High)" />
                  <input type="text" class="input input-sm" id="f-spec-dl" placeholder="Download Size (e.g. 1.2 GB)" />
                  <input type="text" class="input input-sm" id="f-spec-ver" placeholder="Version (e.g. 1.5.0)" />
                </div>
              </div>
              <div>
                <label class="text-sm" style="display:block; margin-bottom:8px; font-weight:bold;">System Reqs</label>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <input type="text" class="input input-sm" id="f-req-os" placeholder="Min OS" />
                  <input type="text" class="input input-sm" id="f-req-ram" placeholder="Min RAM (e.g. 4 GB)" />
                  <input type="text" class="input input-sm" id="f-req-cpu" placeholder="Min CPU" />
                  <input type="text" class="input input-sm" id="f-req-disk" placeholder="Disk Space" />
                </div>
              </div>
            </div>

            <!-- SECURE DOWNLOAD LINKS -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); padding:var(--space-md); background:rgba(255,100,100,0.05); border-radius:var(--radius-md); border:1px solid rgba(255,100,100,0.2); margin-bottom:var(--space-md);">
              <div style="grid-column: span 2;">
                <h4 style="margin:0 0 8px 0; color:#ff6b2b;">Secure Download Files (Private)</h4>
                <p class="text-xs text-secondary" style="margin-bottom:12px;">These paths will only be exposed to users holding a valid license.</p>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Windows (.exe / .zip)</label>
                <input type="text" class="input" id="f-dl-win" placeholder="Private bucket path or URL" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">macOS (.dmg / .pkg)</label>
                <input type="text" class="input" id="f-dl-mac" placeholder="Private bucket path or URL" />
              </div>
            </div>

            <div style="display:flex; gap:var(--space-lg); padding:var(--space-sm) 0;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-isfeatured" /> <span style="color:var(--neon-purple);">★ Featured</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-istrending" /> <span style="color:var(--neon-blue);">🔥 Trending</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-isnew" /> <span style="color:var(--neon-green);">✨ New</span>
              </label>
            </div>
            
          </div>

          <!-- FOOTER (Fixed) -->
          <div style="padding:var(--space-md) var(--space-xl); border-top:1px solid var(--border-primary); background:var(--bg-card); display:flex; gap:var(--space-sm); justify-content:flex-end; z-index:10; flex-shrink:0;">
            <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="modal-submit">💾 Save Product</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modalEl);

    // ── ALL modal events attached ONCE here — they read `state` at event time ──

    // Close X button
    modalEl.querySelector('#modal-close-x')?.addEventListener('click', closeModal);

    // Cancel button
    modalEl.querySelector('#modal-cancel')?.addEventListener('click', closeModal);

    // MSRP → auto-calc sale price
    modalEl.querySelector('#f-price')?.addEventListener('input', (e) => {
      const msrp = parseFloat(e.target.value);
      if (!isNaN(msrp)) {
        document.getElementById('f-saleprice').value = (msrp * 0.3).toFixed(2);
      }
    });

    // Image Upload Logic (Base64) - Compresses images before storing
    modalEl.querySelector('#f-image-upload')?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      
      const compressImage = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800; // max width/height to drastically reduce Base64 size
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else if (height > width && height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // WebP preserves alpha transparency (unlike JPEG) and compresses beautifully
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.85)); 
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });

      const btn = document.getElementById('modal-submit');
      const ogText = btn.textContent;
      try {
        btn.disabled = true;
        btn.textContent = '⏳ Optimizing Images...';
        
        const base64Strings = await Promise.all(files.map(compressImage));
        
        const el = document.getElementById('f-image');
        const cur = el.value.trim();
        
        // Append new strings to the bottom of the list
        const newLines = base64Strings.join('\n');
        el.value = cur ? cur + '\n' + newLines : newLines;
        
      } catch (err) {
        showToast('❌ Failed to process images.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = ogText;
        e.target.value = ''; // Reset input
      }
    });

    // Quick Fill — AI auto-fill
    modalEl.querySelector('#btn-quick-fill')?.addEventListener('click', async () => {
      const inputVal = document.getElementById('f-quick-fill').value.trim();
      if (!inputVal) { showToast('Enter a plugin name or URL first', 'error'); return; }
      const statusEl = document.getElementById('quick-fill-status');
      const btn = document.getElementById('btn-quick-fill');
      try {
        btn.disabled = true; btn.textContent = '⏳ Loading...';
        statusEl.style.display = 'block';
        const isRuTracker = inputVal.includes('rutracker.org');
        statusEl.textContent = isRuTracker
          ? '🌐 Fetching RuTracker page & translating from Russian...'
          : '🤖 AI is analyzing...';
        statusEl.style.color = 'var(--neon-blue)';
        const data = await autoFillPluginData(inputVal);
        if (data.name) document.getElementById('f-name').value = data.name;
        if (data.brand) document.getElementById('f-brand').value = data.brand;
        if (data.developer) document.getElementById('f-dev').value = data.developer;
        if (data.category && document.querySelector(`#f-category option[value="${data.category}"]`)) {
          document.getElementById('f-category').value = data.category;
        }
        if (data.subcategory) document.getElementById('f-subcat').value = data.subcategory;
        if (data.type) document.getElementById('f-type').value = data.type.join(', ');
        if (data.dawCompat) document.getElementById('f-daw').value = data.dawCompat.join(', ');
        if (data.images && Array.isArray(data.images)) {
          document.getElementById('f-image').value = data.images.join('\n');
        } else if (data.image) { // Fallback to old format
          document.getElementById('f-image').value = data.image;
        }
        if (data.videoDemo) document.getElementById('f-video').value = data.videoDemo;
        if (data.productPage) document.getElementById('f-url').value = data.productPage;
        if (inputVal.startsWith('http')) document.getElementById('f-sourceurl').value = inputVal;
        
        if (data.price) {
          document.getElementById('f-price').value = data.price;
          document.getElementById('f-saleprice').value = (data.price * 0.3).toFixed(2);
        }
        if (data.shortDesc) document.getElementById('f-desc').value = data.shortDesc;
        if (data.description) document.getElementById('f-fulldesc').value = data.description;
        if (data.features) document.getElementById('f-features').value = data.features.map(f => '- ' + f).join('\n');
        
        if (data.specs) {
          document.getElementById('f-spec-format').value = data.specs.Format || '';
          document.getElementById('f-spec-os').value = data.specs.OS || '';
          document.getElementById('f-spec-cpu').value = data.specs['CPU Usage'] || '';
          document.getElementById('f-spec-dl').value = data.specs.Download || '';
          document.getElementById('f-spec-ver').value = data.specs.Version || '';
          if (data.specs.download_win) document.getElementById('f-dl-win').value = data.specs.download_win;
          if (data.specs.download_mac) document.getElementById('f-dl-mac').value = data.specs.download_mac;
        }
        if (data.systemReqs) {
          document.getElementById('f-req-os').value = data.systemReqs.os || '';
          document.getElementById('f-req-ram').value = data.systemReqs.ram || '';
          document.getElementById('f-req-cpu').value = data.systemReqs.cpu || '';
          document.getElementById('f-req-disk').value = data.systemReqs.disk || '';
        }

        statusEl.textContent = '✅ Done! Review and save.'; statusEl.style.color = 'var(--neon-green)';
        showToast('Data extracted!', 'success');
      } catch (err) {
        statusEl.textContent = '❌ ' + err.message; statusEl.style.color = '#ff4444';
        showToast('Auto-fill failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '✨ Auto-Fill';
      }
    });

    // Form submit — single listener, reads state at submission time
    modalEl.querySelector('#product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();

      const isEditing = !!state.editingProduct;
      const newId = isEditing ? state.editingProduct.id : 'custom-' + Date.now();
      const msrp = parseFloat(document.getElementById('f-price').value) || 0;
      const sp = parseFloat(document.getElementById('f-saleprice').value) || 0;
      
      const imgRaw = document.getElementById('f-image').value.trim();
      const imageList = imgRaw ? imgRaw.split('\n').map(s=>s.trim()).filter(Boolean) : ['https://placehold.co/400x400/1a1a2e/00ff88?text=Plugin'];

      // Parse comma-separated inputs
      const typeList = document.getElementById('f-type').value.split(',').map(s=>s.trim()).filter(Boolean);
      const dawList = document.getElementById('f-daw').value.split(',').map(s=>s.trim()).filter(Boolean);
      const featureList = document.getElementById('f-features').value.split('\n').filter(s=>s.trim()).map(s => s.replace(/^- /, '').trim());

      const productToSave = {
        ...(isEditing ? state.editingProduct : {
          rating: 5.0, reviews: 0,
          releaseDate: new Date().toISOString().split('T')[0],
          color: '#00ff88', tags: [], audioDemo: null
        }),
        id: newId,
        slug: isEditing ? state.editingProduct.slug : document.getElementById('f-name').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || newId,
        name: document.getElementById('f-name').value.trim(),
        brand: document.getElementById('f-brand').value.trim(),
        developer: document.getElementById('f-dev').value.trim() || document.getElementById('f-brand').value.trim(),
        category: document.getElementById('f-category').value,
        subcategory: document.getElementById('f-subcat').value.trim(),
        price: msrp,
        salePrice: sp,
        cryptoPrices: { BTC: +(msrp / 90000).toFixed(6), ETH: +(msrp / 3200).toFixed(5), USDT: sp },
        images: imageList,
        videoDemo: document.getElementById('f-video').value.trim() || null,
        productPage: document.getElementById('f-url').value.trim() || '#',
        shortDesc: document.getElementById('f-desc').value.trim(),
        description: document.getElementById('f-fulldesc').value.trim(),
        type: typeList.length ? typeList : ['vst3', 'au'],
        dawCompat: dawList.length ? dawList : ['fl-studio', 'ableton', 'logic'],
        features: featureList,
        specs: {
          Format: document.getElementById('f-spec-format').value.trim(),
          OS: document.getElementById('f-spec-os').value.trim(),
          'CPU Usage': document.getElementById('f-spec-cpu').value.trim(),
          Download: document.getElementById('f-spec-dl').value.trim(),
          Version: document.getElementById('f-spec-ver').value.trim(),
          source_url: document.getElementById('f-sourceurl').value.trim(),
          download_win: document.getElementById('f-dl-win').value.trim(),
          download_mac: document.getElementById('f-dl-mac').value.trim(),
        },
        systemReqs: {
          os: document.getElementById('f-req-os').value.trim(),
          ram: document.getElementById('f-req-ram').value.trim(),
          cpu: document.getElementById('f-req-cpu').value.trim(),
          disk: document.getElementById('f-req-disk').value.trim(),
        },
        isFeatured: document.getElementById('f-isfeatured').checked,
        isTrending: document.getElementById('f-istrending').checked,
        isNew: document.getElementById('f-isnew').checked,
      };

      saveProduct(productToSave);
      showToast(isEditing ? '✅ Product Updated!' : '✅ Product Added!', 'success');
      closeModal();
    });

    return modalEl;
  }

  function getStats() {
    const total = state.products.length;
    const bundles = state.products.filter(p => p.category === 'bundle').length;
    const value = state.products.reduce((acc, p) => acc + (p.price || 0), 0);
    return { total, bundles, value };
  }

  function renderPage() {
    const stats = getStats();
    
    container.innerHTML = `
      <div class="section admin-panel">
        <div class="container container-wide">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2xl);">
            <div>
              <h1>Admin Dashboard</h1>
              <p class="text-secondary">Manage store inventory, bundles, and view analytics.</p>
            </div>
            <button class="btn btn-primary" id="admin-add-product" style="font-size:1rem;">
              + Add New Product
            </button>
          </div>

          <!-- STATS CARDS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-bottom:var(--space-3xl);">
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Products</div>
              <div style="font-size:2rem; font-weight:bold; color:var(--neon-green);">${stats.total}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Bundles Active</div>
              <div style="font-size:2rem; font-weight:bold; color:var(--neon-blue);">${stats.bundles}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Value (MSRP)</div>
              <div style="font-size:2rem; font-weight:bold; color:var(--neon-orange);">${formatPrice(stats.value)}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Users Online</div>
              <div style="font-size:2rem; font-weight:bold; color:var(--text-primary);">42 🟢</div>
            </div>
          </div>

          <!-- INVENTORY TABLE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
            <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
              <h3 style="margin:0;">Inventory Management</h3>
              <div class="input-group" style="width:300px;">
                <span class="search-input-icon">🔍</span>
                <input type="text" class="input search-input" id="admin-search" placeholder="Search products..." value="${state.search}" />
              </div>
            </div>
            
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left;" class="admin-table">
                <thead>
                  <tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:var(--text-sm);">
                    <th style="padding:var(--space-sm) var(--space-lg);">Product</th>
                    <th style="padding:var(--space-sm);">Category</th>
                    <th style="padding:var(--space-sm);">Brand</th>
                    <th style="padding:var(--space-sm);">MSRP</th>
                    <th style="padding:var(--space-sm);">Sale Price</th>
                    <th style="padding:var(--space-sm);">Status</th>
                    <th style="padding:var(--space-sm) var(--space-lg); text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-table-body">
                  <!-- Rendered by JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- DANGER ZONE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); border:1px solid rgba(255,68,68,0.3); margin-top:var(--space-xl); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h4 style="margin:0 0 4px 0; color:#ff4444;">&#9888; Danger Zone</h4>
                <p class="text-xs text-secondary" style="margin:0;">Permanently remove all products from the Supabase database. This cannot be undone.</p>
              </div>
              <button class="btn" id="admin-clear-all" style="background:rgba(255,68,68,0.1); border:1px solid rgba(255,68,68,0.4); color:#ff4444; white-space:nowrap;">
                &#128465; Delete All Products
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Ensure modal is in DOM (attached to body, not re-created)
    ensureModal();
    renderTable();
    attachEvents();
  }

  function renderTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    let filtered = [...state.products];
    if (state.search) {
      const q = state.search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:var(--space-xl); color:var(--text-muted);">${state.search ? `No products matching "${state.search}"` : 'No products. Click "Add New Product" to get started.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.15s;" 
          onmouseover="this.style.background='rgba(255,255,255,0.03)'" 
          onmouseout="this.style.background='transparent'">
        <td style="padding:var(--space-sm) var(--space-lg);">
          <div style="display:flex; align-items:center; gap:var(--space-sm);">
            <img src="${p.images?.[0] || 'https://placehold.co/40x40/1a1a2e/00ff88?text=P'}" 
                 alt="${sanitizeHTML(p.name || '')}"
                 loading="lazy"
                 style="width:40px; height:40px; border-radius:4px; object-fit:cover; background:#1a1a2e;"
                 onerror="this.src='https://placehold.co/40x40/1a1a2e/00ff88?text=P'" />
            <div style="font-weight:500;">${sanitizeHTML(p.name || '(unnamed)')}</div>
          </div>
        </td>
        <td style="padding:var(--space-sm); color:var(--text-secondary); text-transform:capitalize;">${sanitizeHTML(p.category || '')}</td>
        <td style="padding:var(--space-sm); color:var(--text-secondary);">${sanitizeHTML(p.brand || '')}</td>
        <td style="padding:var(--space-sm);">${formatPrice(p.price)}</td>
        <td style="padding:var(--space-sm); color:var(--neon-green); font-weight:bold;">${formatPrice(p.salePrice)}</td>
        <td style="padding:var(--space-sm);">
          ${p.isFeatured ? '<span class="badge badge-purple" style="font-size:10px;">Featured</span>' : ''}
          ${p.isTrending ? '<span class="badge badge-blue" style="font-size:10px;">Trending</span>' : ''}
          ${p.isNew ? '<span class="badge" style="font-size:10px; background:rgba(0,255,136,0.15); color:var(--neon-green);">New</span>' : ''}
          ${!p.isFeatured && !p.isTrending && !p.isNew ? '<span style="color:var(--text-muted); font-size:12px;">Standard</span>' : ''}
        </td>
        <td style="padding:var(--space-sm) var(--space-lg); text-align:right;">
          <button class="btn btn-ghost btn-xs admin-edit-btn" data-id="${p.id}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
          <button class="btn btn-ghost btn-xs admin-del-btn" data-id="${p.id}" style="padding:4px 10px; font-size:12px; color:#ff4444;">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function attachEvents() {
    // Search
    document.getElementById('admin-search')?.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderTable();
    });

    // Edit / Delete Actions
    document.getElementById('admin-table-body')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.admin-edit-btn');
      const delBtn = e.target.closest('.admin-del-btn');
      
      if (editBtn) {
        const id = editBtn.dataset.id;
        state.editingProduct = state.products.find(p => p.id == id) || null;
        openModal();
      }
      
      if (delBtn) {
        const id = delBtn.dataset.id;
        const prod = state.products.find(p => p.id === id);
        if (confirm(`Delete "${prod?.name || id}"? This cannot be undone.`)) {
          deleteProduct(id);
          showToast('Product deleted', 'success');
        }
      }
    });

    // Add Product
    document.getElementById('admin-add-product')?.addEventListener('click', () => {
      state.editingProduct = null;
      openModal();
    });

    // Delete ALL Products
    document.getElementById('admin-clear-all')?.addEventListener('click', async () => {
      const first = confirm('⚠️ Delete ALL products from the database? This cannot be undone.');
      if (!first) return;
      const second = confirm('Are you absolutely sure? Every product will be permanently deleted.');
      if (!second) return;
      try {
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Deleting...'; }
        await clearAllProducts();
        await loadInventory();
        showToast('🗑️ All products deleted successfully.', 'success');
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = false; btn.textContent = '🗑️ Delete All Products'; }
      }
    });
  }


  function openModal() {
    const modal = ensureModal();
    const title = document.getElementById('modal-title');
    
    if (state.editingProduct) {
      title.textContent = `Edit: ${state.editingProduct.name}`;
      document.getElementById('f-name').value = state.editingProduct.name || '';
      document.getElementById('f-brand').value = state.editingProduct.brand || '';
      document.getElementById('f-dev').value = state.editingProduct.developer || state.editingProduct.brand || '';
      document.getElementById('f-category').value = state.editingProduct.category || '';
      document.getElementById('f-subcat').value = state.editingProduct.subcategory || '';
      document.getElementById('f-type').value = (state.editingProduct.type || []).join(', ');
      document.getElementById('f-daw').value = (state.editingProduct.dawCompat || []).join(', ');
      document.getElementById('f-image').value = (state.editingProduct.images || []).join('\n');
      document.getElementById('f-video').value = state.editingProduct.videoDemo || '';
      document.getElementById('f-url').value = state.editingProduct.productPage !== '#' ? (state.editingProduct.productPage || '') : '';
      document.getElementById('f-price').value = state.editingProduct.price || '';
      document.getElementById('f-saleprice').value = state.editingProduct.salePrice || '';
      document.getElementById('f-desc').value = state.editingProduct.shortDesc || '';
      document.getElementById('f-fulldesc').value = state.editingProduct.description || '';
      document.getElementById('f-features').value = (state.editingProduct.features || []).map(f => '- ' + f).join('\n');
      
      const sp = state.editingProduct.specs || {};
      document.getElementById('f-spec-format').value = sp.Format || '';
      document.getElementById('f-spec-os').value = sp.OS || '';
      document.getElementById('f-spec-cpu').value = sp['CPU Usage'] || '';
      document.getElementById('f-spec-dl').value = sp.Download || '';
      document.getElementById('f-spec-ver').value = sp.Version || '';
      document.getElementById('f-sourceurl').value = sp.source_url || '';
      document.getElementById('f-dl-win').value = sp.download_win || '';
      document.getElementById('f-dl-mac').value = sp.download_mac || '';

      const req = state.editingProduct.systemReqs || {};
      document.getElementById('f-req-os').value = req.os || '';
      document.getElementById('f-req-ram').value = req.ram || '';
      document.getElementById('f-req-cpu').value = req.cpu || '';
      document.getElementById('f-req-disk').value = req.disk || '';

      document.getElementById('f-isfeatured').checked = !!state.editingProduct.isFeatured;
      document.getElementById('f-istrending').checked = !!state.editingProduct.isTrending;
      document.getElementById('f-isnew').checked = !!state.editingProduct.isNew;

      document.getElementById('f-quick-fill').value = '';
      document.getElementById('quick-fill-status').style.display = 'none';
    } else {
      title.textContent = 'Add New Product';
      document.getElementById('product-form').reset();
      document.getElementById('f-quick-fill').value = '';
      document.getElementById('quick-fill-status').style.display = 'none';
      document.getElementById('f-isnew').checked = true;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
    state.editingProduct = null;
    document.body.style.overflow = '';
  }

  // Subscribe to inventory changes — only update state + table, NOT full re-render
  const unsubscribe = on('inventory:updated', (newInventory) => {
    state.products = newInventory;
    // Only re-render the table and stats, NOT the modal
    const tbody = document.getElementById('admin-table-body');
    if (tbody) {
      renderTable();
      // Update stats too
      const stats = getStats();
      const el1 = document.getElementById('stat-total');
      if (el1) el1.textContent = stats.total;
    } else {
      // If table not in DOM yet, do a full render (first load)
      renderPage();
    }
  });

  renderPage();
}
