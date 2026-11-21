-- Live website numbers: visitors, page views, downloads, practice tests.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
create table if not exists public.site_counters (
  key        text primary key,
  value      bigint not null default 0,
  updated_at timestamptz not null default now()
);
-- only the website's server (service key) may read or change it
alter table public.site_counters enable row level security;

-- add n to a counter in one step (safe when many people visit at once)
create or replace function public.bump_counter(k text, n integer default 1)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.site_counters (key, value) values (k, n)
  on conflict (key) do update set value = site_counters.value + excluded.value, updated_at = now()
  returning value;
$$;
revoke all on function public.bump_counter(text, integer) from public, anon, authenticated;
grant execute on function public.bump_counter(text, integer) to service_role;
