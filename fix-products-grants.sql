-- ═══════════════════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — Fix: Missing GRANTs & site_settings table
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Products table GRANTs (fixes silent RLS hangs on INSERT/UPDATE/DELETE)
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- 2. Create site_settings if it doesn't exist yet (stores global discount %)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id           INT PRIMARY KEY DEFAULT 1,
  discount_pct NUMERIC DEFAULT 70,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 3. Allow anyone to read site_settings (needed for storefront discount display)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can write site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can write site settings"
  ON public.site_settings FOR ALL TO authenticated USING (true);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;

-- 4. Seed the default discount row
INSERT INTO public.site_settings (id, discount_pct)
VALUES (1, 70)
ON CONFLICT (id) DO NOTHING;
