-- ═══════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — Secure Backend Schema Update
-- ═══════════════════════════════════════════════════════

-- 1. Create Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  credits INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 50);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create User Carts table (Session carts + Auth carts)
CREATE TABLE IF NOT EXISTS public.user_carts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  items JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- 4. Create Licenses Table
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  serial_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id);

-- 5. Create Product Files Table
CREATE TABLE IF NOT EXISTS public.product_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  os_type TEXT NOT NULL, -- 'Windows', 'macOS'
  format TEXT NOT NULL,  -- 'VST3', 'AU', 'AAX', 'Installer'
  storage_path TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  size_mb NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Secure Checkout RPC
-- Calculates cart total on the server, deducts credits if used, generates orders and licenses.
CREATE OR REPLACE FUNCTION public.checkout_cart(
  p_user_id UUID,
  p_items JSONB,
  p_payment_method TEXT,
  p_use_credits BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_order_id UUID;
  v_user_credits INTEGER;
  v_remaining_credits INTEGER;
  v_serial TEXT;
BEGIN
  -- Re-calculate total from database prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item->>'id';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'id';
    END IF;
    -- Use sale price if available
    IF v_product.sale_price IS NOT NULL THEN
      v_total := v_total + v_product.sale_price;
    ELSE
      v_total := v_total + v_product.price;
    END IF;
  END LOOP;

  -- Handle Credits Payment
  IF p_use_credits THEN
    SELECT credits INTO v_user_credits FROM public.profiles WHERE id = p_user_id;
    IF v_user_credits >= v_total THEN
      v_remaining_credits := v_user_credits - v_total;
      UPDATE public.profiles SET credits = v_remaining_credits WHERE id = p_user_id;
      v_total := 0; -- Covered entirely by credits
    ELSE
      -- Deduct all credits, keep remainder
      v_total := v_total - v_user_credits;
      UPDATE public.profiles SET credits = 0 WHERE id = p_user_id;
    END IF;
  END IF;
  
  -- Create Order
  INSERT INTO public.orders (user_id, total, payment_method, status, items)
  VALUES (p_user_id, v_total, p_payment_method, CASE WHEN p_use_credits THEN 'completed' ELSE 'pending' END, p_items)
  RETURNING id INTO v_order_id;

  -- Generate Licenses for each item ONLY if payment is completed (credits)
  IF p_use_credits THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      -- Generate simple random serial key (e.g., PMX-XXXX-XXXX-XXXX)
      v_serial := 'PMX-' || right(encode(gen_random_bytes(4), 'hex'), 4) || '-' || 
                            right(encode(gen_random_bytes(4), 'hex'), 4) || '-' || 
                            right(encode(gen_random_bytes(4), 'hex'), 4);
                            
      INSERT INTO public.licenses (user_id, product_id, order_id, serial_key)
      VALUES (p_user_id, v_item->>'id', v_order_id, upper(v_serial));
    END LOOP;
  END IF;

  -- Clear User Cart if exists
  DELETE FROM public.user_carts WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'total_charged', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
-- TELEGRAM NOTIFICATIONS SCHEMA
-- ═══════════════════════════════════════════════════════

-- 7. Telegram Settings Table
CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id INT PRIMARY KEY DEFAULT 1,
  bot_token TEXT,
  chat_id TEXT,
  is_enabled BOOLEAN DEFAULT false,
  notify_all_pages BOOLEAN DEFAULT true,
  tracked_pages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Protect Telegram Settings
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
-- Only authenticated users (admins) can view and update
CREATE POLICY "Admins can view telegram settings" ON public.telegram_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update telegram settings" ON public.telegram_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can insert telegram settings" ON public.telegram_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO public.telegram_settings (id, is_enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 8. Visitor Sessions Table
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  session_id TEXT PRIMARY KEY,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_views INT DEFAULT 1,
  is_bot BOOLEAN DEFAULT false
);

-- Allow backend to write without RLS blocking, but public can't read
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service roles can manage visitor sessions" ON public.visitor_sessions FOR ALL USING (true);

-- 9. Event Logs Table
CREATE TABLE IF NOT EXISTS public.event_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES public.visitor_sessions(session_id),
  page_url TEXT,
  referrer TEXT,
  user_id UUID REFERENCES public.profiles(id) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow backend to write
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service roles can manage event logs" ON public.event_logs FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════
-- 10. Notification Logs Table
-- Tracks every Telegram notification attempt for admin history.
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  message_type TEXT,        -- 'new_visitor' | 'page_view' | 'order'
  page_url TEXT,
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  telegram_ok BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service roles can manage notification logs" ON public.notification_logs FOR ALL USING (true);

