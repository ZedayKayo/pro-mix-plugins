-- ═══════════════════════════════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — AFFILIATE PROGRAM SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this entire file in Supabase SQL Editor to set up the affiliate system.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE everywhere.
-- Last updated: 2026-07-17
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AFFILIATE SETTINGS TABLE  (single-row global config)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id                        INT PRIMARY KEY DEFAULT 1,
  global_commission_pct     NUMERIC(5,2)  DEFAULT 50.00,   -- default 50%
  cookie_duration_days      INTEGER       DEFAULT 30,       -- 30-day cookie
  min_payout_amount         NUMERIC(10,2) DEFAULT 20.00,    -- minimum $20
  auto_approve_applications BOOLEAN       DEFAULT false,
  fraud_click_threshold     INTEGER       DEFAULT 50,       -- clicks/hr before flag
  payout_methods            JSONB         DEFAULT '["BTC","ETH","USDT"]'::jsonb,
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read affiliate settings"   ON public.affiliate_settings;
DROP POLICY IF EXISTS "Admin manage affiliate settings"  ON public.affiliate_settings;
CREATE POLICY "Public read affiliate settings"   ON public.affiliate_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage affiliate settings"  ON public.affiliate_settings FOR ALL TO authenticated USING (true);

-- Seed default row
INSERT INTO public.affiliate_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.affiliate_settings TO anon, authenticated;
GRANT ALL    ON public.affiliate_settings TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AFFILIATES TABLE  (one row per affiliate application/profile)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Profile info
  username            TEXT UNIQUE,
  ref_code            TEXT UNIQUE,            -- e.g. AFF123 or their username
  bio                 TEXT,
  website_url         TEXT,
  promotion_channel   TEXT,                   -- 'YouTube' | 'Blog' | 'Discord' | etc.
  social_links        JSONB DEFAULT '{}'::jsonb,  -- { youtube, instagram, tiktok, twitter }
  -- Payment info
  payment_method      TEXT DEFAULT 'BTC',     -- 'BTC' | 'ETH' | 'USDT'
  payment_address     TEXT,                   -- crypto wallet address
  -- Commission override (NULL = use global setting)
  commission_pct      NUMERIC(5,2) DEFAULT NULL,
  -- Status
  status              TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'suspended'
  rejection_reason    TEXT,
  -- Timestamps
  applied_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at         TIMESTAMP WITH TIME ZONE,
  -- Flags
  is_fraudulent       BOOLEAN DEFAULT false,
  fraud_notes         TEXT
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own profile"   ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;
DROP POLICY IF EXISTS "Users can insert affiliate application" ON public.affiliates;
DROP POLICY IF EXISTS "Admin full access to affiliates"  ON public.affiliates;
CREATE POLICY "Affiliates can view own profile"   ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Affiliates can update own profile" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'approved'); -- can only update when approved
CREATE POLICY "Users can insert affiliate application" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admin can do everything (service_role bypasses RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AFFILIATE CLICKS TABLE  (one row per tracked click)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  ref_code     TEXT NOT NULL,
  -- Visitor info
  ip_address   TEXT,
  country      TEXT,
  city         TEXT,
  device       TEXT,     -- 'desktop' | 'mobile' | 'tablet'
  browser      TEXT,
  os           TEXT,
  -- Context
  referrer_url TEXT,
  landing_page TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  utm_content  TEXT,
  utm_term     TEXT,
  -- Tracking
  is_unique    BOOLEAN DEFAULT true,   -- first click from this IP for this affiliate
  is_flagged   BOOLEAN DEFAULT false,  -- suspicious activity
  session_id   TEXT,
  clicked_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own clicks"  ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Service role manage clicks"      ON public.affiliate_clicks;
CREATE POLICY "Affiliates can view own clicks"  ON public.affiliate_clicks FOR SELECT USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);
CREATE POLICY "Service role manage clicks"      ON public.affiliate_clicks FOR ALL USING (true);
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL    ON public.affiliate_clicks TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AFFILIATE COMMISSIONS TABLE  (one row per attributed sale)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id   UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  order_id       UUID REFERENCES public.orders(id)     ON DELETE SET NULL,
  -- Sale details
  order_amount   NUMERIC(10,2) NOT NULL,
  commission_pct NUMERIC(5,2)  NOT NULL,
  commission_amt NUMERIC(10,2) NOT NULL,
  -- Product snapshot (denormalized for history)
  product_names  TEXT,                    -- comma-joined product names
  customer_email TEXT,                    -- for admin reference
  -- Attribution
  click_id       UUID REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
  coupon_code    TEXT,                    -- if attributed via coupon not click
  -- Status
  status         TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'refunded' | 'paid'
  payout_id      UUID,                    -- filled when paid
  admin_note     TEXT,
  -- Timestamps
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at    TIMESTAMP WITH TIME ZONE,
  paid_at        TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates view own commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Service role manage commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates view own commissions" ON public.affiliate_commissions FOR SELECT USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);
CREATE POLICY "Service role manage commissions" ON public.affiliate_commissions FOR ALL USING (true);
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT ALL    ON public.affiliate_commissions TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AFFILIATE PAYOUTS TABLE  (payout batches)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id     UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  currency         TEXT DEFAULT 'USDT',
  wallet_address   TEXT,
  tx_hash          TEXT,                    -- blockchain transaction hash
  commission_ids   UUID[],                  -- array of commission IDs included
  status           TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'sent' | 'failed'
  admin_note       TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at          TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates view own payouts"  ON public.affiliate_payouts;
DROP POLICY IF EXISTS "Service role manage payouts"  ON public.affiliate_payouts;
CREATE POLICY "Affiliates view own payouts"  ON public.affiliate_payouts FOR SELECT USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);
CREATE POLICY "Service role manage payouts"  ON public.affiliate_payouts FOR ALL USING (true);
GRANT SELECT ON public.affiliate_payouts TO authenticated;
GRANT ALL    ON public.affiliate_payouts TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AFFILIATE COUPONS TABLE  (unique discount codes per affiliate)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_coupons (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id    UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  code            TEXT UNIQUE NOT NULL,       -- e.g. CREATOR10
  discount_pct    NUMERIC(5,2) DEFAULT 10.00, -- 10% discount for buyers
  usage_count     INTEGER DEFAULT 0,
  usage_limit     INTEGER DEFAULT NULL,       -- NULL = unlimited
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active coupons"   ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Affiliates view own coupons"  ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Service role manage coupons"  ON public.affiliate_coupons;
CREATE POLICY "Public read active coupons"   ON public.affiliate_coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Service role manage coupons"  ON public.affiliate_coupons FOR ALL USING (true);
GRANT SELECT ON public.affiliate_coupons TO anon, authenticated;
GRANT ALL    ON public.affiliate_coupons TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. AFFILIATE NOTIFICATIONS TABLE  (in-app notification queue)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_notifications (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id  UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,  -- NULL = admin
  type          TEXT NOT NULL,    -- 'new_sale' | 'commission_approved' | 'commission_rejected' | 'payout_sent' | 'new_application' | 'fraud_alert'
  title         TEXT NOT NULL,
  message       TEXT,
  link          TEXT,
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates view own notifications" ON public.affiliate_notifications;
DROP POLICY IF EXISTS "Service role manage notifications" ON public.affiliate_notifications;
CREATE POLICY "Affiliates view own notifications" ON public.affiliate_notifications FOR SELECT USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  OR affiliate_id IS NULL  -- admin notifications
);
CREATE POLICY "Service role manage notifications" ON public.affiliate_notifications FOR ALL USING (true);
GRANT SELECT, UPDATE ON public.affiliate_notifications TO authenticated;
GRANT ALL             ON public.affiliate_notifications TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. AFFILIATE ASSETS TABLE  (marketing resources)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_assets (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type        TEXT NOT NULL,      -- 'banner' | 'logo' | 'product_image' | 'email_template' | 'social_caption' | 'video'
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,      -- storage URL or text content
  thumbnail   TEXT,               -- preview image URL
  dimensions  TEXT,               -- e.g. '728x90' for banners
  tags        TEXT[],
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates read assets" ON public.affiliate_assets;
DROP POLICY IF EXISTS "Admin manage assets"    ON public.affiliate_assets;
CREATE POLICY "Affiliates read assets" ON public.affiliate_assets FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage assets"    ON public.affiliate_assets FOR ALL TO authenticated USING (true);
GRANT SELECT ON public.affiliate_assets TO anon, authenticated;
GRANT ALL    ON public.affiliate_assets TO service_role;

-- Seed some sample assets
INSERT INTO public.affiliate_assets (type, title, description, url, dimensions, tags) VALUES
  ('banner', 'ProMix Horizontal Banner (728×90)', 'Standard leaderboard banner for websites and blogs', 'https://promixplugins.com/assets/banner-728x90.png', '728x90', ARRAY['banner','web']),
  ('banner', 'ProMix Square Banner (300×250)', 'Medium rectangle — works great in sidebars', 'https://promixplugins.com/assets/banner-300x250.png', '300x250', ARRAY['banner','web']),
  ('logo', 'ProMix Logo (White, PNG)', 'High-resolution white logo on transparent background', 'https://promixplugins.com/assets/logo-white.png', NULL, ARRAY['logo','branding']),
  ('social_caption', 'Instagram/TikTok Caption Pack', 'Ready-to-post captions for promoting ProMix on social media', 'ProMix Plugins has completely changed my workflow 🎛️ Professional-grade plugins at a fraction of the cost. Use my link for an exclusive deal 👇 #musicproduction #mixing #plugins', NULL, ARRAY['social','instagram','tiktok']),
  ('email_template', 'Email Newsletter Template', 'Copy-paste HTML email to send to your subscribers', '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#111;color:#fff;padding:40px"><h1 style="color:#00ff88">🎛️ Level Up Your Mix</h1><p>Hey [name], I just discovered ProMix Plugins — they have pro-quality plugins at unbeatable prices. Click the link below to check them out (and get a special discount).</p><p><a href="[YOUR_REF_LINK]" style="background:#00ff88;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Shop ProMix Plugins →</a></p></body></html>', NULL, ARRAY['email','newsletter'])
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ADD affiliate_id COLUMN TO ORDERS TABLE  (for attribution)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='affiliate_id') THEN
    ALTER TABLE public.orders ADD COLUMN affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='coupon_code') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RPC: TRACK AFFILIATE CLICK  (called from Vercel edge function)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.track_affiliate_click(
  p_ref_code     TEXT,
  p_ip_address   TEXT  DEFAULT NULL,
  p_country      TEXT  DEFAULT NULL,
  p_city         TEXT  DEFAULT NULL,
  p_device       TEXT  DEFAULT NULL,
  p_browser      TEXT  DEFAULT NULL,
  p_os           TEXT  DEFAULT NULL,
  p_referrer_url TEXT  DEFAULT NULL,
  p_landing_page TEXT  DEFAULT NULL,
  p_utm_source   TEXT  DEFAULT NULL,
  p_utm_medium   TEXT  DEFAULT NULL,
  p_utm_campaign TEXT  DEFAULT NULL,
  p_utm_content  TEXT  DEFAULT NULL,
  p_utm_term     TEXT  DEFAULT NULL,
  p_session_id   TEXT  DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_affiliate    RECORD;
  v_is_unique    BOOLEAN;
  v_click_count  INTEGER;
  v_is_flagged   BOOLEAN := false;
BEGIN
  -- Find the affiliate by ref code
  SELECT a.*, aff_set.cookie_duration_days, aff_set.fraud_click_threshold
  INTO v_affiliate
  FROM public.affiliates a
  CROSS JOIN public.affiliate_settings aff_set
  WHERE a.ref_code = p_ref_code AND a.status = 'approved'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive referral code');
  END IF;

  -- Check if this IP has already clicked this affiliate's links today (deduplication)
  SELECT COUNT(*) INTO v_click_count
  FROM public.affiliate_clicks
  WHERE affiliate_id = v_affiliate.id
    AND ip_address = p_ip_address
    AND clicked_at > NOW() - INTERVAL '24 hours';

  v_is_unique := (v_click_count = 0);

  -- Fraud detection: >50 clicks per hour from same IP
  SELECT COUNT(*) INTO v_click_count
  FROM public.affiliate_clicks
  WHERE ip_address = p_ip_address
    AND clicked_at > NOW() - INTERVAL '1 hour';

  IF v_click_count >= v_affiliate.fraud_click_threshold THEN
    v_is_flagged := true;
  END IF;

  -- Insert click record
  INSERT INTO public.affiliate_clicks (
    affiliate_id, ref_code,
    ip_address, country, city, device, browser, os,
    referrer_url, landing_page,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    is_unique, is_flagged, session_id
  ) VALUES (
    v_affiliate.id, p_ref_code,
    p_ip_address, p_country, p_city, p_device, p_browser, p_os,
    p_referrer_url, p_landing_page,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
    v_is_unique, v_is_flagged, p_session_id
  );

  RETURN json_build_object(
    'success',          true,
    'affiliate_id',     v_affiliate.id,
    'cookie_duration',  v_affiliate.cookie_duration_days,
    'is_unique',        v_is_unique,
    'is_flagged',       v_is_flagged
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_affiliate_click TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RPC: ATTRIBUTE AFFILIATE SALE  (called after checkout)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.attribute_affiliate_sale(
  p_order_id       UUID,
  p_affiliate_id   UUID,
  p_order_amount   NUMERIC,
  p_product_names  TEXT   DEFAULT NULL,
  p_customer_email TEXT   DEFAULT NULL,
  p_click_id       UUID   DEFAULT NULL,
  p_coupon_code    TEXT   DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_commission_pct  NUMERIC;
  v_commission_amt  NUMERIC;
  v_global_pct      NUMERIC;
  v_affiliate_pct   NUMERIC;
  v_commission_id   UUID;
BEGIN
  -- Get global default commission %
  SELECT global_commission_pct INTO v_global_pct FROM public.affiliate_settings LIMIT 1;

  -- Check if affiliate has a personal override
  SELECT commission_pct INTO v_affiliate_pct FROM public.affiliates WHERE id = p_affiliate_id;

  -- Priority: affiliate override > global default
  v_commission_pct := COALESCE(v_affiliate_pct, v_global_pct, 50.00);
  v_commission_amt := ROUND((p_order_amount * v_commission_pct / 100), 2);

  -- Insert commission record
  INSERT INTO public.affiliate_commissions (
    affiliate_id, order_id, order_amount, commission_pct, commission_amt,
    product_names, customer_email, click_id, coupon_code, status
  ) VALUES (
    p_affiliate_id, p_order_id, p_order_amount, v_commission_pct, v_commission_amt,
    p_product_names, p_customer_email, p_click_id, p_coupon_code, 'pending'
  ) RETURNING id INTO v_commission_id;

  -- Link the affiliate to the order
  UPDATE public.orders SET affiliate_id = p_affiliate_id, coupon_code = p_coupon_code
  WHERE id = p_order_id;

  -- Create in-app notification for affiliate
  INSERT INTO public.affiliate_notifications (affiliate_id, type, title, message)
  VALUES (
    p_affiliate_id,
    'new_sale',
    '🎉 New Sale!',
    'You earned $' || v_commission_amt || ' commission on a $' || p_order_amount || ' order.'
  );

  RETURN json_build_object(
    'success',         true,
    'commission_id',   v_commission_id,
    'commission_pct',  v_commission_pct,
    'commission_amt',  v_commission_amt
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.attribute_affiliate_sale TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. RPC: GET AFFILIATE DASHBOARD STATS  (aggregated stats for dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_affiliate_stats(p_affiliate_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_clicks        INTEGER;
  v_unique_clicks       INTEGER;
  v_total_orders        INTEGER;
  v_confirmed_sales     NUMERIC;
  v_pending_sales       NUMERIC;
  v_commission_earned   NUMERIC;
  v_commission_paid     NUMERIC;
  v_commission_pending  NUMERIC;
  v_conversion_rate     NUMERIC;
  v_avg_order_value     NUMERIC;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_unique)
  INTO v_total_clicks, v_unique_clicks
  FROM public.affiliate_clicks WHERE affiliate_id = p_affiliate_id;

  SELECT
    COUNT(*),
    COALESCE(SUM(order_amount) FILTER (WHERE status IN ('approved','paid')), 0),
    COALESCE(SUM(order_amount) FILTER (WHERE status = 'pending'), 0),
    COALESCE(SUM(commission_amt) FILTER (WHERE status != 'rejected' AND status != 'refunded'), 0),
    COALESCE(SUM(commission_amt) FILTER (WHERE status = 'paid'), 0),
    COALESCE(SUM(commission_amt) FILTER (WHERE status = 'pending' OR status = 'approved'), 0),
    COALESCE(AVG(order_amount), 0)
  INTO v_total_orders, v_confirmed_sales, v_pending_sales,
       v_commission_earned, v_commission_paid, v_commission_pending, v_avg_order_value
  FROM public.affiliate_commissions WHERE affiliate_id = p_affiliate_id;

  v_conversion_rate := CASE WHEN v_total_clicks > 0
    THEN ROUND((v_total_orders::NUMERIC / v_total_clicks * 100), 2)
    ELSE 0
  END;

  RETURN json_build_object(
    'total_clicks',        v_total_clicks,
    'unique_clicks',       v_unique_clicks,
    'total_orders',        v_total_orders,
    'confirmed_sales',     v_confirmed_sales,
    'pending_sales',       v_pending_sales,
    'commission_earned',   v_commission_earned,
    'commission_paid',     v_commission_paid,
    'commission_pending',  v_commission_pending,
    'conversion_rate',     v_conversion_rate,
    'avg_order_value',     v_avg_order_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_affiliate_stats TO authenticated, service_role;
