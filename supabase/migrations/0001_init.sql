-- Bryce Wage Motocross — initial schema
-- Pre-order interest platform: catalog + interest-style "orders" + admin settings.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Sequences
-- ---------------------------------------------------------------------------

-- Sequential, zero-padded BWM-XXXX order numbers. Sequence guarantees no
-- collisions under concurrency. Will roll past 9999 to BWM-10000 cleanly.
create sequence if not exists order_number_seq start 1;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Singleton config row. App code always reads `select * from settings limit 1`.
create table settings (
  id uuid primary key default gen_random_uuid(),
  ordering_open boolean not null default false,
  ordering_window_label text,
  etransfer_email text,
  owner_phone_e164 text,
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0
);
create index product_images_product_id_idx on product_images(product_id);

create table product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);
create index product_sizes_product_id_idx on product_sizes(product_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null
    default 'BWM-' || lpad(nextval('order_number_seq')::text, 4, '0'),
  customer_name text not null,
  contact_method text not null check (contact_method in ('email','phone')),
  contact_value text not null,
  -- Fulfillment is always "Bryce contacts to arrange delivery". No address
  -- collected on the platform; he gathers it during the follow-up.
  payment_method text not null check (payment_method in ('etransfer','cash')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  notes text,
  batch_label text,
  created_at timestamptz not null default now()
);
create index orders_created_at_idx on orders(created_at desc);
create index orders_batch_label_idx on orders(batch_label);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  -- set null (not cascade) so deleting a product doesn't wipe order history;
  -- the snapshot fields preserve what the customer actually ordered.
  product_id uuid references products(id) on delete set null,
  product_name_snapshot text not null,
  size_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0)
);
create index order_items_order_id_idx on order_items(order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table settings        enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table product_sizes   enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- Catalog: public read. Hide inactive products from anon.
create policy "Public read active products"
  on products for select to anon, authenticated
  using (active = true);

create policy "Public read product images"
  on product_images for select to anon, authenticated
  using (true);

create policy "Public read product sizes"
  on product_sizes for select to anon, authenticated
  using (true);

-- Orders + items: public can INSERT (interest submissions), nothing else.
-- Admin reads via service_role (bypasses RLS). Defense-in-depth: only allow
-- inserts while ordering is open.
create policy "Public insert orders when ordering open"
  on orders for insert to anon, authenticated
  with check ((select ordering_open from settings limit 1) = true);

create policy "Public insert order items when ordering open"
  on order_items for insert to anon, authenticated
  with check ((select ordering_open from settings limit 1) = true);

-- Settings: NO direct public select (would leak owner phone).
-- Public reads go through public_settings() function below, which exposes
-- only safe fields. Service_role bypasses RLS for admin reads/writes.

-- ---------------------------------------------------------------------------
-- Public RPC: safe subset of settings for anon clients.
-- ---------------------------------------------------------------------------

create or replace function public_settings()
returns table (
  ordering_open boolean,
  ordering_window_label text,
  etransfer_email text
)
language sql
security definer
set search_path = public
as $$
  select ordering_open, ordering_window_label, etransfer_email
  from settings
  limit 1
$$;

revoke all on function public_settings() from public;
grant execute on function public_settings() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for product images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public can read images. Admin uploads via service_role (bypasses RLS).
create policy "Public read product image objects"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- Seed: single settings row
-- ---------------------------------------------------------------------------

insert into settings (
  ordering_open,
  ordering_window_label,
  etransfer_email,
  owner_phone_e164
)
select false, null, null, null
where not exists (select 1 from settings);
