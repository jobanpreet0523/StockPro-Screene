# Supabase production setup checklist

- [ ] Create a dedicated production Supabase project.
- [ ] Apply `SUPABASE_FULL_SCHEMA.sql`.
- [ ] Apply `SUPABASE_RLS_POLICIES.sql`.
- [ ] Confirm RLS is enabled on all 17 application tables.
- [ ] Enable Email Auth and configure the production redirect URL.
- [ ] Store `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as Worker bindings.
- [ ] Set `SUPABASE_AUTH_ENABLED=true`.
- [ ] Add only the URL and publishable key to the frontend build.
- [ ] Configure every `SUPABASE_*_TABLE` name from `.env.example`.
- [ ] Verify `/api/database/readiness` reports each table without returning credentials.
- [ ] Confirm an anonymous browser cannot read broker, billing, webhook, waitlist, or contact rows.
- [ ] Confirm User A cannot read or mutate User B watchlists, alerts, saved research, or CRT history.
- [ ] Confirm broker token columns are reachable only through service-role Worker code.
- [ ] Enable database backups and review Supabase security advisories.
- [ ] Test schema and RLS in staging before production data is accepted.

The readiness endpoint checks table reachability with the service role but returns only `configured`, `missing`, or `unavailable`. It never returns table rows or keys.
