// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — SPA Router (History API)
// ═══════════════════════════════════════════════════════

import { fetchSessionProfile } from '../services/dbService.js';
import { isLoggedIn } from './store.js';

const routes = {};
let currentPage = null;
let pageContainer = null;
let debounceTrackTimeout = null;

// UUID Generator for reliable Session IDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getVisitorSessionId() {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
}

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

export function getCurrentPath() {
  return window.location.pathname || '/';
}

let handleRoute;

export function initRouter(containerSelector) {
  pageContainer = document.querySelector(containerSelector);

  handleRoute = () => {
    const path = getCurrentPath();
    const { handler, params } = matchRoute(path);

    if (handler) {
      // Toggle global header/footer visibility for full-screen immersive auth page
      const headerContainer = document.getElementById('header-container');
      const footerContainer = document.getElementById('footer-container');
      
      if (path === '/login' || path === '/register' || path === '/forgot-password' || path === '/checkout/card') {
        if ((path === '/login' || path === '/register' || path === '/forgot-password') && isLoggedIn()) {
          navigate('/dashboard');
          return;
        }
        if (headerContainer) headerContainer.style.display = 'none';
        if (footerContainer) footerContainer.style.display = 'none';
        if (pageContainer) pageContainer.style.marginTop = '0';

      } else {
        if (headerContainer) headerContainer.style.display = '';
        if (footerContainer) footerContainer.style.display = '';
        if (pageContainer) pageContainer.style.marginTop = '';
      }

      // Page transition
      if (pageContainer) {
        pageContainer.classList.remove('page-enter');
        void pageContainer.offsetWidth; // trigger reflow
        pageContainer.classList.add('page-enter');
      }
      
      handler(params);
      currentPage = path;
      
      // Update active nav links
      document.querySelectorAll('.header-nav a').forEach(link => {
        const href = link.getAttribute('href');
        // Handle both relative hash links (if any remain) and absolute paths
        const linkPath = href.startsWith('#') ? href.replace('#', '') : href;
        if (linkPath === path || (path === '/' && linkPath === '/')) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Track Visitor Navigation
      clearTimeout(debounceTrackTimeout);
      debounceTrackTimeout = setTimeout(async () => {
        try {
          const profile = await fetchSessionProfile();
          const sid = getVisitorSessionId();
          const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);

          // We don't need to block rendering for this
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sid,
              path: window.location.pathname,
              referrer: document.referrer || null,
              userId: profile?.id || null,
              isBot
            })
          }).catch(err => { /* fail silently, it's just analytics */ });
        } catch (e) {}
      }, 500); // 500ms debounce

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 404 - redirect to home
      navigate('/');
    }
  };

  window.addEventListener('popstate', handleRoute);

  // Intercept all internal link clicks
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href')?.startsWith('/')) {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    } else if (link && link.getAttribute('href')?.startsWith('#/')) {
      // Gracefully handle legacy hash links by stripping hash
      e.preventDefault();
      navigate(link.getAttribute('href').replace('#', ''));
    }
  });

  // Handle initial route
  handleRoute();
}

function matchRoute(path) {
  // Exact match first
  if (routes[path]) {
    return { handler: routes[path], params: {} };
  }

  // Pattern matching (e.g., /product/:slug)
  for (const pattern of Object.keys(routes)) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    
    const regex = new RegExp(`^${regexStr}$`);
    const match = path.match(regex);
    
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { handler: routes[pattern], params };
    }
  }

  return { handler: null, params: {} };
}

export default { registerRoute, navigate, initRouter, getCurrentPath };
