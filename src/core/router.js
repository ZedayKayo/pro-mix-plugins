// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — SPA Router (History API)
// ═══════════════════════════════════════════════════════

const routes = {};
let currentPage = null;
let pageContainer = null;

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
