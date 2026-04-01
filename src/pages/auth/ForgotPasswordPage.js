// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Forgot Password Page
// ═══════════════════════════════════════════════════════

import { createAuthLayout } from './AuthLayout.js';
import { navigate } from '../../core/router.js';
import { showToast } from '../../components/Toast.js';
import { resetPasswordUser } from '../../core/store.js';

export function renderForgotPasswordPage() {
  const container = document.getElementById('page-content');

  const content = `
    <div class="auth-message stagger-up" style="animation-delay: 0.4s;">
      Enter your studio email and we'll send you instructions to reset your access key.
    </div>

    <form class="auth-form" id="forgot-pw-form">
      <!-- Email -->
      <div class="form-group stagger-up" style="animation-delay: 0.5s;">
        <label>Email Address</label>
        <div class="input-wrapper">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <input type="email" class="input" id="auth-email-reset" placeholder="producer@studio.com" required autocomplete="email" />
          <div class="focus-border"></div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-auth-submit stagger-up" style="animation-delay: 0.6s;" id="reset-submit-btn">
        Send Reset Link
      </button>
    </form>
    
    <div class="auth-footer stagger-up" style="animation-delay: 0.7s;">
      Remembered your key? <a href="/login" class="auth-link">Return to Login</a>
    </div>
  `;

  function render() {
    container.innerHTML = createAuthLayout(content, 'forgot_pw');
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('forgot-pw-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email-reset').value;
      const btn = document.getElementById('reset-submit-btn');
      
      const originalText = btn.innerText;
      btn.innerText = 'Transmitting...';
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        await resetPasswordUser(email);
        showToast('Reset link sent to ' + email, 'success');
        btn.innerText = 'Link Sent!';
        btn.classList.remove('loading');
        btn.classList.add('btn-success');
        
        setTimeout(() => {
          btn.innerText = originalText;
          btn.classList.remove('btn-success');
          btn.disabled = false;
        }, 3000);
      } catch (err) {
        showToast(err.message || 'Error executing request.', 'error');
        btn.innerText = originalText;
        btn.classList.remove('loading');
        btn.disabled = false;
        
        const inputWrap = document.querySelector('.input-wrapper');
        if (inputWrap) {
          inputWrap.classList.remove('error-shake');
          void inputWrap.offsetWidth;
          inputWrap.classList.add('error-shake');
        }
      }
    });
  }

  render();
}
