import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/components/product-card.css';
import './styles/pages/home.css';
import './styles/pages/store.css';
import './styles/pages/product.css';
import './styles/pages/cart.css';
import './styles/pages/checkout.css';
import './styles/pages/card-checkout.css';
import './styles/pages/dashboard.css';
import './styles/pages/auth.css';
import './styles/pages/comparison.css';
import './styles/animations.css';

import { initStore } from './core/store.js';
import { initRouter, registerRoute } from './core/router.js';

import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { initCartDrawer } from './components/CartDrawer.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderStorePage } from './pages/StorePage.js';
import { renderProductPage } from './pages/ProductPage.js';
import { renderCartPage } from './pages/CartPage.js';
import { renderCheckoutPage } from './pages/CheckoutPage.js';
import { renderCardCheckoutPage } from './pages/CardCheckoutPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderAdminPanel } from './pages/AdminPanelPage.js';
import { renderLoginPage } from './pages/auth/LoginPage.js';
import { renderRegisterPage } from './pages/auth/RegisterPage.js';
import { renderForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
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

  // Initialize universal cart drawer
  initCartDrawer();

  // Register Routes
  registerRoute('/', () => renderHomePage());
  registerRoute('/store', (params) => renderStorePage(params));
  registerRoute('/product/:slug', (params) => renderProductPage(params));
  registerRoute('/cart', () => renderCartPage());
  registerRoute('/checkout', () => renderCheckoutPage());
  registerRoute('/checkout/card', () => renderCardCheckoutPage());
  registerRoute('/dashboard', () => renderDashboardPage());
  registerRoute('/admin', (params) => renderAdminPanel(params));
  registerRoute('/login', () => renderLoginPage());
  registerRoute('/register', () => renderRegisterPage());
  registerRoute('/forgot-password', () => renderForgotPasswordPage());
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
