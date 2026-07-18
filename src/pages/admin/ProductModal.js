// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Admin Panel â€” Product Add/Edit Modal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
import { getBrandList, categories } from '../../data/products.js';
import { autoFillPluginData } from '../../services/aiService.js';
import { saveProduct } from '../../core/store.js';
import { showToast } from '../../components/Toast.js';
import { supabase } from '../../lib/supabase.js';

/**
 * ensureModal(state, closeModal)
 * Creates and appends the product add/edit modal to document.body.
 * Returns the modal element.
 */
export   function ensureModal() {
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
          <button type="button" id="modal-close-x" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; line-height:1;">âœ•</button>
        </div>

        <form id="product-form" style="display:flex; flex-direction:column; overflow:hidden; flex:1; min-height:0;">
          
          <!-- BODY (Scrollable) -->
          <div style="padding:var(--space-lg) var(--space-xl); overflow-y:auto; flex:1;">
            
            <!-- QUICK FILL UI -->
            <div style="background:rgba(0,255,136,0.07); padding:var(--space-md); border-radius:var(--radius-md); margin-bottom:var(--space-lg); border:1px solid rgba(0,255,136,0.2);">
              <label class="text-sm" style="color:var(--neon-green); font-weight:600; display:block; margin-bottom:var(--space-xs);">ðŸª„ Quick Fill â€” AI Auto-Fill</label>
              <p class="text-xs text-secondary" style="margin:0 0 var(--space-xs) 0;">Paste a plugin name, any product URL, or a <strong style="color:var(--neon-blue);">RuTracker link</strong> â€” AI will extract &amp; translate all data automatically.</p>
              <div style="display:flex; gap:var(--space-sm);">
                <input type="text" class="input" id="f-quick-fill" placeholder="e.g. FabFilter Pro-Q 3  â€”orâ€”  https://rutracker.org/forum/viewtopic.php?t=..." style="flex:1;" />
                <button type="button" class="btn btn-primary" id="btn-quick-fill" style="white-space:nowrap;">âœ¨ Auto-Fill</button>
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
                  <label for="f-image-upload" class="btn btn-ghost" style="padding:0 12px; font-size:0.8rem; cursor:pointer; margin:0; white-space:nowrap; display:flex; align-items:center; border:1px solid var(--border-primary);" title="Upload Files">ðŸ“ Upload</label>
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
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">MSRP (Original Price $)</label>
                <input type="number" class="input" id="f-price" min="0" step="0.01" value="0" placeholder="0" />
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Sale Price (âˆ’<span id="modal-discount-label">${state.discountPct}</span>% OFF)</label>
                <input type="number" class="input" id="f-saleprice" min="0" step="0.01" value="0" placeholder="0" />
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
              <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                <div>
                  <h4 style="margin:0 0 4px 0; color:#ff6b2b;">Secure Download Files (Private)</h4>
                  <p class="text-xs text-secondary" style="margin:0;">These paths will only be exposed to users holding a valid license.</p>
                </div>
                <label for="f-dl-all-input" class="btn" id="btn-upload-all" style="cursor:pointer; background:rgba(255,107,43,0.15); border:1px solid rgba(255,107,43,0.5); color:#ff6b2b; font-size:12px; padding:6px 14px; display:flex; align-items:center; gap:6px; white-space:nowrap; margin:0;">
                  ðŸ“¦ Upload All Files at Once
                </label>
                <input type="file" id="f-dl-all-input" multiple style="display:none;"
                  accept=".exe,.zip,.dmg,.pkg,.deb,.tar.gz,.tar,.gz,.pdf,.vsix,.vst3" />
              </div>
              <!-- Per-file progress bar (hidden by default) -->
              <div id="bulk-upload-status" style="grid-column:span 2; display:none; flex-direction:column; gap:4px; font-size:12px;"></div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Windows (.exe / .zip)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="input" id="f-dl-win" placeholder="Bucket path or URL" style="flex:1;" />
                  <button type="button" class="btn btn-secondary upload-btn" data-target="f-dl-win" style="padding: 0 12px; font-size:12px;">Upload</button>
                </div>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">macOS (.dmg / .pkg)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="input" id="f-dl-mac" placeholder="Bucket path or URL" style="flex:1;" />
                  <button type="button" class="btn btn-secondary upload-btn" data-target="f-dl-mac" style="padding: 0 12px; font-size:12px;">Upload</button>
                </div>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Linux (.tar.gz / .deb)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="input" id="f-dl-linux" placeholder="Bucket path or URL" style="flex:1;" />
                  <button type="button" class="btn btn-secondary upload-btn" data-target="f-dl-linux" style="padding: 0 12px; font-size:12px;">Upload</button>
                </div>
              </div>
              <div>
                <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">User Manual (.pdf)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="input" id="f-dl-manual" placeholder="Bucket path or URL" style="flex:1;" />
                  <button type="button" class="btn btn-secondary upload-btn" data-target="f-dl-manual" style="padding: 0 12px; font-size:12px;">Upload</button>
                </div>
              </div>
              <!-- Hidden input for single-file per-button uploads -->
              <input type="file" id="f-dl-file-input" style="display:none;" />
            </div>

            <div style="display:flex; gap:var(--space-lg); padding:var(--space-sm) 0;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-isfeatured" /> <span style="color:var(--neon-purple);">â˜… Featured</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-istrending" /> <span style="color:var(--neon-blue);">ðŸ”¥ Trending</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="f-isnew" /> <span style="color:var(--neon-green);">âœ¨ New</span>
              </label>
            </div>
            
          </div>

          <!-- FOOTER (Fixed) -->
          <div style="padding:var(--space-md) var(--space-xl); border-top:1px solid var(--border-primary); background:var(--bg-card); display:flex; gap:var(--space-sm); justify-content:flex-end; z-index:10; flex-shrink:0;">
            <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="modal-submit">ðŸ’¾ Save Product</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modalEl);

    // â”€â”€ ALL modal events attached ONCE here â€” they read `state` at event time â”€â”€

    // Close X button
    modalEl.querySelector('#modal-close-x')?.addEventListener('click', closeModal);

    // Cancel button
    modalEl.querySelector('#modal-cancel')?.addEventListener('click', closeModal);

    // â”€â”€ Upload Logic â”€â”€
    const fileInput = modalEl.querySelector('#f-dl-file-input');
    let currentUploadTarget = null;
    let currentUploadBtn = null;

    modalEl.querySelectorAll('.upload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentUploadTarget = btn.dataset.target;
        currentUploadBtn = btn;
        fileInput.click();
      });
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !currentUploadTarget || !currentUploadBtn) return;

      const nameField = document.getElementById('f-name');
      const slug = (nameField?.value || 'plugin').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${slug}/${fileName}`;

      const originalText = currentUploadBtn.textContent;
      currentUploadBtn.textContent = 'â³ 0%';
      currentUploadBtn.disabled = true;

      // â”€â”€ Use service role key so RLS is fully bypassed for admin uploads â”€â”€
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceKey  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceKey) {
        showToast('âŒ Upload failed: VITE_SUPABASE_SERVICE_ROLE_KEY is missing from your .env file.', 'error');
        currentUploadBtn.textContent = originalText;
        currentUploadBtn.disabled = false;
        fileInput.value = '';
        return;
      }

      // â”€â”€ Raw XHR upload â€” gives real progress events that fetch() does not â”€â”€
      const uploadUrl = `${supabaseUrl}/storage/v1/object/plugin-downloads/${filePath}`;

      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl, true);
          xhr.setRequestHeader('Authorization', `Bearer ${serviceKey}`);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.setRequestHeader('x-upsert', 'true'); // allow overwrite if same path exists

          // Live progress counter in the button
          xhr.upload.addEventListener('progress', (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              currentUploadBtn.textContent = `â³ ${pct}%`;
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let msg = `HTTP ${xhr.status}`;
              try { msg = JSON.parse(xhr.responseText)?.message || msg; } catch {}
              reject(new Error(msg));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error â€” check your internet connection.')));
          xhr.addEventListener('timeout', () => reject(new Error('Upload timed out after 10 minutes.')));
          xhr.timeout = 600000; // 10 min

          xhr.send(file);
        });

        // Public URL is deterministic â€” no extra request needed
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/plugin-downloads/${filePath}`;
        document.getElementById(currentUploadTarget).value = publicUrl;
        showToast(`âœ… Upload complete! (${(file.size / 1024 / 1024).toFixed(1)} MB)`, 'success');

      } catch (err) {
        console.error('Upload error:', err);
        showToast(`âŒ Upload failed: ${err.message}`, 'error');
      } finally {
        currentUploadBtn.textContent = originalText;
        currentUploadBtn.disabled = false;
        fileInput.value = '';
      }
    });

    // â”€â”€ Bulk Upload All Files at Once â”€â”€
    const allFilesInput = modalEl.querySelector('#f-dl-all-input');
    allFilesInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceKey  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        showToast('âŒ VITE_SUPABASE_SERVICE_ROLE_KEY missing from .env', 'error');
        return;
      }

      // Auto-detect which slot each file belongs to by extension
      const detectTarget = (filename) => {
        const n = filename.toLowerCase();
        if (n.endsWith('.pdf'))                          return 'f-dl-manual';
        if (n.endsWith('.dmg') || n.endsWith('.pkg'))   return 'f-dl-mac';
        if (n.endsWith('.deb') || n.endsWith('.tar.gz') || n.endsWith('.tar') || n.endsWith('.gz')) return 'f-dl-linux';
        if (n.endsWith('.exe') || n.endsWith('.zip') || n.endsWith('.msi')) return 'f-dl-win';
        return null; // unrecognised â€” skip
      };

      const nameField = document.getElementById('f-name');
      const slug = (nameField?.value || 'plugin').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';

      // Show bulk status panel
      const statusPanel = document.getElementById('bulk-upload-status');
      statusPanel.style.display = 'flex';
      statusPanel.innerHTML = '';

      // Build a status row per file
      const rows = {};
      const uploadTasks = [];

      for (const file of files) {
        const targetId = detectTarget(file.name);
        if (!targetId) {
          const row = document.createElement('div');
          row.style.cssText = 'color:#aaa; padding:2px 0;';
          row.textContent = `âš ï¸ ${file.name} â€” unrecognised extension, skipped`;
          statusPanel.appendChild(row);
          continue;
        }

        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:8px;';
        row.innerHTML = `
          <span style="min-width:120px; color:var(--text-secondary);">${file.name.length > 24 ? file.name.slice(0,21)+'...' : file.name}</span>
          <div style="flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
            <div id="bar-${targetId}" style="height:100%; width:0%; background:#ff6b2b; border-radius:4px; transition:width 0.2s;"></div>
          </div>
          <span id="pct-${targetId}" style="min-width:36px; text-align:right; color:#ff6b2b;">0%</span>
        `;
        statusPanel.appendChild(row);
        rows[targetId] = row;

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `${slug}/${fileName}`;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/plugin-downloads/${filePath}`;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/plugin-downloads/${filePath}`;

        uploadTasks.push(
          new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadUrl, true);
            xhr.setRequestHeader('Authorization', `Bearer ${serviceKey}`);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.setRequestHeader('x-upsert', 'true');
            xhr.timeout = 600000;

            xhr.upload.addEventListener('progress', (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                const bar = document.getElementById(`bar-${targetId}`);
                const lbl = document.getElementById(`pct-${targetId}`);
                if (bar) bar.style.width = pct + '%';
                if (lbl) lbl.textContent = pct + '%';
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Fill the corresponding URL field
                const field = document.getElementById(targetId);
                if (field) field.value = publicUrl;
                // Mark row green
                const lbl = document.getElementById(`pct-${targetId}`);
                const bar = document.getElementById(`bar-${targetId}`);
                if (lbl) { lbl.textContent = 'âœ…'; lbl.style.color = 'var(--neon-green)'; }
                if (bar) bar.style.background = 'var(--neon-green)';
                resolve({ targetId, publicUrl });
              } else {
                let msg = `HTTP ${xhr.status}`;
                try { msg = JSON.parse(xhr.responseText)?.message || msg; } catch {}
                const lbl = document.getElementById(`pct-${targetId}`);
                if (lbl) { lbl.textContent = 'âŒ'; lbl.style.color = '#ff4444'; }
                reject(new Error(`${file.name}: ${msg}`));
              }
            });

            xhr.addEventListener('error',   () => reject(new Error(`${file.name}: Network error`)));
            xhr.addEventListener('timeout', () => reject(new Error(`${file.name}: Timed out`)));
            xhr.send(file);
          })
        );
      }

      if (!uploadTasks.length) {
        statusPanel.style.display = 'none';
        allFilesInput.value = '';
        return;
      }

      showToast(`ðŸ“¦ Uploading ${uploadTasks.length} file(s) in parallel...`, 'info');

      const results = await Promise.allSettled(uploadTasks);
      const failed  = results.filter(r => r.status === 'rejected');
      const passed  = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        showToast(`âœ… All ${passed.length} file(s) uploaded successfully!`, 'success');
      } else {
        showToast(`âš ï¸ ${passed.length} uploaded, ${failed.length} failed: ${failed.map(r=>r.reason?.message).join(' | ')}`, 'error');
      }

      allFilesInput.value = '';
    });

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
          <button type="button" class="img-delete-btn" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.7); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:50%; width:22px; height:22px; font-size:12px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">âœ•</button>
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

    // MSRP â†’ auto-calc sale price (uses live discount %)
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
        btn.textContent = 'â³ Optimizing Images...';
        
        const base64Strings = await Promise.all(files.map(compressImage));
        
        const el = document.getElementById('f-image');
        const cur = el.value.trim();
        
        // Append new strings to the bottom of the list
        const newLines = base64Strings.join('\n');
        el.value = cur ? cur + '\n' + newLines : newLines;
        window.renderImagePreviewStrip();
        
      } catch (err) {
        showToast('âŒ Failed to process images.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = ogText;
        e.target.value = ''; // Reset input
      }
    });

    // Quick Fill â€” AI auto-fill
    modalEl.querySelector('#btn-quick-fill')?.addEventListener('click', async () => {
      const inputVal = document.getElementById('f-quick-fill').value.trim();
      if (!inputVal) { showToast('Enter a plugin name or URL first', 'error'); return; }
      const statusEl = document.getElementById('quick-fill-status');
      const btn = document.getElementById('btn-quick-fill');
      try {
        btn.disabled = true; btn.textContent = 'â³ Loading...';
        statusEl.style.display = 'block';
        const isRuTracker = inputVal.includes('rutracker.org');
        statusEl.textContent = isRuTracker
          ? 'ðŸŒ Fetching RuTracker page & translating from Russian...'
          : 'ðŸ¤– AI is analyzing...';
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
          if (data.specs.download_linux) document.getElementById('f-dl-linux').value = data.specs.download_linux;
          if (data.specs.download_manual) document.getElementById('f-dl-manual').value = data.specs.download_manual;
        }
        if (data.systemReqs) {
          document.getElementById('f-req-os').value = data.systemReqs.os || '';
          document.getElementById('f-req-ram').value = data.systemReqs.ram || '';
          document.getElementById('f-req-cpu').value = data.systemReqs.cpu || '';
          document.getElementById('f-req-disk').value = data.systemReqs.disk || '';
        }

        statusEl.textContent = 'âœ… Done! Review and save.'; statusEl.style.color = 'var(--neon-green)';
        showToast('Data extracted!', 'success');
      } catch (err) {
        statusEl.textContent = 'âŒ ' + err.message; statusEl.style.color = '#ff4444';
        showToast('Auto-fill failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'âœ¨ Auto-Fill';
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
          download_linux: document.getElementById('f-dl-linux').value.trim(),
          download_manual: document.getElementById('f-dl-manual').value.trim(),
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
        btn.textContent = 'â³ Saving...';

        // Race against a 20s timeout â€” prevents button getting permanently stuck
        // if the Supabase connection drops or stalls mid-request
        const saveTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(
            'Save timed out (20s). Check your network or Supabase connection and try again.'
          )), 20000)
        );
        await Promise.race([saveProduct(productToSave), saveTimeout]);

        showToast(isEditing ? 'âœ… Product Updated!' : 'âœ… Product Added!', 'success');
        closeModal();
      } catch (err) {
        console.error("Save product UI catch:", err);
        showToast('âŒ ' + (err.message || 'Failed to save â€” Unknown error'), 'error');
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

export   function openModal() {
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
      document.getElementById('f-dl-linux').value = sp.download_linux || '';
      document.getElementById('f-dl-manual').value = sp.download_manual || '';

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
