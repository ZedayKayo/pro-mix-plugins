export function renderSettingsTab(state) {
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
            <span>1%</span><span>50%</span><span>99%</span>
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

      <!-- CONTACT & SOCIAL LINKS -->
      <div class="glass-panel" style="padding:var(--space-xl); border-radius:var(--radius-lg); border:1px solid rgba(0,212,255,0.15);">
        <h3 style="margin:0 0 4px 0;">📱 Contact &amp; Social Links</h3>
        <p class="text-sm text-secondary" style="margin:0 0 var(--space-xl) 0;">
          Update your Discord, Telegram, and Support Email. These links are used in the footer and contact pages.
        </p>

        <div style="display:grid; grid-template-columns:1fr; gap:var(--space-md); margin-bottom:var(--space-lg);">
          <div>
            <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Discord Invite Link</label>
            <input type="url" class="input" id="ss-discord" value="${state.siteSettings?.discord_link || ''}" placeholder="https://discord.gg/..." />
            <p class="text-xs text-muted" style="margin-top:4px;">💡 Tip: Set your invite to <strong>"Never Expire"</strong> in Discord settings.</p>
          </div>
          <div>
            <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Telegram Link</label>
            <input type="url" class="input" id="ss-telegram" value="${state.siteSettings?.telegram_link || ''}" placeholder="https://t.me/..." />
          </div>
          <div>
            <label class="text-sm text-secondary" style="display:block; margin-bottom:4px;">Support Email</label>
            <input type="email" class="input" id="ss-email" value="${state.siteSettings?.support_email || ''}" placeholder="support@yourdomain.com" />
          </div>
        </div>

        <div style="display:flex; gap:var(--space-md); align-items:center;">
          <button class="btn btn-primary" id="btn-save-site-settings" style="min-width:160px;">💾 Save Links</button>
          <span id="site-settings-save-status" class="text-sm"></span>
        </div>
      </div>

    </div>
  `;
}

export function bindSettingsAdminTabEvents(state, showToast, saveDiscount, bulkUpdateSalePrices, loadInventory, updateSiteSettings, loadSiteSettings) {
  const slider = document.getElementById('discount-slider');
  const input  = document.getElementById('discount-input');
  const previewPct = document.getElementById('discount-preview-pct');
  const previewPay = document.getElementById('discount-preview-pay');
  const exampleEl  = document.getElementById('discount-example');

  function updateDiscountUI(pct) {
    const p = Math.max(1, Math.min(99, Math.round(pct)));
    if (slider)     slider.value = p;
    if (input)      input.value  = p;
    if (previewPct) previewPct.textContent = p + '%';
    if (previewPay) previewPay.textContent  = (100 - p) + '%';
    if (exampleEl)  exampleEl.textContent   = '$' + (100 * (100 - p) / 100).toFixed(2);
    if (slider) {
      slider.style.background = `linear-gradient(to right, var(--neon-green) 0%, var(--neon-green) ${p}%, rgba(255,255,255,0.1) ${p}%, rgba(255,255,255,0.1) 100%)`;
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

      await saveDiscount(pct);
      state.discountPct = pct;

      btn.textContent = '⏳ Updating prices...';
      status.textContent = '⏳ Recalculating all prices...';
      const { updated } = await bulkUpdateSalePrices(pct);

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

  document.getElementById('btn-save-site-settings')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-site-settings');
    const status = document.getElementById('site-settings-save-status');
    const settings = {
      discord_link: document.getElementById('ss-discord')?.value.trim() || '',
      telegram_link: document.getElementById('ss-telegram')?.value.trim() || '',
      support_email: document.getElementById('ss-email')?.value.trim() || ''
    };
    try {
      btn.disabled = true; btn.textContent = '⏳ Saving...';
      await updateSiteSettings(settings);
      state.siteSettings = settings;
      await loadSiteSettings(); // Sync global store
      status.textContent = '✅ Saved!';
      status.style.color = 'var(--neon-green)';
      showToast('Site settings updated!', 'success');
      setTimeout(() => { if (status) status.textContent = ''; }, 3000);
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
      status.textContent = '❌ Error';
      status.style.color = '#ff4444';
    } finally {
      btn.disabled = false; btn.textContent = '💾 Save Links';
    }
  });
}
