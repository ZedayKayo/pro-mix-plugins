// ═══════════════════════════════════════════════════════
// Afford Plugins — Order Success / Installation Guide Page
// ═══════════════════════════════════════════════════════

import { navigate } from '../core/router.js';
import { getUser } from '../core/store.js';

export function renderOrderSuccessPage() {
  const container = document.getElementById('page-content');

  // Read purchased items saved by checkout page
  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem('pm_last_order') || 'null');
  } catch {}

  const user = getUser();
  const items = order?.items || [];

  const isFree = order?.isFree || (items.length > 0 && items.every(item => (item.salePrice || item.price) === 0));

  if (isFree) {
    container.innerHTML = `
      <div class="os-page">
        <!-- Ambient glowing orbs -->
        <div class="os-orb os-orb-1"></div>
        <div class="os-orb os-orb-2"></div>
        <div class="os-orb os-orb-3"></div>

        <div class="os-hero animate-fade-in-up">
          <div class="os-hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
            </svg>
            DOWNLOAD READY
          </div>

          <h1 class="os-hero-title" style="margin-top: 1rem;">Choose Your Download</h1>
          <p class="os-hero-sub">
            ${user?.name ? `Hey ${user.name}! ` : ''}Your free plugin${items.length > 1 ? 's are' : ' is'} ready. Select your operating system below to begin downloading.
          </p>

          <div class="os-free-downloads" style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
            ${items.map(item => {
              const hasWin = item.specs?.download_win && item.specs.download_win !== '#';
              const hasMac = item.specs?.download_mac && item.specs.download_mac !== '#';
              const hasLinux = item.specs?.download_linux && item.specs.download_linux !== '#';
              const hasManual = item.specs?.download_manual && item.specs.download_manual !== '#';

              return `
              <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 1.5rem; width: 100%; max-width: 600px; text-align: center;">
                <h3 style="margin-bottom: 1rem; color: var(--neon-green);">${item.name}</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; align-items: center;">
                  ${hasWin ? `
                    <button class="btn btn-primary" style="font-size: 16px; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.open('${item.specs.download_win}', '_blank')">
                      <svg width="20" height="20" viewBox="0 0 88 88" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 12.4L35.6 7.60001V41.6H0V12.4ZM40 7.20001L88 0V41.6H40V7.20001ZM0 45.6H35.6V79.2L0 74V45.6ZM40 45.6H88V87.2L40 80V45.6Z"/></svg>
                      Windows
                    </button>
                  ` : ''}
                  ${hasMac ? `
                    <button class="btn btn-primary" style="font-size: 16px; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.open('${item.specs.download_mac}', '_blank')">
                      <span style="font-size: 20px; line-height: 1; display: flex;">🍏</span> iOS / macOS
                    </button>
                  ` : ''}
                  ${hasLinux ? `
                    <button class="btn btn-primary" style="font-size: 16px; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.open('${item.specs.download_linux}', '_blank')">
                      <span style="font-size: 20px; line-height: 1; display: flex;">🐧</span> Linux
                    </button>
                  ` : ''}
                  ${hasManual ? `
                    <button class="btn btn-ghost" style="font-size: 16px; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,0.2);" onclick="window.open('${item.specs.download_manual}', '_blank')">
                      <span style="font-size: 20px; line-height: 1; display: flex;">📄</span> User Manual (PDF)
                    </button>
                  ` : ''}
                  ${(!hasWin && !hasMac && !hasLinux && !hasManual) ? `
                    <div style="color: var(--text-secondary); font-size: 0.85rem; padding: var(--space-md); border: 1px dashed rgba(255,255,255,0.15); border-radius: var(--radius-md); background: rgba(255,255,255,0.02); width: 100%;">
                      <div style="font-size: 1.5rem; margin-bottom: 8px;">⏳</div>
                      Sorry, there are no downloadable links available for this plugin yet. <br/>
                      <span style="color: var(--neon-blue);">We are currently working on adding them!</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            }).join('')}

            <div class="os-free-instructions" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 1.5rem; width: 100%; max-width: 600px; text-align: left; margin-top: 1rem;">
              <h3 style="color: var(--neon-green); margin-bottom: 1.2rem; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🔧</span> Installation Instructions
              </h3>
              
              <div style="margin-bottom: 1.2rem;">
                <strong>1. Extract the Archive</strong>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px; line-height: 1.5;">Extract the zip you downloaded and you will see the plugin file. The format depends on your OS:</p>
                <ul style="color: var(--text-secondary); font-size: 14px; margin-top: 4px; margin-left: 1.5rem; line-height: 1.5;">
                  <li><strong>Windows:</strong> <code>.dll</code> (VST2) or <code>.vst3</code></li>
                  <li><strong>macOS:</strong> <code>.vst</code>, <code>.vst3</code>, or <code>.component</code> (AU)</li>
                  <li><strong>Linux:</strong> <code>.so</code> or <code>.vst3</code></li>
                </ul>
              </div>

              <div style="margin-bottom: 1.2rem;">
                <strong>2. Move to Plugin Folder</strong>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px; line-height: 1.5;">Drag the extracted plugin file into your system's default plugin folder:</p>
                <ul style="color: var(--text-secondary); font-size: 14px; margin-top: 4px; margin-left: 1.5rem; line-height: 1.5;">
                  <li><strong>Win (VST3):</strong> <code>C:\\Program Files\\Common Files\\VST3</code></li>
                  <li><strong>Mac (VST3):</strong> <code>/Library/Audio/Plug-Ins/VST3</code></li>
                  <li><strong>Mac (AU):</strong> <code>/Library/Audio/Plug-Ins/Components</code></li>
                  <li><strong>Linux (VST3):</strong> <code>~/.vst3</code> or <code>/usr/lib/vst3</code></li>
                </ul>
              </div>

              <div>
                <strong>3. Open up your DAW and enjoy!</strong>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px; line-height: 1.5;">Rescan your plugins in your DAW settings, load it onto a track, and start creating.</p>
              </div>
            </div>
          </div>

          <div class="os-footer-btns" style="margin-top: 3rem; justify-content: center;">
            <button class="btn btn-ghost" id="os-go-store">Browse More Plugins</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('os-go-store')?.addEventListener('click', () => navigate('/store'));
    return;
  }

  const steps = [
    {
      num: '01',
      icon: '🔗',
      title: 'Install uTorrent',
      color: '#00d4ff',
      glow: 'rgba(0,212,255,0.2)',
      badge: 'REQUIRED',
      badgeColor: '#00d4ff',
      content: `
        <p>uTorrent is needed to download the plugin files via magnet links.</p>
        <a href="https://www.utorrent.com/downloads/win" target="_blank" rel="noopener"
           class="os-install-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Download uTorrent for Windows
        </a>
        <div class="os-tip">After installing, open uTorrent once so it registers as the default for magnet links.</div>
      `
    },
    {
      num: '02',
      icon: '🛡️',
      title: 'Disable Antivirus & Windows Defender',
      color: '#ff6b2b',
      glow: 'rgba(255,107,43,0.2)',
      badge: 'CRITICAL',
      badgeColor: '#ff6b2b',
      content: `
        <p>Antivirus software will flag crack files as threats. <strong>Disable it before downloading.</strong></p>
        <div class="os-steps-inner">
          <div class="os-inner-step">
            <span class="os-inner-num">A</span>
            <span>Press <kbd>Win + I</kbd> → <strong>Privacy & Security</strong> → <strong>Windows Security</strong> → <strong>Virus & threat protection</strong></span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">B</span>
            <span>Click <strong>"Manage settings"</strong> under Virus & threat protection settings</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">C</span>
            <span>Toggle <strong>Real-time protection → OFF</strong></span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">D</span>
            <span>Also add your <strong>Downloads folder</strong> to exclusions for permanent bypass</span>
          </div>
        </div>
        <div class="os-warning">⚠️ Re-enable Defender after installation is complete for general security.</div>
      `
    },
    {
      num: '03',
      icon: '⬇️',
      title: 'Download Your Plugin',
      color: '#00ff88',
      glow: 'rgba(0,255,136,0.2)',
      badge: 'ACTION',
      badgeColor: '#00ff88',
      content: `
        <p>Go to your dashboard and click the download button for your plugin. This opens a magnet link in uTorrent.</p>
        <a href="/dashboard" class="os-install-link os-install-link-green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Go to My Dashboard
        </a>
        <div class="os-tip">The torrent will start downloading automatically. Wait for it to reach <strong>100%</strong> before continuing.</div>
      `
    },
    {
      num: '04',
      icon: '📦',
      title: 'Extract the Archive',
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.2)',
      badge: 'STEP',
      badgeColor: '#a855f7',
      content: `
        <p>The downloaded folder will contain a <code>.rar</code>, <code>.zip</code>, or <code>.7z</code> archive.</p>
        <div class="os-steps-inner">
          <div class="os-inner-step">
            <span class="os-inner-num">A</span>
            <span>Install <strong>WinRAR</strong> or <strong>7-Zip</strong> if you don't have it</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">B</span>
            <span>Right-click the archive → <strong>"Extract Here"</strong> or <strong>"Extract to [folder name]"</strong></span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">C</span>
            <span>If prompted for a password, try: <code class="os-code">www.vsthunt.com</code> or <code class="os-code">audioz.download</code></span>
          </div>
        </div>
      `
    },
    {
      num: '05',
      icon: '🔧',
      title: 'Run the Installer',
      color: '#facc15',
      glow: 'rgba(250,204,21,0.2)',
      badge: 'STEP',
      badgeColor: '#facc15',
      content: `
        <p>Inside the extracted folder, find the <code>setup.exe</code> or <code>install.exe</code> file.</p>
        <div class="os-steps-inner">
          <div class="os-inner-step">
            <span class="os-inner-num">A</span>
            <span>Right-click the installer → <strong>"Run as Administrator"</strong></span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">B</span>
            <span>Follow the installation wizard. Note the <strong>install path</strong> (default is usually OK)</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">C</span>
            <span><strong>Do NOT open the plugin yet</strong> after install — apply the crack first</span>
          </div>
        </div>
      `
    },
    {
      num: '06',
      icon: '💉',
      title: 'Apply the Crack',
      color: '#ff3b5c',
      glow: 'rgba(255,59,92,0.2)',
      badge: 'KEY STEP',
      badgeColor: '#ff3b5c',
      content: `
        <p>The extracted folder contains a <strong>Crack</strong> or <strong>Patch</strong> subfolder.</p>
        <div class="os-steps-inner">
          <div class="os-inner-step">
            <span class="os-inner-num">A</span>
            <span>Open the <code>Crack/</code> folder inside your extracted archive</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">B</span>
            <span>Copy all files inside it (<kbd>Ctrl+A</kbd> → <kbd>Ctrl+C</kbd>)</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">C</span>
            <span>Navigate to the plugin's install directory (e.g., <code>C:\Program Files\[Plugin Name]</code>)</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">D</span>
            <span>Paste and <strong>replace</strong> existing files (<kbd>Ctrl+V</kbd> → confirm overwrite)</span>
          </div>
        </div>
        <div class="os-warning">⚠️ If Windows blocks the paste, make sure Defender is still off from Step 2.</div>
      `
    },
    {
      num: '07',
      icon: '🎛️',
      title: 'Launch in Your DAW',
      color: '#00ff88',
      glow: 'rgba(0,255,136,0.2)',
      badge: 'DONE',
      badgeColor: '#00ff88',
      content: `
        <p>Open your DAW and scan for new plugins.</p>
        <div class="os-steps-inner">
          <div class="os-inner-step">
            <span class="os-inner-num">A</span>
            <span>In your DAW settings, run a <strong>VST plugin scan</strong></span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">B</span>
            <span>The plugin should appear in your VST list — add it to a track</span>
          </div>
          <div class="os-inner-step">
            <span class="os-inner-num">C</span>
            <span>If it asks for activation — click <strong>"Try / Use offline"</strong> or enter any serial</span>
          </div>
        </div>
        <div class="os-tip">🎉 You're set! Need help? Contact our support team.</div>
      `
    }
  ];

  container.innerHTML = `
    <div class="os-page">

      <!-- Ambient glowing orbs -->
      <div class="os-orb os-orb-1"></div>
      <div class="os-orb os-orb-2"></div>
      <div class="os-orb os-orb-3"></div>

      <!-- ── HERO ── -->
      <div class="os-hero animate-fade-in-up">
        <div class="os-hero-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
          </svg>
          PURCHASE CONFIRMED
        </div>

        <div class="os-hero-icon">
          <div class="os-hero-ring os-hero-ring-1"></div>
          <div class="os-hero-ring os-hero-ring-2"></div>
          <div class="os-hero-ring os-hero-ring-3"></div>
          <span class="os-hero-emoji">🎉</span>
        </div>

        <h1 class="os-hero-title">Access Unlocked!</h1>
        <p class="os-hero-sub">
          ${user?.name ? `Hey ${user.name}! ` : ''}Your ${items.length > 1 ? `${items.length} plugins are` : 'plugin is'} ready.
          Follow the guide below to install and activate.
        </p>

        ${(order?.guestEmail || user?.email) ? `
          <div style="background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.2); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: var(--space-xl); display: inline-flex; align-items: center; gap: 12px; font-size: 14px; text-align: left;">
            <div style="font-size: 20px;">📧</div>
            <div>
              <div style="color: var(--neon-green); font-weight: 600; margin-bottom: 2px;">Receipt & Download Links Sent</div>
              <div style="color: var(--text-secondary);">We've emailed a backup copy of your order to <strong style="color:white">${order?.guestEmail || user?.email}</strong>.</div>
            </div>
          </div>
        ` : ''}

        ${items.length > 0 ? `
        <div class="os-purchased-items">
          ${items.map(item => `
            <div class="os-purchased-chip">
              <span class="os-purchased-chip-dot"></span>
              ${item.name}
            </div>
          `).join('')}
        </div>` : ''}

        <div class="os-hero-stats">
          <div class="os-stat"><span class="os-stat-n">7</span><span class="os-stat-l">Steps</span></div>
          <div class="os-stat-divider"></div>
          <div class="os-stat"><span class="os-stat-n">~10</span><span class="os-stat-l">Minutes</span></div>
          <div class="os-stat-divider"></div>
          <div class="os-stat"><span class="os-stat-n">100%</span><span class="os-stat-l">Working</span></div>
        </div>
      </div>

      <!-- ── PROGRESS TRACK ── -->
      <div class="os-track-container animate-fade-in-up">
        <div class="os-track-line"></div>
        ${steps.map((s, i) => `
          <div class="os-track-dot" style="left:${(i / (steps.length - 1)) * 100}%; background:${s.color}; box-shadow: 0 0 12px ${s.glow};" title="${s.title}"></div>
        `).join('')}
      </div>

      <!-- ── STEPS ── -->
      <div class="os-steps-container">
        ${steps.map((s, i) => `
          <div class="os-step animate-fade-in-up" style="animation-delay:${i * 0.08}s;">
            <div class="os-step-left">
              <div class="os-step-num-wrap" style="border-color:${s.color}20; background: linear-gradient(135deg, ${s.color}15, transparent);">
                <span class="os-step-num" style="color:${s.color};">${s.num}</span>
              </div>
              ${i < steps.length - 1 ? `<div class="os-step-connector" style="background: linear-gradient(to bottom, ${s.color}40, transparent);"></div>` : ''}
            </div>
            <div class="os-step-body">
              <div class="os-step-header">
                <span class="os-step-icon">${s.icon}</span>
                <h3 class="os-step-title" style="color:${s.color};">${s.title}</h3>
                <span class="os-step-badge" style="color:${s.badgeColor}; border-color:${s.badgeColor}40; background:${s.badgeColor}10;">${s.badge}</span>
              </div>
              <div class="os-step-content">
                ${s.content}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ── FOOTER CTA ── -->
      <div class="os-footer-cta animate-fade-in-up">
        <div class="os-footer-glow"></div>
        <h3>🎛️ You're All Set!</h3>
        <p>Your plugins are now fully activated. Start making music.</p>
        <div class="os-footer-btns">
          <button class="btn btn-primary" id="os-go-dashboard">View My Dashboard</button>
          <button class="btn btn-ghost" id="os-go-store">Browse More Plugins</button>
        </div>
        <div class="os-support-note">
          Having trouble? <a href="/support">Contact support</a> — we'll help you get it working.
        </div>
      </div>

    </div>
  `;

  // Events
  document.getElementById('os-go-dashboard')?.addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('os-go-store')?.addEventListener('click', () => navigate('/store'));
}
