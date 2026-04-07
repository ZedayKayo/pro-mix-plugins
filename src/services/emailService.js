// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Mock Transactional Email Service
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
  showEmailDispatchedNotification(emailAddress);
  
  return { success: true };
}

function showEmailDispatchedNotification(email) {
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
      <div style="font-weight: 700; color: var(--neon-green); margin-bottom: 2px;">Email Delivered!</div>
      <div style="font-size: 13px; color: var(--text-secondary);">
        Order receipt and download links sent to <strong style="color:white;">${email}</strong>
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
