import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';

import { initStore } from './core/store.js';
import { initRouter, registerRoute } from './core/router.js';

import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderStorePage } from './pages/StorePage.js';
import { renderProductPage } from './pages/ProductPage.js';
import { renderCartPage } from './pages/CartPage.js';
import { renderCheckoutPage } from './pages/CheckoutPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderAdminPanel } from './pages/AdminPanelPage.js';
import { renderAuthPage } from './pages/AuthPage.js';
import { renderComparisonsPage, renderComparisonDetailPage } from './pages/ComparisonPage.js';
import { renderAboutPage, renderFaqPage, renderSupportPage, renderRefundPolicyPage, renderContactPage } from './pages/InfoPages.js';

async function bootstrap() {
  await initStore();

  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div id="toast-container"></div>
    <div id="header-container"></div>
    <main id="page-content" class="page-transition"></main>
    <div id="footer-container"></div>
  `;

  document.getElementById('header-container').innerHTML = renderHeader();
  if (typeof initHeaderEvents === 'function') initHeaderEvents();
  
  document.getElementById('footer-container').innerHTML = renderFooter();

  // Register Routes
  registerRoute('/', () => renderHomePage());
  registerRoute('/store', (params) => renderStorePage(params));
  registerRoute('/product/:slug', (params) => renderProductPage(params));
  registerRoute('/cart', () => renderCartPage());
  registerRoute('/checkout', () => renderCheckoutPage());
  registerRoute('/dashboard', () => renderDashboardPage());
  registerRoute('/admin', (params) => renderAdminPanel(params));
  registerRoute('/login', () => renderAuthPage());
  registerRoute('/compare', () => renderComparisonsPage());
  registerRoute('/compare/:slug', (params) => renderComparisonDetailPage(params));

  // Info pages
  registerRoute('/about', () => renderAboutPage());
  registerRoute('/faq', () => renderFaqPage());
  registerRoute('/support', () => renderSupportPage());
  registerRoute('/refunds', () => renderRefundPolicyPage());
  registerRoute('/contact', () => renderContactPage());

  initRouter('#page-content');
}

bootstrap();
