export function renderTelegramTab(state) {
  return `
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
  `;
}

export function bindTelegramAdminTabEvents(state, renderPage, showToast, updateTelegramSettings) {
  document.getElementById('ts-save')?.addEventListener('click', async () => {
    const btn = document.getElementById('ts-save');
    const status = document.getElementById('ts-status');
    const settings = {
      bot_token: document.getElementById('ts-token')?.value.trim() || '',
      chat_id: document.getElementById('ts-chat')?.value.trim() || '',
      is_enabled: document.getElementById('ts-enabled')?.checked ?? false,
      notify_all_pages: document.getElementById('ts-all-pages')?.checked ?? true,
    };
    try {
      const ogText = btn.textContent;
      btn.disabled = true; btn.textContent = '⏳ Saving...';
      if (status) { status.textContent = '⏳ Saving...'; status.style.color = 'var(--text-muted)'; }
      await updateTelegramSettings(settings);
      state.telegramSettings = { ...state.telegramSettings, ...settings };
      if (status) { status.textContent = '✅ Saved!'; status.style.color = 'var(--neon-green)'; }
      showToast('Telegram settings saved!', 'success');
      setTimeout(() => { if (status) status.textContent = ''; }, 3000);
      btn.disabled = false; btn.textContent = ogText;
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
      if (status) { status.textContent = '❌ Error'; status.style.color = '#ff4444'; }
      btn.disabled = false; btn.textContent = '💾 Save Config';
    }
  });

  document.getElementById('ts-verify')?.addEventListener('click', async () => {
    const btn = document.getElementById('ts-verify');
    try {
      btn.disabled = true; btn.textContent = '⏳ Verifying...';
      const bot_token = document.getElementById('ts-token')?.value.trim() || state.telegramSettings?.bot_token || '';
      const res = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        state.botInfo = data.result;
        renderPage();
        showToast(`✅ Bot verified: @${data.result.username}`, 'success');
      } else {
        showToast(`❌ Invalid token: ${data.description}`, 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = '🔍 Verify Connection';
    }
  });

  document.getElementById('ts-test')?.addEventListener('click', async () => {
    const btn = document.getElementById('ts-test');
    const bot_token = document.getElementById('ts-token')?.value.trim();
    const chat_id = document.getElementById('ts-chat')?.value.trim();
    if (!bot_token || !chat_id) {
      showToast('Enter Token and Chat ID first', 'error');
      return;
    }
    try {
      const ogText = btn.innerHTML;
      btn.disabled = true; btn.textContent = '⏳ Sending...';
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
