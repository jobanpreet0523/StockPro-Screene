-- StockPro production schema for Supabase/Postgres.
-- Run in a new project, review in staging, then apply RLS policies separately.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  use_case text,
  interest text,
  source_page text,
  referrer text,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  source_page text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('dhan','upstox','zerodha','angel')),
  encrypted_token text not null,
  token_iv text not null,
  token_algorithm text not null default 'AES-GCM',
  encrypted_refresh_token text,
  refresh_token_iv text,
  scopes text[] not null default '{}'::text[],
  status text not null default 'pending_verification' check (status in ('pending_verification','connected','reconnect_required','disconnected')),
  connected_at timestamptz,
  expires_at timestamptz,
  last_tested_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

create table if not exists public.broker_connection_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  broker_connection_id uuid references public.broker_connections(id) on delete set null,
  provider text not null,
  event_type text not null,
  outcome text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.broker_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('upstox','dhan')),
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists broker_oauth_states_active_idx
  on public.broker_oauth_states(provider, expires_at)
  where consumed_at is null;

create table if not exists public.market_instruments (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  instrument_token text not null,
  exchange text not null,
  segment text not null,
  symbol text not null,
  trading_symbol text not null,
  name text,
  sector text,
  market_cap numeric,
  lot_size integer,
  tick_size numeric,
  active boolean not null default true,
  provider_payload jsonb,
  refreshed_at timestamptz not null default now(),
  unique(provider, instrument_token)
);
create index if not exists market_instruments_scan_idx on public.market_instruments(exchange, segment, active);

create table if not exists public.crt_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  status text not null check (status in ('queued','running','completed','failed')),
  filters jsonb not null default '{}'::jsonb,
  total_symbols integer not null default 0,
  processed_symbols integer not null default 0,
  result_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.crt_scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references public.crt_scan_runs(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  timeframe text not null,
  direction text not null,
  mode text not null,
  score numeric not null,
  entry_price numeric,
  invalidation_price numeric,
  target_price numeric,
  risk_reward numeric,
  candles jsonb not null default '[]'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(scan_run_id, symbol, timeframe, mode)
);
create index if not exists crt_scan_results_run_idx on public.crt_scan_results(scan_run_id, score desc);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  created_at timestamptz not null default now(),
  unique(watchlist_id, symbol)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('price','crt','oi','scanner')),
  symbol text,
  condition text not null,
  threshold numeric,
  scanner_id text,
  email_enabled boolean not null default false,
  status text not null default 'active' check (status in ('active','paused','disabled')),
  delivery_status text not null default 'pending_configuration',
  last_evaluated_at timestamptz,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists alerts_active_idx on public.alerts(user_id, status);

create table if not exists public.saved_screeners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_research (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trial_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_subscription_id text unique,
  status text not null check (status in ('pending','trialing','active','cancelled','expired')),
  auto_renew_consent_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  test_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  provider text not null,
  payload_json jsonb not null,
  processing_status text not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.razorpay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  signature_verified boolean not null,
  payload_json jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'user_profiles','waitlist_leads','contact_messages','broker_connections',
    'watchlists','alerts','saved_screeners','saved_research','trial_subscriptions'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;
