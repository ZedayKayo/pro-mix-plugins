// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Auth Page (Login / Register)
// ═══════════════════════════════════════════════════════

import { loginUser, registerUser, isLoggedIn } from '../core/store.js';
import { navigate } from '../core/router.js';
import { showToast } from '../components/Toast.js';

export function renderAuthPage() {
  const container = document.getElementById('page-content');
  if (isLoggedIn()) { navigate('/dashboard'); return; }

  let mode = 'login';

  function render() {
    container.innerHTML = `
      <div class="section">
        <div class="auth-container animate-fade-in-up">
          <div class="auth-card">
            <div style="text-align:center; margin-bottom: var(--space-xl);">
              <span style="font-size:32px;">⚡</span>
              <h3 style="margin-top: var(--space-sm);">
                ${mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p class="text-sm text-secondary">
                ${mode === 'login' ? 'Sign in to access your plugins' : 'Join to start downloading plugins'}
              </p>
            </div>
            <div class="auth-tabs" id="auth-tabs">
              <button class="auth-tab ${mode === 'login' ? 'active' : ''}" data-mode="login">Sign In</button>
              <button class="auth-tab ${mode === 'register' ? 'active' : ''}" data-mode="register">Register</button>
            </div>
            <form class="auth-form" id="auth-form">
              ${mode === 'register' ? '<label>Name</label><input type="text" class="input" id="auth-name" placeholder="Your name" required />' : ''}
              <label>Email</label>
              <input type="email" class="input" id="auth-email" placeholder="you@example.com" required />
              <label>Password</label>
              <input type="password" class="input" id="auth-password" placeholder="••••••••" required />
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top: var(--space-sm);">
                ${mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div class="auth-divider">or</div>
            <button class="btn btn-ghost" style="width:100%;" id="demo-login-btn">
              ⚡ Demo Login (Skip)
            </button>
          </div>
        </div>
      </div>`;

    document.querySelectorAll('#auth-tabs .auth-tab').forEach(t => {
      t.addEventListener('click', () => { mode = t.dataset.mode; render(); });
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const name = document.getElementById('auth-name')?.value;
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = 'Please wait...';
      btn.disabled = true;

      try {
        if (mode === 'login') {
          await loginUser(email, password);
          showToast('Signed in successfully!', 'success');
        } else {
          await registerUser(email, password, name);
          showToast('Account created!', 'success');
        }
        navigate('/dashboard');
      } catch (err) {
        showToast(err.message || 'Authentication failed', 'error');
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });

    document.getElementById('demo-login-btn')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.innerText;
      btn.innerText = 'Logging in...';
      btn.disabled = true;
      try {
        await loginUser('demo@promix.com', 'demo123!');
        showToast('Demo login successful!', 'success');
        navigate('/dashboard');
      } catch (err) {
        showToast('Demo account needs to be created in Supabase first!', 'error');
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  }
  render();
}
