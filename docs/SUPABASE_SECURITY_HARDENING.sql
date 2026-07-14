-- Apply after the full schema. These statements are idempotent.
-- Public forms and server-only tables remain reachable only through validated Workers.

alter function public.set_updated_at()
  set search_path = pg_catalog, public;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
