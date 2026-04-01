// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Custom Auth Layout Wrapper
// ═══════════════════════════════════════════════════════

export function createAuthLayout(contentHtml, mode = 'login') {
  return `
    <div class="auth-page-wrapper animate-fade-in">
      
      <!-- DAW-Inspired Studio Background Effects -->
      <div class="studio-ambient-bg"></div>
      <div class="waveform-bg-animation"></div>
      


      <!-- Centered Premium Glass Card -->
      <div class="auth-card-container">
        <div class="auth-card stagger-up" style="animation-delay: 0.2s;">
          
          <div class="auth-header stagger-up" style="animation-delay: 0.3s;">
            <p class="tagline">Unlock Pro Sound</p>
            <h3>${mode === 'login' ? 'Studio Access' : mode === 'register' ? 'Join The Studio' : 'Reset Credentials'}</h3>
          </div>
          
          <div class="auth-content">
            ${contentHtml}
          </div>

        </div>
      </div>
    </div>
  `;
}
