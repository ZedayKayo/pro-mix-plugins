// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Footer Component
// ═══════════════════════════════════════════════════════

export function renderFooter() {
  return `
    <footer class="site-footer" id="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/" class="header-logo" style="margin-bottom: var(--space-sm); display: inline-flex;">
              <img src="/images/logo.png" alt="ProMix" style="height: 34px; width: auto;" />
            </a>
            <p>Professional audio plugins crafted for producers, engineers, and artists. Pushing the boundaries of digital sound since 2023.</p>
            <div class="footer-social">
              <a href="#" title="Twitter / X">𝕏</a>
              <a href="#" title="YouTube">▶</a>
              <a href="#" title="Discord">💬</a>
              <a href="#" title="Instagram">📷</a>
            </div>
          </div>

          <div class="footer-col">
            <h5>Products</h5>
            <a href="/store">All Plugins</a>
            <a href="/store?category=eq">Equalizers</a>
            <a href="/store?category=compressor">Compressors</a>
            <a href="/store?category=reverb">Reverbs</a>
            <a href="/store?category=synth">Synthesizers</a>
            <a href="/store?category=mastering">Mastering</a>
          </div>

          <div class="footer-col">
            <h5>Support</h5>
            <a href="#">Documentation</a>
            <a href="#">Installation Guide</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact Us</a>
            <a href="/support">Support Center</a>
            <a href="/compare">Plugin Comparisons</a>
          </div>

          <div class="footer-col">
            <h5>Company</h5>
            <a href="/about">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="/refund">Refund Policy</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© 2026 ProMix Plugins. All rights reserved.</span>
          <div class="footer-crypto">
            <span>We accept:</span>
            <span class="crypto-icon" title="Bitcoin" style="color: #f7931a;">₿</span>
            <span class="crypto-icon" title="Ethereum" style="color: #627eea;">Ξ</span>
            <span class="crypto-icon" title="Tether" style="color: #26a17b;">₮</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
