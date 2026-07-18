// ═══════════════════════════════════════════════════════
// Afford Plugins — Mock Transactional Email Service
// Simulates order fulfillment via Resend/SendGrid.
// ═══════════════════════════════════════════════════════

import { showToast } from '../components/Toast.js';

/**
 * Simulates sending an order confirmation / fulfillment email.
 * @param {string} emailAddress - Recipient email
 * @param {Array} items - Cart items
 * @param {string} orderId - System order ID
 */
export async function sendOrderConfirmation(emailAddress, items, orderId) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1500));

  console.log(`[MOCK EMAIL SERVICE] Email dispatched successfully to: ${emailAddress}`);
  console.log(`[MOCK EMAIL SERVICE] Payload included ${items.length} items for Order #${orderId}`);

  // Create a highly visible bespoke DOM overlay notification confirming email sent
  showEmailDispatchedNotification(emailAddress, 'Order Receipt Delivered!', `Order receipt and download links sent to <strong style="color:white;">${emailAddress}</strong>`);
  
  return { success: true };
}

/**
 * Simulates affiliate registration email.
 */
export async function sendAffiliateApplicationReceived(emailAddress) {
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[MOCK EMAIL SERVICE] Affiliate Application Received sent to: ${emailAddress}`);
  showEmailDispatchedNotification(emailAddress, 'Application Received!', `We received your affiliate application for <strong style="color:white;">${emailAddress}</strong>`);
  return { success: true };
}

/**
 * Simulates affiliate status change email (approve/reject).
 */
export async function sendAffiliateStatusChanged(emailAddress, status, reason = '') {
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[MOCK EMAIL SERVICE] Affiliate Status update [${status}] sent to: ${emailAddress}`);
  const title = status === 'approved' ? 'Welcome to Afford Plugins Affiliates!' : 'Application Update';
  const desc = status === 'approved' 
    ? `Your application was approved! Start promoting now.`
    : `Application not approved. Reason: ${reason}`;
  showEmailDispatchedNotification(emailAddress, title, desc);
  return { success: true };
}

/**
 * Simulates sale attribution email.
 */
export async function sendAffiliateSaleNotification(emailAddress, amount) {
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[MOCK EMAIL SERVICE] Commission sale attributed email sent to: ${emailAddress}`);
  showEmailDispatchedNotification(emailAddress, 'New Commission Earned! 💰', `You earned <strong style="color:white;">$${amount.toFixed(2)}</strong> commission!`);
  return { success: true };
}

/**
 * Simulates payout sent confirmation email.
 */
export async function sendAffiliatePayoutNotification(emailAddress, amount, address) {
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[MOCK EMAIL SERVICE] Payout dispatched email sent to: ${emailAddress}`);
  showEmailDispatchedNotification(emailAddress, 'Payout Dispatched! 💸', `A payout of <strong style="color:white;">$${amount.toFixed(2)}</strong> was sent to your wallet.`);
  return { success: true };
}

function showEmailDispatchedNotification(email, title, bodyHTML) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: var(--bg-card);
    border: 1px solid var(--neon-green);
    box-shadow: 0 10px 40px rgba(0,255,136,0.2);
    border-radius: var(--radius-lg);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 100000;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;
  
  popup.innerHTML = `
    <div style="font-size: 24px;">📧</div>
    <div>
      <div style="font-weight: 700; color: var(--neon-green); margin-bottom: 2px;">${title}</div>
      <div style="font-size: 13px; color: var(--text-secondary);">
        ${bodyHTML}
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  requestAnimationFrame(() => {
    popup.style.transform = 'translateX(-50%) translateY(0)';
    popup.style.opacity = '1';
  });
  
  setTimeout(() => {
    popup.style.transform = 'translateX(-50%) translateY(-20px)';
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 400);
  }, 4500);
}

