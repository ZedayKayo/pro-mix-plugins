// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Order Success / Installation Guide Page
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
