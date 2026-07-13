-- Apply after docs/SUPABASE_FULL_SCHEMA.sql.
-- OAuth state and broker credentials are service-role-only Worker records.

alter table public.broker_connections
  add column if not exists refresh_token_iv text,
  add column if not exists scopes text[] not null default '{}'::text[];

create table if not exists public.broker_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('upstox', 'dhan')),
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists broker_oauth_states_active_idx
  on public.broker_oauth_states(provider, expires_at)
  where consumed_at is null;

alter table public.broker_oauth_states enable row level security;

-- Intentionally no browser policy. Only the Worker service role may create,
-- consume, or inspect OAuth state records.
