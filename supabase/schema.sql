-- CreditHunter / AAHunt — full schema (ported from Drizzle/Postgres)
-- Run once in Supabase SQL Editor. Access is service-role only (no RLS policies).

create table if not exists public.providers (
  id serial primary key,
  name text not null,
  logo_url text,
  website_url text not null unique,
  description text,
  free_credit_amount text,
  credit_type text,
  has_kling boolean not null default false,
  kling_detail text,
  category text not null,
  requires_credit_card boolean not null default false,
  expiry_days integer,
  status text not null default 'unverified',
  entity_type text not null default 'ai_provider',
  quality_score integer not null default 0,
  last_verified_at timestamptz,
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_jobs (
  id serial primary key,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  providers_found integer,
  providers_updated integer,
  error_message text,
  log text,
  targets text default '["providers","codes","content"]'
);

create table if not exists public.promo_codes (
  id serial primary key,
  provider_name text not null,
  provider_url text,
  code text not null,
  description text not null,
  discount_type text,
  discount_value text,
  source_url text,
  source_name text,
  expires_at timestamptz,
  status text not null default 'unverified',
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_name, code)
);

create table if not exists public.api_keys (
  id serial primary key,
  provider varchar(50) not null,
  label varchar(100) not null,
  api_key text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

grant all on public.providers to service_role;
grant all on public.promo_codes to service_role;
grant all on public.research_jobs to service_role;
grant all on public.api_keys to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.providers enable row level security;
alter table public.promo_codes enable row level security;
alter table public.research_jobs enable row level security;
alter table public.api_keys enable row level security;
-- No policies defined: all access goes through the service-role client on the
-- server; nothing is readable/writable directly from the browser (anon/auth).

-- ─── Training Engine: sumber pembelajaran AI researcher ──────────────────────
create table if not exists public.training_sources (
  id serial primary key,
  url text not null,
  category text not null,
  label text,
  notes text,
  is_active boolean not null default true,
  status text not null default 'pending',
  site_name text,
  summary text,
  knowledge text,
  content_chars integer,
  error_message text,
  last_learned_at timestamptz,
  created_at timestamptz not null default now(),
  unique (url, category)
);

grant all on public.training_sources to service_role;
grant usage, select on all sequences in schema public to service_role;
alter table public.training_sources enable row level security;
