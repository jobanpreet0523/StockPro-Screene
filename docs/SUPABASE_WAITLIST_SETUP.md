# Supabase Waitlist Setup

StockPro stores waitlist submissions from the Cloudflare Worker only. The browser calls `/api/waitlist`; it never receives the Supabase service-role key.

## 1. Create the table

Run this SQL in the Supabase SQL Editor for a new `waitlist_leads` table:

```sql
create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (
    email = lower(btrim(email))
    and char_length(email) between 3 and 254
  ),
  use_case text check (use_case is null or char_length(use_case) <= 2000),
  interest text check (interest is null or char_length(interest) <= 120),
  source_page text check (source_page is null or char_length(source_page) <= 500),
  referrer text check (referrer is null or char_length(referrer) <= 500),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlist_leads_created_at_idx
  on public.waitlist_leads (created_at desc);

create index if not exists waitlist_leads_interest_idx
  on public.waitlist_leads (interest);

create index if not exists waitlist_leads_status_idx
  on public.waitlist_leads (status);

create unique index if not exists waitlist_leads_email_interest_uidx
  on public.waitlist_leads (lower(email), coalesce(interest, ''));
```

The Worker lowercases email before insertion. The expression-based unique index safely collapses duplicate `lower(email) + interest` submissions, including a null interest. A uniqueness violation is returned to the visitor as `already_joined`; other database failures never produce a success response.

## 2. Keep `updated_at` current

```sql
create or replace function public.set_waitlist_leads_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_waitlist_leads_updated_at() from public, anon, authenticated;
grant execute on function public.set_waitlist_leads_updated_at() to service_role;

drop trigger if exists waitlist_leads_set_updated_at on public.waitlist_leads;
create trigger waitlist_leads_set_updated_at
before update on public.waitlist_leads
for each row execute function public.set_waitlist_leads_updated_at();
```

## 3. Secure Data API access

The Worker uses the service-role key. Public browser roles do not need direct table access.

```sql
alter table public.waitlist_leads enable row level security;

revoke all on table public.waitlist_leads from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update on table public.waitlist_leads to service_role;
```

Do not add permissive `anon` or `authenticated` policies. Current Supabase projects may require the explicit `service_role` grant before the table is reachable through `/rest/v1/`. The service-role key bypasses RLS and must remain a server-side Worker secret.

## 4. Configure Cloudflare Worker bindings

Set the non-secret values in the deployment environment and store tokens with Cloudflare secrets:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_WAITLIST_TABLE=waitlist_leads
WAITLIST_ADMIN_ENABLED=true
```

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_ACCESS_TOKEN
```

Generate a long, random, unique admin token. Never prefix either secret with `VITE_`, put it in frontend code, or commit it.

## 5. Verify

1. Open `/api/waitlist/health`; it should return `ok` only when the Supabase Worker bindings appear configured.
2. Submit `/contact` once and confirm a row appears in `public.waitlist_leads`.
3. Submit the same lowercase email and interest again; the API should return `already_joined` without creating another row.
4. Enable the admin route and open `/admin/waitlist`. Enter the admin token; it is retained only in that tab's `sessionStorage`.
5. Run Supabase Security Advisor and confirm the table has RLS enabled, no public policies, and only the intended grants.

Real database setup remains a manual deployment step because no Supabase project credentials are stored in this repository.
