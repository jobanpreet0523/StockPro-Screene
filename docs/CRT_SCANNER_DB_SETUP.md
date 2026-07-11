# CRT Scanner Database Setup

The free CRT Scanner requires server-side Supabase storage. Enable RLS, deny anonymous browser access, and allow only the Worker secret role. Provider credentials never enter these tables.

```sql
create table market_instruments (
  exchange text not null,
  segment text not null,
  symbol text not null,
  company_name text not null,
  provider_instrument_id text not null,
  series text not null default 'EQ',
  sector text,
  market_cap numeric,
  active boolean not null default true,
  refreshed_at timestamptz not null,
  primary key (exchange, symbol)
);

create table crt_scan_runs (
  id uuid primary key,
  status text not null check (status in ('queued','running','completed','failed')),
  provider text not null,
  filters jsonb not null,
  created_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  total_symbols integer,
  processed_symbols integer not null default 0,
  result_count integer not null default 0,
  error_message text
);

create table crt_scan_results (
  scan_run_id uuid not null references crt_scan_runs(id) on delete cascade,
  symbol text not null,
  company_name text not null,
  exchange text not null,
  timeframe text not null,
  direction text not null,
  mode text not null,
  result jsonb not null,
  data_captured_at timestamptz not null,
  primary key (scan_run_id, symbol, timeframe, direction, mode)
);

create table crt_scan_symbol_audit (
  scan_run_id uuid not null references crt_scan_runs(id) on delete cascade,
  symbol text not null,
  status text not null,
  reason text,
  processed_at timestamptz not null default now(),
  primary key (scan_run_id, symbol)
);

alter table market_instruments enable row level security;
alter table crt_scan_runs enable row level security;
alter table crt_scan_results enable row level security;
alter table crt_scan_symbol_audit enable row level security;
```

Configure the table bindings from `.env.example`. Refresh the instrument master once daily through an authenticated admin process or manual Worker request. `POST /api/crt-scanner/run` creates a run and captures provider data once. GET endpoints read persisted state only and never recompute or refetch provider data.

The authorized-vendor adapter expects HTTPS JSON endpoints for `GET /instruments?exchange=NSE&segment=EQ` and `POST /crt-snapshot`. The Zerodha adapter uses official Kite instrument and historical candle APIs. No public scraping or substitute data source is used.
