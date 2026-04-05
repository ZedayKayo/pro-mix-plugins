// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Admin Panel
// ═══════════════════════════════════════════════════════

import { getInventory, saveProduct, deleteProduct, loadInventory, on, isAdmin, isLoggedIn } from '../core/store.js';
import { getBrandList, categories } from '../data/products.js';
import { navigate } from '../core/router.js';
import { formatPrice, sanitizeHTML } from '../core/utils.js';
import { showToast } from '../components/Toast.js';
import { autoFillPluginData } from '../services/aiService.js';
import { clearAllProducts, insertProduct, bulkInsertProducts } from '../services/productService.js';
import { SEED_PRODUCTS } from '../data/seed-products.js';
import { fetchTelegramSettings, updateTelegramSettings } from '../services/dbService.js';
import { getDiscountPct, saveDiscount, loadDiscount, bulkUpdateSalePrices } from '../services/discountService.js';

export function renderAdminPanel(params) {
  if (!isAdmin()) {
    showToast('Unauthorized Access', 'error');
    navigate('/');
    return;
  }
  const container = document.getElementById('page-content');
  
  const state = {
    products: getInventory(),
    search: '',
    editingProduct: null,
    activeTab: 'inventory',
    telegramSettings: null,
    orders: null,
    ordersLoading: false,
    users: null,
    usersLoading: false,
    visitors: null,
    visitorsLoading: false,
    notificationLogs: null,
    notificationLogsLoading: false,
    botInfo: null,
    discountPct: getDiscountPct(), // live discount %
  };

  // Pre-fetch telegram settings ONCE
  if (!state.telegramSettings) {
    fetchTelegramSettings().then(s => {
      state.telegramSettings = s || { bot_token: '', chat_id: '', is_enabled: false, notify_all_pages: true, tracked_pages: [] };
      if (state.activeTab === 'telegram') renderPage();
    });
  }

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
              <div id="image-manager" style="grid-column: span 2;">
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Product Images *</label>
                
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                  <input type="text" class="input" id="f-image-add-url" placeholder="Paste image URL..." style="flex:1;" />
                  <button type="button" class="btn btn-ghost" id="btn-add-img-url" style="padding:0 12px; font-size:0.8rem; white-space:nowrap; border:1px solid var(--border-primary);">+ Add URL</button>
                  <label for="f-image-upload" class="btn btn-ghost" style="padding:0 12px; font-size:0.8rem; cursor:pointer; margin:0; white-space:nowrap; display:flex; align-items:center; border:1px solid var(--border-primary);" title="Upload Files">📁 Upload</label>
                  <input type="file" id="f-image-upload" accept="image/*" multiple style="display: none;" />
                </div>

                <textarea id="f-image" style="display:none;"></textarea>
                
                <div id="image-preview-strip" style="display:flex; gap:8px; flex-wrap:wrap; min-height:80px; padding:12px; background:rgba(0,0,0,0.2); border-radius:var(--radius-md); border:1px dashed var(--border-primary);">
                  <!-- previews rendered here -->
                </div>
                <div class="text-xs text-muted" style="margin-top:6px;">Drag and drop to reorder. The first image is the main cover.</div>
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
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Sale Price (−<span id="modal-discount-label">${state.discountPct}</span>% OFF) *</label>
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

    // Global renderer for the image preview strip
    window.renderImagePreviewStrip = function() {
      const el = document.getElementById('f-image');
      if (!el) return;
      const raw = el.value.trim();
      const images = raw ? raw.split('\n').map(s=>s.trim()).filter(Boolean) : []; // DO NOT split by comma; breaks base64
      const strip = document.getElementById('image-preview-strip');
      if (!strip) return;
      strip.innerHTML = '';
      
      if (images.length === 0) {
        strip.innerHTML = '<span class="text-sm text-muted" style="margin:auto;">No images added yet.</span>';
        return;
      }
      
      images.forEach((imgSrc, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:2px solid transparent; cursor:grab; background:#0a0a0f; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s ease;';
        if (idx === 0) item.style.borderColor = 'var(--neon-green)'; // Highlight first as main
        item.title = idx === 0 ? 'Main Cover Image' : 'Gallery Image';
        item.draggable = true;
        
        item.innerHTML = `
          <img src="${imgSrc}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" onerror="this.src='https://placehold.co/400x400/1a1a2e/ff4444?text=Error'" />
          <button type="button" class="img-delete-btn" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.7); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:50%; width:22px; height:22px; font-size:12px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">✕</button>
          ${idx===0 ? `<div style="position:absolute; bottom:0; left:0; right:0; background:var(--neon-green); color:#000; font-size:10px; font-weight:bold; text-align:center; padding:2px 0;">MAIN</div>` : ''}
        `;
        
        // Drag events
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', idx);
          item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', () => item.style.opacity = '1');
        item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; item.style.border = '2px dashed var(--neon-blue)'; });
        item.addEventListener('dragleave', () => item.style.border = (idx===0 ? '2px solid var(--neon-green)' : '2px solid transparent'));
        item.addEventListener('drop', (e) => {
          e.preventDefault();
          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
          const toIdx = idx;
          if (fromIdx !== toIdx) {
            const arr = [...images];
            const [moved] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, moved);
            document.getElementById('f-image').value = arr.join('\n');
            window.renderImagePreviewStrip();
          }
        });
        
        // Delete event
        item.querySelector('.img-delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const arr = [...images];
          arr.splice(idx, 1);
          document.getElementById('f-image').value = arr.join('\n');
          window.renderImagePreviewStrip();
        });
        
        // Hover effects
        item.querySelector('.img-delete-btn').addEventListener('mouseenter', function() { this.style.background = '#ff4444'; });
        item.querySelector('.img-delete-btn').addEventListener('mouseleave', function() { this.style.background = 'rgba(0,0,0,0.7)'; });
        
        strip.appendChild(item);
      });
    };

    // Add Image URL Manual Button
    modalEl.querySelector('#btn-add-img-url')?.addEventListener('click', () => {
      const input = document.getElementById('f-image-add-url');
      const val = input.value.trim();
      if (val) {
        const el = document.getElementById('f-image');
        const cur = el.value.trim();
        el.value = cur ? cur + '\n' + val : val;
        input.value = '';
        window.renderImagePreviewStrip();
      }
    });

    // MSRP → auto-calc sale price (uses live discount %)
    modalEl.querySelector('#f-price')?.addEventListener('input', (e) => {
      const msrp = parseFloat(e.target.value);
      if (!isNaN(msrp)) {
        const mult = (100 - state.discountPct) / 100;
        document.getElementById('f-saleprice').value = (msrp * mult).toFixed(2);
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
        window.renderImagePreviewStrip();
        
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
        window.renderImagePreviewStrip();
        if (data.videoDemo) document.getElementById('f-video').value = data.videoDemo;
        if (data.productPage) document.getElementById('f-url').value = data.productPage;
        if (inputVal.startsWith('http')) document.getElementById('f-sourceurl').value = inputVal;
        
        if (data.price) {
          document.getElementById('f-price').value = data.price;
          const mult = (100 - state.discountPct) / 100;
          document.getElementById('f-saleprice').value = (data.price * mult).toFixed(2);
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

    modalEl.querySelector('#product-form')?.addEventListener('submit', async (e) => {
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

      const btn = document.getElementById('modal-submit');
      const originalText = btn.textContent;
      // Mark the modal as busy so inventory:updated can't destroy it mid-save
      const modal = document.getElementById('product-modal');
      if (modal) modal.dataset.saving = '1';
      try {
        btn.disabled = true;
        btn.textContent = '⏳ Saving...';

        // Race against a 20s timeout — prevents button getting permanently stuck
        // if the Supabase connection drops or stalls mid-request
        const saveTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(
            'Save timed out (20s). Check your network or Supabase connection and try again.'
          )), 20000)
        );
        await Promise.race([saveProduct(productToSave), saveTimeout]);

        showToast(isEditing ? '✅ Product Updated!' : '✅ Product Added!', 'success');
        closeModal();
      } catch (err) {
        console.error("Save product UI catch:", err);
        showToast('❌ ' + (err.message || 'Failed to save — Unknown error'), 'error');
      } finally {
        // Clear busy flag
        const modalEl = document.getElementById('product-modal');
        if (modalEl) delete modalEl.dataset.saving;
        // Re-fetch btn in case DOM was touched; re-enable it
        const freshBtn = document.getElementById('modal-submit');
        if (freshBtn) {
          freshBtn.disabled = false;
          freshBtn.textContent = originalText;
        }
      }
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
          
          <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid var(--border-primary); padding-bottom:var(--space-md); margin-bottom:var(--space-2xl);">
            <div>
              <h1>Admin Dashboard</h1>
              <div style="display:flex; gap:var(--space-xs); margin-top:var(--space-md); flex-wrap:wrap;">
                <button class="btn ${state.activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="inventory" style="padding:6px 14px; font-size:0.875rem;">📦 Inventory</button>
                <button class="btn ${state.activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="orders" style="padding:6px 14px; font-size:0.875rem;">📋 Orders</button>
                <button class="btn ${state.activeTab === 'users' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="users" style="padding:6px 14px; font-size:0.875rem;">👤 Users</button>
                <button class="btn ${state.activeTab === 'visitors' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="visitors" style="padding:6px 14px; font-size:0.875rem;">👥 Visitors</button>
                <button class="btn ${state.activeTab === 'telegram' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="telegram" style="padding:6px 14px; font-size:0.875rem;">🤖 Telegram</button>
                <button class="btn ${state.activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'} admin-tab" data-tab="settings" style="padding:6px 14px; font-size:0.875rem;">⚙️ Settings</button>
              </div>
            </div>
            ${state.activeTab === 'inventory' ? `<button class="btn btn-primary" id="admin-add-product" style="font-size:1rem;">+ Add New Product</button>` : ''}
          </div>

          ${state.activeTab === 'inventory' ? `
          <!-- STATS CARDS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-md); margin-bottom:var(--space-3xl);">
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Products</div>
              <div id="stat-total" style="font-size:2rem; font-weight:bold; color:var(--neon-green);">${stats.total}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Bundles Active</div>
              <div id="stat-bundles" style="font-size:2rem; font-weight:bold; color:var(--neon-blue);">${stats.bundles}</div>
            </div>
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);">
              <div class="text-sm text-muted" style="margin-bottom:var(--space-xs);">Total Value (MSRP)</div>
              <div id="stat-value" style="font-size:2rem; font-weight:bold; color:var(--neon-orange);">${formatPrice(stats.value)}</div>
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

          <!-- RESTORE ZONE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); border:1px solid rgba(0,255,136,0.25); margin-top:var(--space-xl); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-lg);">
              <div>
                <h4 style="margin:0 0 4px 0; color:var(--neon-green);">&#128260; Restore Missing Products</h4>
                <p class="text-xs text-secondary" style="margin:0;">Re-adds all catalogue plugins that are missing from Supabase. Safe to run — existing products are never touched or duplicated.</p>
              </div>
              <button class="btn" id="admin-restore-products" style="background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.4); color:var(--neon-green); white-space:nowrap; flex-shrink:0;">
                &#10227; Restore Products
              </button>
            </div>
            <div id="restore-status" style="display:none; margin-top:var(--space-md); font-size:var(--text-sm); color:var(--text-secondary);"></div>
          </div>

          <!-- DANGER ZONE -->
          <div class="glass-panel" style="border-radius:var(--radius-lg); border:1px solid rgba(255,68,68,0.3); margin-top:var(--space-md); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h4 style="margin:0 0 4px 0; color:#ff4444;">&#9888; Danger Zone</h4>
                <p class="text-xs text-secondary" style="margin:0;">Permanently remove ALL products from Supabase. This cannot be undone — use Restore above to recover.</p>
              </div>
              <button class="btn" id="admin-clear-all" style="background:rgba(255,68,68,0.1); border:1px solid rgba(255,68,68,0.4); color:#ff4444; white-space:nowrap;">
                &#128465; Delete All Products
              </button>
            </div>
          </div>
          ` : ''}

          ${state.activeTab === 'orders' ? renderOrdersTab() : ''}

          ${state.activeTab === 'users' ? renderUsersTab() : ''}

          ${state.activeTab === 'visitors' ? renderVisitorsTab() : ''}

          ${state.activeTab === 'settings' ? renderSettingsTab() : ''}

          ${state.activeTab === 'telegram' ? `
          <div style="max-width:860px; margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">

            <!-- BOT STATUS CARD -->
            <div class="glass-panel" style="padding:var(--space-xl); border-radius:var(--radius-lg); border:1px solid rgba(0,255,136,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
                <h3 style="margin:0;">🤖 Bot Connection Status</h3>
                <button type="button" class="btn" id="ts-verify" style="border:1px solid var(--neon-green); color:var(--neon-green); background:rgba(0,255,136,0.08); font-size:0.85rem;">🔍 Verify Connection</button>
              </div>
              <div id="ts-bot-status">
                ${state.botInfo ? `
                  <div style="display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); background:rgba(0,255,136,0.08); border-radius:var(--radius-md); border:1px solid rgba(0,255,136,0.2);">
                    <div style="width:48px; height:48px; background:var(--neon-green); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">🤖</div>
                    <div>
                      <div style="font-weight:700; color:var(--neon-green); font-size:1rem;">${state.botInfo.first_name}</div>
                      <div style="color:var(--text-muted); font-size:0.85rem;">@${state.botInfo.username}</div>
                      <div style="color:var(--neon-green); font-size:0.75rem; margin-top:2px;">✅ Connected</div>
                    </div>
                  </div>
                ` : `
                  <div style="padding:var(--space-md); background:rgba(255,255,255,0.03); border-radius:var(--radius-md); color:var(--text-muted); font-size:0.875rem;">
                    Click <strong>Verify Connection</strong> to check your bot status.
                  </div>
                `}
              </div>
            </div>

            <!-- HOW TO SETUP -->
            <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg); border:1px solid rgba(255,200,0,0.15);">
              <h4 style="margin:0 0 var(--space-sm) 0; color:#ffc000;">📋 Setup Checklist</h4>
              <ol style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; font-size:0.875rem; color:var(--text-secondary);">
                <li>Create a bot via <strong style="color:#fff;">@BotFather</strong> on Telegram — copy the token below</li>
                <li>Send <code style="background:rgba(255,255,255,0.1); padding:1px 6px; border-radius:4px;">/start</code> to your bot in Telegram (required for personal chats)</li>
                <li>Get your Chat ID: message <strong style="color:#fff;">@userinfobot</strong> on Telegram</li>
                <li>Paste token + Chat ID below, click <strong style="color:#fff;">Save</strong> then <strong style="color:#fff;">Verify</strong></li>
              </ol>
            </div>

            <!-- CONFIG FORM -->
            <div class="glass-panel" style="padding:var(--space-xl); border-radius:var(--radius-lg);">
              <h3 style="margin:0 0 var(--space-lg) 0;">⚙️ Configuration</h3>
              <form id="telegram-form" style="display:flex; flex-direction:column; gap:var(--space-md);">
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:bold; color:var(--neon-green); font-size:1.1rem; line-height:1;">
                  <input type="checkbox" id="ts-enabled" ${state.telegramSettings?.is_enabled ? 'checked' : ''} style="width:20px; height:20px; margin:0; flex-shrink:0;" />
                  <span style="position:relative; top:1px;">Enable Real-Time Notifications</span>
                </label>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
                  <div>
                    <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Bot Token</label>
                    <input type="password" class="input" id="ts-token" value="${state.telegramSettings?.bot_token || ''}" placeholder="123456789:ABCdef..." />
                  </div>
                  <div>
                    <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Your Chat ID</label>
                    <input type="text" class="input" id="ts-chat" value="${state.telegramSettings?.chat_id || ''}" placeholder="e.g. 8728649355" />
                  </div>
                </div>

                <div style="padding:var(--space-md); border:1px solid rgba(255,255,255,0.1); border-radius:var(--radius-md); background:rgba(0,0,0,0.2);">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:bold; margin-bottom:6px;">
                    <input type="checkbox" id="ts-all-pages" ${state.telegramSettings?.notify_all_pages ? 'checked' : ''} />
                    Notify on ALL Page Views
                  </label>
                  <p class="text-xs text-muted" style="margin:0 0 0 24px;">When ON: every page view (except /admin) triggers a message. When OFF: only new visitor sessions are reported.</p>
                </div>
                
                <div style="display:flex; gap:var(--space-md); align-items:center; flex-wrap:wrap;">
                  <button type="button" class="btn" id="ts-test" style="border:1px solid var(--neon-blue); color:var(--neon-blue); background:rgba(0,255,255,0.1);">💬 Send Test</button>
                  <button type="button" class="btn btn-primary" id="ts-save">💾 Save Config</button>
                  <span id="ts-status" class="text-sm"></span>
                </div>
              </form>
            </div>
          </div>
          ` : ''}

        </div>
      </div>
    `;

    // Modal is NOT recreated here — ensureModal() is called only inside openModal()
    // so a renderPage() triggered by a tab switch can never destroy an in-progress save.
    if (state.activeTab === 'inventory') {
      renderTable();
    }
    attachEvents();
    // Auto-load data for new tabs
    if (state.activeTab === 'orders' && !state.orders && !state.ordersLoading) loadOrders();
    if (state.activeTab === 'users' && !state.users && !state.usersLoading) loadUsers();
    if (state.activeTab === 'visitors' && !state.visitors && !state.visitorsLoading) loadVisitors();
    if (state.activeTab === 'visitors' && !state.notificationLogs && !state.notificationLogsLoading) loadNotificationLogs();
  }

  // ── ORDERS TAB ───────────────────────────────────────────
  function renderOrdersTab() {
    if (state.ordersLoading) {
      return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading orders...</p></div>`;
    }
    if (!state.orders) {
      return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-orders">Load Orders</button></div>`;
    }
    const orders = state.orders;
    const totalRevenue = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    return `
      <div style="margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:var(--space-md);">
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Orders</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${orders.length}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Revenue</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${formatPrice(totalRevenue)}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">⏳ Pending</div><div style="font-size:2rem;font-weight:bold;color:#ff6b2b;">${pendingCount}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">✅ Completed</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${completedCount}</div></div>
        </div>
        <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
          <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
            <h3 style="margin:0;">All Orders</h3>
            <button class="btn btn-ghost" id="btn-refresh-orders" style="font-size:0.8rem;">🔄 Refresh</button>
          </div>
          ${orders.length === 0 ? `<div style="padding:var(--space-3xl); text-align:center; color:var(--text-muted);">No orders yet.</div>` : `
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse;" class="admin-table">
              <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.8rem;">
                <th style="padding:10px 16px;">Order ID</th>
                <th style="padding:10px 8px;">Customer</th>
                <th style="padding:10px 8px;">Items</th>
                <th style="padding:10px 8px;">Total</th>
                <th style="padding:10px 8px;">Payment</th>
                <th style="padding:10px 8px;">Status</th>
                <th style="padding:10px 8px;">Date</th>
              </tr></thead>
              <tbody>
                ${orders.map(o => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:10px 16px; font-family:monospace; font-size:0.75rem; color:var(--text-muted);">#${(o.id||'').substring(0,8)}</td>
                    <td style="padding:10px 8px; font-size:0.85rem;">${sanitizeHTML(o.profiles?.name || o.profiles?.email || (o.user_id||'').substring(0,8) || '—')}</td>
                    <td style="padding:10px 8px; font-size:0.85rem; color:var(--text-secondary);">${Array.isArray(o.items) ? o.items.length : '—'} item(s)</td>
                    <td style="padding:10px 8px; font-weight:bold; color:var(--neon-green);">${formatPrice(parseFloat(o.total)||0)}</td>
                    <td style="padding:10px 8px; font-size:0.8rem; text-transform:capitalize; color:var(--text-secondary);">${sanitizeHTML(o.payment_method||'—')}</td>
                    <td style="padding:10px 8px;"><span style="padding:2px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${o.status==='completed'?'rgba(0,255,136,0.15)':'rgba(255,107,43,0.15)'}; color:${o.status==='completed'?'var(--neon-green)':'#ff6b2b'};">${o.status||'unknown'}</span></td>
                    <td style="padding:10px 8px; font-size:0.8rem; color:var(--text-muted);">${o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
        ${pendingCount > 0 ? `<div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg); border:1px solid rgba(255,107,43,0.3);"><h4 style="margin:0 0 8px 0; color:#ff6b2b;">⚠️ ${pendingCount} Pending Order(s) Need Verification</h4><p class="text-sm text-secondary" style="margin:0;">Once crypto/bank payment is confirmed, update the order status to <strong>completed</strong> in Supabase to generate licenses.</p></div>` : ''}
      </div>`;
  }

  // ── USERS TAB ─────────────────────────────────────────────
  function renderUsersTab() {
    if (state.usersLoading) {
      return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading users...</p></div>`;
    }
    if (!state.users) {
      return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-users">Load Users</button></div>`;
    }
    const users = state.users;
    const totalCredits = users.reduce((a, u) => a + (u.credits || 0), 0);
    const totalRevenue = users.reduce((a, u) => a + (u.totalSpent || 0), 0);
    return `
      <div style="margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:var(--space-md);">
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Users</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${users.length}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Revenue</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${formatPrice(totalRevenue)}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Credits Issued</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-purple);">${totalCredits}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">With Orders</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-orange);">${users.filter(u => u.orderCount > 0).length}</div></div>
        </div>
        <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
          <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
            <h3 style="margin:0;">Registered Users</h3>
            <button class="btn btn-ghost" id="btn-refresh-users" style="font-size:0.8rem;">🔄 Refresh</button>
          </div>
          ${users.length === 0
            ? `<div style="padding:var(--space-3xl); text-align:center; color:var(--text-muted);">No users registered yet.</div>`
            : `<div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse;" class="admin-table">
                <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.8rem;">
                  <th style="padding:10px 16px;">User</th>
                  <th style="padding:10px 8px;">Email</th>
                  <th style="padding:10px 8px;">Credits</th>
                  <th style="padding:10px 8px;">Orders</th>
                  <th style="padding:10px 8px;">Total Spent</th>
                  <th style="padding:10px 8px;">Last Order</th>
                  <th style="padding:10px 8px;">Joined</th>
                </tr></thead>
                <tbody>
                  ${users.map(u => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                      <td style="padding:10px 16px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--neon-blue),var(--neon-purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">${sanitizeHTML((u.name||u.email||'?')[0].toUpperCase())}</div>
                          <div style="font-weight:500;font-size:0.875rem;">${sanitizeHTML(u.name || '(no name)')}</div>
                        </div>
                      </td>
                      <td style="padding:10px 8px; font-size:0.82rem; color:var(--text-secondary);">${sanitizeHTML(u.email || '—')}</td>
                      <td style="padding:10px 8px;">
                        <span style="padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;background:rgba(168,85,247,0.15);color:var(--neon-purple);">$${u.credits ?? 0}</span>
                      </td>
                      <td style="padding:10px 8px; font-size:0.85rem; color:var(--neon-blue); font-weight:600;">${u.orderCount || 0}</td>
                      <td style="padding:10px 8px; font-weight:bold; color:var(--neon-green);">${formatPrice(u.totalSpent || 0)}</td>
                      <td style="padding:10px 8px; font-size:0.8rem; color:var(--text-muted);">${u.lastOrder ? new Date(u.lastOrder).toLocaleDateString() : '—'}</td>
                      <td style="padding:10px 8px; font-size:0.8rem; color:var(--text-muted);">${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`
          }
        </div>
      </div>`;
  }

  // ── VISITORS TAB ──────────────────────────────────────────
  function renderVisitorsTab() {
    if (state.visitorsLoading) {
      return `<div class="glass-panel" style="padding:var(--space-3xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><div style="font-size:2rem;">⏳</div><p class="text-muted" style="margin-top:var(--space-md);">Loading visitor data...</p></div>`;
    }
    if (!state.visitors) {
      return `<div class="glass-panel" style="padding:var(--space-xl); text-align:center; border-radius:var(--radius-lg); margin-top:var(--space-xl);"><button class="btn btn-primary" id="btn-load-visitors">Load Visitor Data</button></div>`;
    }
    const sessions = state.visitors.sessions || [];
    const topPages = state.visitors.topPages || [];
    const today = new Date().toDateString();
    const todayCount = sessions.filter(s => new Date(s.last_seen).toDateString() === today).length;
    const countries = [...new Set(sessions.map(s => s.country).filter(Boolean))];
    return `
      <div style="margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:var(--space-md);">
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Sessions</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-blue);">${sessions.length}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Today</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-green);">${todayCount}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Countries</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-purple);">${countries.length}</div></div>
          <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg);"><div class="text-sm text-muted">Total Page Views</div><div style="font-size:2rem;font-weight:bold;color:var(--neon-orange);">${sessions.reduce((a,s)=>a+(s.page_views||0),0)}</div></div>
        </div>
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:var(--space-lg);">
          <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
            <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
              <h3 style="margin:0;">Recent Visitors</h3>
              <button class="btn btn-ghost" id="btn-refresh-visitors" style="font-size:0.8rem;">🔄 Refresh</button>
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse;" class="admin-table">
                <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.78rem;">
                  <th style="padding:8px 12px;">Location</th>
                  <th style="padding:8px;">Device</th>
                  <th style="padding:8px;">Browser</th>
                  <th style="padding:8px;">Views</th>
                  <th style="padding:8px;">Last Seen</th>
                </tr></thead>
                <tbody>
                  ${sessions.slice(0,50).map(s => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                      <td style="padding:8px 12px; font-size:0.82rem;">${sanitizeHTML(s.city&&s.city!=='unknown'?s.city+', ':'')}${sanitizeHTML(s.country||'Unknown')}</td>
                      <td style="padding:8px; font-size:0.82rem; color:var(--text-secondary);">${sanitizeHTML(s.os||'—')}</td>
                      <td style="padding:8px; font-size:0.82rem; color:var(--text-secondary);">${sanitizeHTML(s.browser||'—')}</td>
                      <td style="padding:8px; font-size:0.82rem; color:var(--neon-blue); font-weight:600;">${s.page_views||0}</td>
                      <td style="padding:8px; font-size:0.78rem; color:var(--text-muted);">${s.last_seen ? new Date(s.last_seen).toLocaleString() : '—'}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="glass-panel" style="border-radius:var(--radius-lg); padding:var(--space-lg);">
            <h3 style="margin:0 0 var(--space-md) 0;">🔝 Top Pages</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${topPages.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                  <span style="font-size:0.8rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${sanitizeHTML(p.page)}</span>
                  <span style="font-size:0.8rem; font-weight:bold; color:var(--neon-blue); flex-shrink:0; margin-left:8px;">${p.views}</span>
                </div>`).join('')}
              ${topPages.length === 0 ? '<p class="text-muted text-sm">No page data yet.</p>' : ''}
            </div>
          </div>
        </div>

        <!-- NOTIFICATION HISTORY -->
        <div class="glass-panel" style="border-radius:var(--radius-lg); overflow:hidden;">
          <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
            <div>
              <h3 style="margin:0;">📢 Notification History</h3>
              <p class="text-xs text-muted" style="margin:4px 0 0 0;">Every Telegram notification attempt, newest first.</p>
            </div>
            <button class="btn btn-ghost" id="btn-refresh-notif-logs" style="font-size:0.8rem;">🔄 Refresh</button>
          </div>
          ${state.notificationLogsLoading ? `
            <div style="padding:var(--space-xl); text-align:center; color:var(--text-muted);">⏳ Loading...</div>
          ` : !state.notificationLogs || state.notificationLogs.length === 0 ? `
            <div style="padding:var(--space-xl); text-align:center; color:var(--text-muted); font-size:0.875rem;">
              No notifications logged yet. Notifications appear here once a visitor triggers one.
            </div>
          ` : `
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse;" class="admin-table">
              <thead><tr style="background:rgba(255,255,255,0.02); color:var(--text-muted); font-size:0.78rem;">
                <th style="padding:8px 12px;">Type</th>
                <th style="padding:8px;">Page</th>
                <th style="padding:8px;">Location</th>
                <th style="padding:8px;">Device</th>
                <th style="padding:8px;">Status</th>
                <th style="padding:8px;">Time</th>
              </tr></thead>
              <tbody>
                ${(state.notificationLogs || []).slice(0, 100).map(log => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:8px 12px;">
                      <span style="padding:2px 8px; border-radius:20px; font-size:0.72rem; font-weight:600; white-space:nowrap;
                        background:${log.message_type === 'new_visitor' ? 'rgba(255,107,43,0.15)' : 'rgba(0,136,255,0.12)'};
                        color:${log.message_type === 'new_visitor' ? '#ff6b2b' : 'var(--neon-blue)'};
                      ">${log.message_type === 'new_visitor' ? '🆕 New Visitor' : '🧭 Page View'}</span>
                    </td>
                    <td style="padding:8px; font-size:0.78rem; font-family:monospace; color:var(--text-secondary); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${sanitizeHTML(log.page_url||'')}">\`${sanitizeHTML(log.page_url || '/')}</td>
                    <td style="padding:8px; font-size:0.8rem;">${sanitizeHTML(log.city && log.city !== 'unknown' ? log.city + ', ' : '')}${sanitizeHTML(log.country || '—')}</td>
                    <td style="padding:8px; font-size:0.78rem; color:var(--text-secondary);">${sanitizeHTML(log.os || '—')} / ${sanitizeHTML(log.browser || '—')}</td>
                    <td style="padding:8px;">
                      ${log.telegram_ok
                        ? '<span style="color:var(--neon-green); font-size:0.8rem;">✅ Sent</span>'
                        : `<span style="color:#ff4444; font-size:0.8rem;" title="${sanitizeHTML(log.error_message||'')}">❌ Failed</span>`
                      }
                    </td>
                    <td style="padding:8px; font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">${log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>`;
  }

  // ── SETTINGS TAB ──────────────────────────────────────────
  function renderSettingsTab() {
    const pct = state.discountPct;
    const payPct = 100 - pct;
    const exampleSale = (100 * payPct / 100).toFixed(2);
    return `
      <div style="max-width:680px; margin-top:var(--space-xl); display:flex; flex-direction:column; gap:var(--space-lg);">

        <!-- DISCOUNT CARD -->
        <div class="glass-panel" style="padding:var(--space-xl); border-radius:var(--radius-lg); border:1px solid rgba(0,255,136,0.15);">
          <h3 style="margin:0 0 4px 0;">🏷️ Global Discount Setting</h3>
          <p class="text-sm text-secondary" style="margin:0 0 var(--space-xl) 0;">
            This single value controls the sale price of <strong>every product</strong> in the store.
            Changing it instantly recalculates all prices on the storefront.
          </p>

          <!-- Live Preview Badge -->
          <div style="display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-xl);">
            <div style="text-align:center; padding:var(--space-xl) var(--space-2xl); background:linear-gradient(135deg,rgba(0,255,136,0.08),rgba(0,212,255,0.05)); border:1px solid rgba(0,255,136,0.25); border-radius:var(--radius-xl);">
              <div id="discount-preview-pct" style="font-size:4rem; font-weight:900; color:var(--neon-green); line-height:1; font-variant-numeric:tabular-nums;">${pct}%</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; margin-top:6px;">OFF Retail Price</div>
              <div style="color:var(--text-muted); font-size:0.78rem; margin-top:4px;">Customers pay <strong style="color:var(--neon-blue);" id="discount-preview-pay">${payPct}%</strong> of MSRP</div>
            </div>
          </div>

          <!-- Slider -->
          <div style="margin-bottom:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm);">
              <label style="font-weight:600; font-size:0.95rem;">Discount Percentage</label>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="number" id="discount-input" min="1" max="99" value="${pct}"
                  style="width:70px; text-align:center; font-size:1.1rem; font-weight:700; padding:4px 8px;"
                  class="input" />
                <span style="color:var(--text-muted); font-size:0.9rem;">%</span>
              </div>
            </div>
            <input type="range" id="discount-slider" min="1" max="99" value="${pct}"
              style="width:100%; height:6px; appearance:none; -webkit-appearance:none; background:linear-gradient(to right, var(--neon-green) 0%, var(--neon-green) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%); border-radius:3px; cursor:pointer; outline:none;"
            />
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
              <span>1%</span>
              <span>50%</span>
              <span>99%</span>
            </div>
          </div>

          <!-- Example calculation -->
          <div style="padding:var(--space-md); background:rgba(0,0,0,0.2); border-radius:var(--radius-md); margin-bottom:var(--space-lg);">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">💡 Example calculation</div>
            <div style="display:flex; justify-content:space-between; font-size:0.875rem;">
              <span>Plugin MSRP: <strong>$100.00</strong></span>
              <span>→ Sale price: <strong style="color:var(--neon-green);" id="discount-example">$${exampleSale}</strong></span>
            </div>
          </div>

          <!-- Save -->
          <div style="display:flex; gap:var(--space-md); align-items:center;">
            <button class="btn btn-primary" id="btn-save-discount" style="min-width:160px;">💾 Save Discount</button>
            <span id="discount-save-status" class="text-sm"></span>
          </div>
        </div>

        <!-- INFO CARD -->
        <div class="glass-panel" style="padding:var(--space-lg); border-radius:var(--radius-lg); border:1px solid rgba(255,200,0,0.15);">
          <h4 style="margin:0 0 var(--space-sm) 0; color:#ffc000;">⚠️ What changes when you save?</h4>
          <ul style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; font-size:0.875rem; color:var(--text-secondary);">
            <li>All <strong style="color:#fff;">product sale prices</strong> on the Store, Home, and Product pages update immediately</li>
            <li>All <strong style="color:#fff;">discount badges</strong> ("SALE −X%") on product cards recalculate automatically</li>
            <li>The <strong style="color:#fff;">Quick View</strong> modal discount label updates</li>
            <li>Admin product modal <strong style="color:#fff;">auto-fill</strong> uses the new % for new products</li>
            <li>The setting is saved to <strong style="color:#fff;">Supabase</strong> and persists across all sessions</li>
          </ul>
        </div>

      </div>
    `;
  }

  // ── DATA LOADERS ──────────────────────────────────────────
  async function loadOrders() {
    state.ordersLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-orders');
      const data = await res.json();
      state.orders = data.orders || [];
    } catch (err) {
      state.orders = [];
      showToast('Failed to load orders: ' + err.message, 'error');
    } finally {
      state.ordersLoading = false;
      renderPage();
    }
  }

  async function loadUsers() {
    state.usersLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.users = data.users || [];
    } catch (err) {
      state.users = [];
      showToast('Failed to load users: ' + err.message, 'error');
    } finally {
      state.usersLoading = false;
      renderPage();
    }
  }

  async function loadVisitors() {
    state.visitorsLoading = true;
    renderPage();
    try {
      const res = await fetch('/api/admin-visitors');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.visitors = { sessions: data.sessions || [], topPages: data.topPages || [] };
    } catch (err) {
      state.visitors = { sessions: [], topPages: [] };
      showToast('Failed to load visitors: ' + err.message, 'error');
    } finally {
      state.visitorsLoading = false;
      renderPage();
    }
  }

  async function loadNotificationLogs() {
    state.notificationLogsLoading = true;
    try {
      const res = await fetch('/api/admin-notification-logs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.notificationLogs = data.logs || [];
    } catch (err) {
      state.notificationLogs = [];
      showToast('Failed to load notification history: ' + err.message, 'error');
    } finally {
      state.notificationLogsLoading = false;
      renderPage();
    }
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
    document.getElementById('admin-table-body')?.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.admin-edit-btn');
      const delBtn = e.target.closest('.admin-del-btn');
      
      if (editBtn) {
        const id = editBtn.dataset.id;
        state.editingProduct = state.products.find(p => p.id == id) || null;
        openModal();
      }
      
      if (delBtn) {
        const id = delBtn.dataset.id;
        // Normalize to string for safe comparison (dataset always returns strings)
        const prod = state.products.find(p => String(p.id) === String(id));
        if (confirm(`Delete "${prod?.name || id}"? This cannot be undone.`)) {
          try {
            delBtn.disabled = true;
            delBtn.textContent = '⏳';
            await deleteProduct(id);
            showToast('✅ Product deleted from Supabase', 'success');
          } catch (err) {
            showToast('❌ Delete failed: ' + (err.message || 'Supabase error — check RLS policies'), 'error');
            delBtn.disabled = false;
            delBtn.textContent = 'Delete';
          }
        }
      }
    });

    // Add Product
    document.getElementById('admin-add-product')?.addEventListener('click', () => {
      state.editingProduct = null;
      openModal();
    });

    // Delete ALL Products — triple-confirm with typed verification
    document.getElementById('admin-clear-all')?.addEventListener('click', async () => {
      // Step 1: initial confirm
      const first = confirm('⚠️ WARNING: This will permanently delete ALL products from the database.\n\nClick OK only if you are absolutely sure.');
      if (!first) return;
      // Step 2: typed confirmation
      const typed = prompt('Type DELETE to confirm you want to erase every product:');
      if (!typed || typed.trim().toUpperCase() !== 'DELETE') {
        showToast('Cancelled — type DELETE to confirm.', 'error');
        return;
      }
      try {
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Deleting...'; }
        await clearAllProducts();
        await loadInventory();
        state.products = getInventory();
        renderPage();
        showToast('🗑️ All products deleted. Use Restore to recover.', 'success');
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
        const btn = document.getElementById('admin-clear-all');
        if (btn) { btn.disabled = false; btn.textContent = '🗑️ Delete All Products'; }
      }
    });

    // Restore Missing Products — single batch insert with timeout guard
    document.getElementById('admin-restore-products')?.addEventListener('click', async () => {
      const btn = document.getElementById('admin-restore-products');
      const statusEl = document.getElementById('restore-status');
      if (!btn || !statusEl) return;

      btn.disabled = true;
      btn.textContent = '⏳ Restoring...';
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--text-secondary)';
      statusEl.textContent = '🔍 Checking what is already in Supabase...';

      try {
        // 1. Fetch current inventory with a 10s timeout
        const invTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Supabase timeout — check your connection.')), 10000));
        await Promise.race([loadInventory(), invTimeout]);

        const existing = new Set(getInventory().map(p => p.id));
        const missing = SEED_PRODUCTS.filter(p => !existing.has(p.id));

        if (missing.length === 0) {
          statusEl.style.color = 'var(--neon-green)';
          statusEl.textContent = '✅ All catalogue products are already in Supabase — nothing to restore.';
          showToast('Everything is already up to date!', 'success');
          btn.disabled = false;
          btn.textContent = '↻ Restore Products';
          return;
        }

        statusEl.textContent = `Found ${missing.length} missing product(s). Preparing batch insert...`;

        // 2. Apply live discount to every missing product
        const discountPct = getDiscountPct();
        const readyToInsert = missing.map(p => {
          const mult = (100 - discountPct) / 100;
          const salePrice = +(p.price * mult).toFixed(2);
          const effectivePrice = salePrice < p.price ? salePrice : p.price;
          return {
            ...p,
            salePrice,
            cryptoPrices: {
              BTC: +(effectivePrice / 90000).toFixed(6),
              ETH: +(effectivePrice / 3200).toFixed(5),
              USDT: effectivePrice,
            },
          };
        });

        statusEl.textContent = `Inserting ${readyToInsert.length} product(s) into Supabase...`;

        // 3. Single bulk insert with a 15s hard timeout
        const insertTimeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Insert timed out after 15s. Your Supabase RLS policy may be blocking inserts — check the Supabase dashboard.')), 15000)
        );
        await Promise.race([bulkInsertProducts(readyToInsert), insertTimeout]);

        // 4. Reload and re-render
        statusEl.textContent = 'Refreshing inventory...';
        await loadInventory();
        state.products = getInventory();
        renderPage();

        statusEl.style.color = 'var(--neon-green)';
        statusEl.textContent = `✅ Successfully restored ${readyToInsert.length} product(s)!`;
        showToast(`✅ Restored ${readyToInsert.length} missing products!`, 'success');

      } catch (err) {
        statusEl.style.color = '#ff4444';
        statusEl.textContent = '❌ ' + err.message;
        showToast('Restore failed: ' + err.message, 'error');
        console.error('Restore error:', err);
      } finally {
        btn.disabled = false;
        btn.textContent = '↻ Restore Products';
      }
    });

    // Tab Clicks
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.activeTab = e.target.dataset.tab;
        renderPage();
      });
    });

    // Telegram Settings
    document.getElementById('ts-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-save');
      const status = document.getElementById('ts-status');
      
      const newSettings = {
        is_enabled: document.getElementById('ts-enabled').checked,
        bot_token: document.getElementById('ts-token').value.trim(),
        chat_id: document.getElementById('ts-chat').value.trim(),
        notify_all_pages: document.getElementById('ts-all-pages').checked,
      };

      try {
        btn.disabled = true;
        btn.textContent = '⏳ Saving...';
        await updateTelegramSettings(newSettings);
        state.telegramSettings = { ...state.telegramSettings, ...newSettings };
        status.textContent = '✅ Saved';
        status.style.color = 'var(--neon-green)';
        showToast('Settings saved successfully', 'success');
        setTimeout(() => { status.textContent = ''; }, 3000);
      } catch (err) {
        status.textContent = '❌ Error';
        status.style.color = '#ff4444';
        showToast('Failed to save settings', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Config';
      }
    });

    // Verify Telegram Bot Connection
    document.getElementById('ts-verify')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-verify');
      const statusDiv = document.getElementById('ts-bot-status');
      const bot_token = document.getElementById('ts-token')?.value.trim();
      const chat_id = document.getElementById('ts-chat')?.value.trim();
      if (!bot_token) { showToast('Enter a Bot Token first', 'error'); return; }
      try {
        btn.disabled = true; btn.textContent = '⏳ Verifying...';
        const res = await fetch('/api/telegram-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_token, chat_id })
        });
        const data = await res.json();
        if (data.botValid) {
          state.botInfo = data.botInfo;
          const chatMsg = data.chatInfo
            ? `<div style="margin-top:8px; font-size:0.8rem; color:var(--neon-green);">✅ Chat accessible — ${sanitizeHTML(data.chatInfo.type)} chat</div>`
            : data.chatError
            ? `<div style="margin-top:8px; font-size:0.8rem; color:#ff6b2b;">⚠️ Chat issue: ${sanitizeHTML(data.chatError)}<br><span style='font-size:0.75rem;color:var(--text-muted)'>Make sure you sent /start to your bot in Telegram first.</span></div>`
            : '';
          statusDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); background:rgba(0,255,136,0.08); border-radius:var(--radius-md); border:1px solid rgba(0,255,136,0.2);">
              <div style="width:48px; height:48px; background:linear-gradient(135deg,var(--neon-green),var(--neon-blue)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">🤖</div>
              <div>
                <div style="font-weight:700; color:var(--neon-green); font-size:1rem;">${sanitizeHTML(data.botInfo.first_name)}</div>
                <div style="color:var(--text-muted); font-size:0.85rem;">@${sanitizeHTML(data.botInfo.username)}</div>
                <div style="color:var(--neon-green); font-size:0.75rem; margin-top:2px;">✅ Bot token valid</div>
                ${chatMsg}
              </div>
            </div>`;
          showToast('✅ Bot verified: ' + data.botInfo.first_name, 'success');
        } else {
          statusDiv.innerHTML = `<div style="padding:var(--space-md); background:rgba(255,68,68,0.08); border-radius:var(--radius-md); border:1px solid rgba(255,68,68,0.2); color:#ff4444;">
            ❌ Invalid token: ${sanitizeHTML(data.error || 'Unknown error')}</div>`;
          showToast('❌ ' + (data.error || 'Invalid bot token'), 'error');
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '🔍 Verify Connection';
      }
    });

    // Orders tab buttons
    document.getElementById('btn-load-orders')?.addEventListener('click', loadOrders);
    document.getElementById('btn-refresh-orders')?.addEventListener('click', () => { state.orders = null; loadOrders(); });

    // Users tab buttons
    document.getElementById('btn-load-users')?.addEventListener('click', loadUsers);
    document.getElementById('btn-refresh-users')?.addEventListener('click', () => { state.users = null; loadUsers(); });

    // Visitors tab buttons
    document.getElementById('btn-load-visitors')?.addEventListener('click', loadVisitors);
    document.getElementById('btn-refresh-visitors')?.addEventListener('click', () => { state.visitors = null; loadVisitors(); });
    document.getElementById('btn-refresh-notif-logs')?.addEventListener('click', () => { state.notificationLogs = null; loadNotificationLogs(); });

    // Settings tab — discount slider & save
    const slider = document.getElementById('discount-slider');
    const input  = document.getElementById('discount-input');
    const previewPct = document.getElementById('discount-preview-pct');
    const previewPay = document.getElementById('discount-preview-pay');
    const exampleEl  = document.getElementById('discount-example');
    const sliderEl   = document.getElementById('discount-slider');

    function updateDiscountUI(pct) {
      const p = Math.max(1, Math.min(99, Math.round(pct)));
      if (slider)     slider.value = p;
      if (input)      input.value  = p;
      if (previewPct) previewPct.textContent = p + '%';
      if (previewPay) previewPay.textContent  = (100 - p) + '%';
      if (exampleEl)  exampleEl.textContent   = '$' + (100 * (100 - p) / 100).toFixed(2);
      // Update slider gradient
      if (sliderEl) {
        sliderEl.style.background = `linear-gradient(to right, var(--neon-green) 0%, var(--neon-green) ${p}%, rgba(255,255,255,0.1) ${p}%, rgba(255,255,255,0.1) 100%)`;
      }
    }

    slider?.addEventListener('input', (e) => {
      const p = parseInt(e.target.value);
      if (input) input.value = p;
      updateDiscountUI(p);
    });

    input?.addEventListener('input', (e) => {
      const p = parseInt(e.target.value);
      if (!isNaN(p)) updateDiscountUI(p);
    });

    document.getElementById('btn-save-discount')?.addEventListener('click', async () => {
      const btn    = document.getElementById('btn-save-discount');
      const status = document.getElementById('discount-save-status');
      const pct    = parseInt(document.getElementById('discount-input')?.value || state.discountPct);
      if (isNaN(pct) || pct < 1 || pct > 99) {
        showToast('Enter a valid discount between 1–99%', 'error'); return;
      }
      try {
        btn.disabled = true; btn.textContent = '⏳ Saving discount...';
        status.textContent = '⏳ Saving setting...';
        status.style.color = 'var(--text-muted)';

        // Step 1: save the % to site_settings
        await saveDiscount(pct);
        state.discountPct = pct;

        // Step 2: recalculate & write sale_price for every product in Supabase
        btn.textContent = '⏳ Updating prices...';
        status.textContent = '⏳ Recalculating all prices...';
        const { updated } = await bulkUpdateSalePrices(pct);

        // Step 3: reload inventory so the admin table reflects new prices
        await loadInventory();

        status.textContent = `✅ Done! ${updated} product${updated !== 1 ? 's' : ''} updated.`;
        status.style.color = 'var(--neon-green)';
        showToast(`✅ Discount set to ${pct}% — ${updated} prices updated`, 'success');
        setTimeout(() => { status.textContent = ''; }, 5000);
      } catch (err) {
        status.textContent = '❌ ' + err.message;
        status.style.color = '#ff4444';
        showToast('Failed to save discount: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '💾 Save Discount';
      }
    });

    document.getElementById('ts-test')?.addEventListener('click', async () => {
      const btn = document.getElementById('ts-test');
      const bot_token = document.getElementById('ts-token').value.trim();
      const chat_id = document.getElementById('ts-chat').value.trim();

      if (!bot_token || !chat_id) {
        showToast('Enter Token and Chat ID first', 'error');
        return;
      }

      try {
        const ogText = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = '⏳ Sending...';
        
        const res = await fetch('/api/telegram-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_token, chat_id })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          showToast('✅ Test message sent!', 'success');
        } else {
          showToast(`❌ Error: ${data.error}`, 'error');
        }
        btn.innerHTML = ogText;
        btn.disabled = false;
      } catch (err) {
        showToast('❌ Network error', 'error');
        btn.textContent = '💬 Send Test Message';
        btn.disabled = false;
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
      if (window.renderImagePreviewStrip) window.renderImagePreviewStrip();
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
      document.getElementById('f-image').value = '';
      if (window.renderImagePreviewStrip) window.renderImagePreviewStrip();
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

    // If the modal is currently open and saving, do NOT touch the DOM at all —
    // the save handler will call closeModal() and then we can update safely.
    const modal = document.getElementById('product-modal');
    const isSaving = modal && modal.dataset.saving === '1';
    if (isSaving) return;

    const tbody = document.getElementById('admin-table-body');
    if (tbody) {
      // Update table in-place so the modal is never torn down mid-operation
      renderTable();
      // Update the stat counters individually (they now have IDs)
      const stats = getStats();
      const el1 = document.getElementById('stat-total');
      const el2 = document.getElementById('stat-bundles');
      const el3 = document.getElementById('stat-value');
      if (el1) el1.textContent = stats.total;
      if (el2) el2.textContent = stats.bundles;
      if (el3) el3.textContent = formatPrice(stats.value);
    } else {
      // Table not in DOM — full re-render is safe since modal isn't open
      renderPage();
    }
  });

  renderPage();
}
