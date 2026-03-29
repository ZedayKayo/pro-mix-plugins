-- ═══════════════════════════════════════════════════════
-- PRO-MIX PLUGINS — Supabase Setup Script
-- Paste this entire script into your Supabase SQL Editor and run it!
-- ═══════════════════════════════════════════════════════

-- 1. Create the products table
create table public.products (
  id text primary key,
  name text not null,
  slug text unique,
  developer text,
  brand text,
  category text,
  subcategory text,
  type text[],
  daw_compat text[],
  price numeric(10, 2),
  sale_price numeric(10, 2),
  crypto_prices jsonb,
  rating numeric(3, 1),
  reviews integer,
  description text,
  short_desc text,
  features text[],
  specs jsonb,
  system_reqs jsonb,
  images text[],
  audio_demo text,
  video_demo text,
  product_page text,
  is_featured boolean default false,
  is_trending boolean default false,
  is_new boolean default false,
  release_date date,
  version text,
  color text,
  tags text[],
  cpu_usage_level text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- 3. Create a policy to allow ANYONE to read the products
create policy "Allow public read access" on public.products
  for select using (true);

-- 4. Create policies for authenticated admins to insert/update/delete products
-- Note: In a real production app, you might check for an 'admin' role or specific UUID.
-- Here we're restricting write access exclusively to authenticated logged-in users.
create policy "Allow authenticated insert access" on public.products
  for insert to authenticated with check (true);

create policy "Allow authenticated update access" on public.products
  for update to authenticated using (true);

create policy "Allow authenticated delete access" on public.products
  for delete to authenticated using (true);
