# StockPro auth and account setup

Stage 18 adds an honest auth foundation. The app does not fake a logged-in user. If Supabase Auth is not configured, `/api/auth/session` returns `setup_required`; if no valid session is present, it returns `unauthenticated`.

## Required Worker environment

Configure these as server-side Worker bindings/secrets:

```bash
SUPABASE_AUTH_ENABLED=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or any `VITE_` variable.

## Session model

The Worker accepts a future secure HTTP-only `stockpro_session` cookie or an `Authorization: Bearer <user access token>` header, validates it against Supabase Auth, and returns only a safe user envelope. Raw access tokens are not returned to the browser by StockPro APIs.

## User profile table

Use this for non-sensitive profile state. It can be exposed to authenticated users only with owner-scoped RLS.

```sql
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon;
grant select, insert, update on table public.user_profiles to authenticated;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

Do not use `user_metadata` or other user-editable claims for authorization decisions. Store authorization-only data in server-controlled tables or app metadata.

## Manual checks

- Confirm `/api/auth/session` returns `setup_required` before env setup.
- Confirm it returns `unauthenticated` when env exists but no valid session exists.
- Confirm no service role key appears in browser assets.
- Confirm `/account` loads without inventing a user.
