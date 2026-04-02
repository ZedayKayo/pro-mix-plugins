-- ═══════════════════════════════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — COMPLETE MASTER SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this entire file in Supabase SQL Editor to set up or re-create the DB.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE everywhere.
-- Last updated: 2026-04-02
-- Changes tracked:
--   2026-03-xx  Initial schema (products, profiles, carts, orders, licenses)
--   2026-04-01  Added telegram_settings, visitor_sessions, event_logs
--   2026-04-01  Added notification_logs table
--   2026-04-02  Changed default credits: 50 → 20 (1 credit = $1 USD)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS (required for uuid_generate_v4 and gen_random_bytes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE,
  developer        TEXT,
  brand            TEXT,
  category         TEXT,
  subcategory      TEXT,
  type             TEXT[],
  daw_compat       TEXT[],
  price            NUMERIC(10, 2),
  sale_price       NUMERIC(10, 2),
  crypto_prices    JSONB,
  rating           NUMERIC(3, 1),
  reviews          INTEGER,
  description      TEXT,
  short_desc       TEXT,
  features         TEXT[],
  specs            JSONB,
  system_reqs      JSONB,
  images           TEXT[],
  audio_demo       TEXT,
  video_demo       TEXT,
  product_page     TEXT,
  is_featured      BOOLEAN DEFAULT false,
  is_trending      BOOLEAN DEFAULT false,
  is_new           BOOLEAN DEFAULT false,
  release_date     DATE,
  version          TEXT,
  color            TEXT,
  tags             TEXT[],
  cpu_usage_level  TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- Anyone can read products
CREATE POLICY "Allow public read access"        ON public.products FOR SELECT USING (true);
-- Only authenticated users (admin) can write
CREATE POLICY "Allow authenticated insert"      ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update"      ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete"      ON public.products FOR DELETE TO authenticated USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE  (linked 1:1 to auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name       TEXT,
  email      TEXT UNIQUE,
  credits    INTEGER DEFAULT 20,  -- $20 welcome credit (1 credit = $1 USD)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 20);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER CARTS TABLE  (supports both anonymous sessions + authenticated users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_carts (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,  -- used for anonymous / guest carts
  items      JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total          NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,           -- 'credits' | 'BTC' | 'ETH' | 'USDT'
  status         TEXT DEFAULT 'pending',  -- 'pending' | 'completed'
  items          JSONB NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LICENSES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.licenses (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id)  ON DELETE CASCADE NOT NULL,
  product_id  TEXT REFERENCES public.products(id)  ON DELETE CASCADE NOT NULL,
  order_id    UUID REFERENCES public.orders(id)    ON DELETE CASCADE,
  serial_key  TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PRODUCT FILES TABLE  (secure download paths per OS/format)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_files (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id    TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  os_type       TEXT NOT NULL,          -- 'Windows' | 'macOS'
  format        TEXT NOT NULL,          -- 'VST3' | 'AU' | 'AAX' | 'Installer'
  storage_path  TEXT NOT NULL,
  version       TEXT DEFAULT '1.0.0',
  size_mb       NUMERIC,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. SECURE CHECKOUT RPC
-- Runs server-side: validates prices, deducts credits, creates order + licenses.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.checkout_cart(
  p_user_id        UUID,
  p_items          JSONB,
  p_payment_method TEXT,
  p_use_credits    BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_total             NUMERIC := 0;
  v_item              JSONB;
  v_product           RECORD;
  v_order_id          UUID;
  v_user_credits      INTEGER;
  v_remaining_credits INTEGER;
  v_serial            TEXT;
BEGIN
  -- Re-calculate total from DB prices (never trust client-sent prices)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item->>'id';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'id';
    END IF;
    v_total := v_total + COALESCE(v_product.sale_price, v_product.price);
  END LOOP;

  -- Deduct credits if used (1 credit = $1)
  IF p_use_credits THEN
    SELECT credits INTO v_user_credits FROM public.profiles WHERE id = p_user_id;
    IF v_user_credits >= v_total THEN
      v_remaining_credits := v_user_credits - v_total;
      UPDATE public.profiles SET credits = v_remaining_credits WHERE id = p_user_id;
      v_total := 0;
    ELSE
      v_total := v_total - v_user_credits;
      UPDATE public.profiles SET credits = 0 WHERE id = p_user_id;
    END IF;
  END IF;

  -- Create order record
  INSERT INTO public.orders (user_id, total, payment_method, status, items)
  VALUES (
    p_user_id, v_total, p_payment_method,
    CASE WHEN p_use_credits THEN 'completed' ELSE 'pending' END,
    p_items
  )
  RETURNING id INTO v_order_id;

  -- Generate license keys (only for credit/instant payments)
  IF p_use_credits THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_serial := 'PMX-' ||
        right(encode(gen_random_bytes(4), 'hex'), 4) || '-' ||
        right(encode(gen_random_bytes(4), 'hex'), 4) || '-' ||
        right(encode(gen_random_bytes(4), 'hex'), 4);
      INSERT INTO public.licenses (user_id, product_id, order_id, serial_key)
      VALUES (p_user_id, v_item->>'id', v_order_id, upper(v_serial));
    END LOOP;
  END IF;

  -- Clear user cart after successful checkout
  DELETE FROM public.user_carts WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success',       true,
    'order_id',      v_order_id,
    'total_charged', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TELEGRAM SETTINGS TABLE  (single-row config)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id               INT PRIMARY KEY DEFAULT 1,
  bot_token        TEXT,
  chat_id          TEXT,
  is_enabled       BOOLEAN DEFAULT false,
  notify_all_pages BOOLEAN DEFAULT true,
  tracked_pages    JSONB DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
-- Only authenticated users (admin) can read/write
CREATE POLICY "Admins can view telegram settings"   ON public.telegram_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update telegram settings" ON public.telegram_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can insert telegram settings" ON public.telegram_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default row (safe to re-run)
INSERT INTO public.telegram_settings (id, is_enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. VISITOR SESSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  session_id  TEXT PRIMARY KEY,
  ip_address  TEXT,
  country     TEXT,
  city        TEXT,
  browser     TEXT,
  os          TEXT,
  first_seen  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_views  INT DEFAULT 1,
  is_bot      BOOLEAN DEFAULT false
);

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
-- Service role (API) has full access; anon/public have none
CREATE POLICY "Service roles can manage visitor sessions"
  ON public.visitor_sessions FOR ALL USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. EVENT LOGS TABLE  (one row per page view)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_logs (
  id         SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES public.visitor_sessions(session_id),
  page_url   TEXT,
  referrer   TEXT,
  user_id    UUID REFERENCES public.profiles(id) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service roles can manage event logs"
  ON public.event_logs FOR ALL USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NOTIFICATION LOGS TABLE
-- Tracks every Telegram notification attempt (type, page, location, success).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id            SERIAL PRIMARY KEY,
  session_id    TEXT,
  message_type  TEXT,     -- 'new_visitor' | 'page_view' | 'order'
  page_url      TEXT,
  country       TEXT,
  city          TEXT,
  browser       TEXT,
  os            TEXT,
  telegram_ok   BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service roles can manage notification logs"
  ON public.notification_logs FOR ALL USING (true);
