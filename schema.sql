-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- 1. Commodities we track
create table if not exists commodities (
  id text primary key,          -- e.g. 'wti_crude', 'wheat', 'cotton', 'gold', 'soybean_oil', 'copra'
  display_name text not null,   -- e.g. 'WTI Crude Oil'
  unit text not null,           -- e.g. 'USD', 'PHP'
  source text not null,         -- e.g. 'Alpha Vantage', 'MetalpriceAPI', 'Manual'
  source_url text
);

-- 2. Historical prices (one row per commodity per date)
create table if not exists prices (
  id bigint generated always as identity primary key,
  commodity_id text not null references commodities(id),
  price_date date not null,
  price numeric not null,
  inserted_at timestamptz not null default now(),
  unique (commodity_id, price_date)
);

create index if not exists idx_prices_commodity_date on prices (commodity_id, price_date desc);

-- 3. User roles (Supabase Auth already creates auth.users — this extends it)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 4. Row Level Security: prices/commodities are publicly readable (guest access),
--    but only admins can write.
alter table commodities enable row level security;
alter table prices enable row level security;
alter table profiles enable row level security;

create policy "public read commodities" on commodities for select using (true);
create policy "public read prices" on prices for select using (true);

create policy "admin write commodities" on commodities for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "admin write prices" on prices for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "user reads own profile" on profiles for select using (auth.uid() = id);

-- 5. Seed the six commodities from your Excel workbook
insert into commodities (id, display_name, unit, source, source_url) values
  ('wti_crude',   'WTI Crude Oil',  'USD', 'Alpha Vantage',  'https://www.alphavantage.co/documentation/#wti'),
  ('wheat',       'Wheat',          'USD', 'Alpha Vantage',  'https://www.alphavantage.co/documentation/#wheat'),
  ('cotton',      'Cotton',         'USD', 'Alpha Vantage',  'https://www.alphavantage.co/documentation/#cotton'),
  ('gold',        'Gold',           'USD', 'MetalpriceAPI',  'https://metalpriceapi.com'),
  ('soybean_oil', 'Soybean Oil',    'USD', 'Manual',         null),
  ('copra',       'Copra',          'PHP', 'Manual',         'https://pca.gov.ph/index.php/2-uncategorised/109-daily-market-price')
on conflict (id) do nothing;
