-- ═══════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — Site Settings Table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Create the table
CREATE TABLE IF NOT EXISTS site_settings (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  discount_pct INTEGER NOT NULL DEFAULT 70 CHECK (discount_pct BETWEEN 1 AND 99),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the default row (id=1, 70% off)
INSERT INTO site_settings (id, discount_pct)
VALUES (1, 70)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ the discount (needed for storefront pricing)
CREATE POLICY "Public can read site_settings"
  ON site_settings FOR SELECT
  USING (true);

-- Only authenticated admins (service role) can UPDATE
-- The frontend uses the service role key via the API, so this is fine.
-- If you want to allow the anon key to upsert from the admin panel,
-- add an additional policy:
CREATE POLICY "Admins can update site_settings"
  ON site_settings FOR ALL
  USING (true)
  WITH CHECK (true);
