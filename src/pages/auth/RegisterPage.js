// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Register Page
// ═══════════════════════════════════════════════════════

import { createAuthLayout } from './AuthLayout.js';
import { registerUser, loginWithGoogleUser, isLoggedIn } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { showToast } from '../../components/Toast.js';

export function renderRegisterPage() {
  const container = document.getElementById('page-content');
  if (isLoggedIn()) { navigate('/dashboard'); return; }

  let showPassword = false;

  const content = `
    <!-- Social Authentication -->
    <div class="social-auth-grid stagger-up" style="animation-delay: 0.4s;">
      <button type="button" class="btn-social" id="btn-google-login">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"/></svg>
      </button>
      <button type="button" class="btn-social">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M16.36,10.91C16.33,8.08 18.66,6.67 18.78,6.59C17.44,4.6 15.3,4.31 14.59,4.27C12.79,4.08 11.02,5.34 10.09,5.34C9.16,5.34 7.72,4.29 6.23,4.32C4.33,4.35 2.58,5.43 1.6,7.15C-0.39,10.63 1.09,15.75 3.03,18.56C3.98,19.93 5.08,21.46 6.53,21.4C7.94,21.34 8.47,20.48 10.16,20.48C11.85,20.48 12.33,21.4 13.82,21.37C15.35,21.34 16.3,19.97 17.23,18.57C18.32,16.96 18.77,15.4 18.8,15.32C18.76,15.3 16.39,14.39 16.36,10.91M14.43,2.69C15.2,1.75 15.72,0.46 15.58,-0.82C14.47,-0.77 13.06,0.01 12.26,0.92C11.55,1.73 10.93,3.06 11.1,4.31C12.35,4.41 13.65,3.64 14.43,2.69Z"/></svg>
      </button>
      <button type="button" class="btn-social">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>
      </button>
    </div>

    <!-- Divider -->
    <div class="auth-divider stagger-up" style="animation-delay: 0.5s;"><span>or use direct registration</span></div>

    <form class="auth-form" id="register-form">
      <!-- Name -->
      <div class="form-group stagger-up" style="animation-delay: 0.6s;">
        <label>Producer Name</label>
        <div class="input-wrapper">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <input type="text" class="input" id="auth-name" placeholder="John Doe" required autocomplete="name" />
          <div class="focus-border"></div>
        </div>
      </div>

      <!-- Email -->
      <div class="form-group stagger-up" style="animation-delay: 0.7s;">
        <label>Email Address</label>
        <div class="input-wrapper">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <input type="email" class="input" id="auth-email" placeholder="producer@studio.com" required autocomplete="email" />
          <div class="focus-border"></div>
        </div>
      </div>

      <!-- Password -->
      <div class="form-group stagger-up" style="animation-delay: 0.8s;">
        <label>Password Setup</label>
        <div class="input-wrapper">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <input type="${showPassword ? 'text' : 'password'}" class="input" id="auth-password" placeholder="Create a secure key" required autocomplete="new-password" />
          <button type="button" class="password-eye-btn" id="toggle-pw-btn" aria-label="Toggle password" tabindex="-1">
            ${showPassword 
              ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><circle cx="12" cy="12" r="3"/></svg>' 
              : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'}
          </button>
          <div class="focus-border"></div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-auth-submit stagger-up" style="animation-delay: 0.9s;" id="register-submit-btn">
        Create Studio Account
      </button>
    </form>
    
    <div class="auth-footer stagger-up" style="animation-delay: 1.0s;">
      Already have keys? <a href="/login" class="auth-link">Initialize Session</a>
    </div>
  `;

  function render() {
    container.innerHTML = createAuthLayout(content, 'register');
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-google-login')?.addEventListener('click', async () => {
      try {
        await loginWithGoogleUser();
      } catch (err) {
        showToast('Google Sign In failed.', 'error');
      }
    });

    document.getElementById('toggle-pw-btn')?.addEventListener('click', () => {
      showPassword = !showPassword;
      const pwInput = document.getElementById('auth-password');
      if (pwInput) {
        pwInput.type = showPassword ? 'text' : 'password';
        
        const btn = document.getElementById('toggle-pw-btn');
        btn.innerHTML = showPassword 
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><circle cx="12" cy="12" r="3"/></svg>' 
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    });

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('auth-name').value;
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const btn = document.getElementById('register-submit-btn');
      
      const originalText = btn.innerText;
      btn.innerText = 'Initializing...';
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        await registerUser(email, password, name);
        showToast('System Authorized. Entering Studio.', 'success');
        setTimeout(() => navigate('/dashboard'), 600);
      } catch (err) {
        showToast(err.message || 'Creation failed. Verify credentials.', 'error');
        btn.innerText = originalText;
        btn.classList.remove('loading');
        btn.disabled = false;
        
        // Add error animation to inputs
        const inputs = document.querySelectorAll('.input-wrapper');
        inputs.forEach(i => {
          i.classList.remove('error-shake');
          void i.offsetWidth;
          i.classList.add('error-shake');
        });
      }
    });
  }

  render();
}
