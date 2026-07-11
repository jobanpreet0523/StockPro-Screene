# Watchlist and Alerts Setup

All records are private to the authenticated Supabase user. Enable RLS and deny anonymous access.

```sql
create table watchlists (id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table watchlist_items (watchlist_id uuid references watchlists(id) on delete cascade, user_id uuid not null, symbol text not null, exchange text not null default 'NSE', created_at timestamptz default now(), primary key (watchlist_id, symbol));
create table alerts (id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, type text not null, symbol text, condition text not null, threshold numeric, scanner_id text, email_enabled boolean default false, status text default 'active', delivery_status text default 'pending_configuration', created_at timestamptz default now());
create table saved_screens (id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, filters jsonb not null, created_at timestamptz default now(), updated_at timestamptz default now());
alter table watchlists enable row level security;
alter table watchlist_items enable row level security;
alter table alerts enable row level security;
alter table saved_screens enable row level security;
```

Create ownership policies using `auth.uid() = user_id`. The Worker additionally filters every operation by the verified user ID. Alert creation saves configuration only; it returns `delivery: not_sent` and does not claim notification delivery. Configure the existing Resend notification foundation before processing triggered alerts.
