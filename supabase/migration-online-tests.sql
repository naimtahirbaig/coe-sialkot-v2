-- Online tests: one attempt per student per test, results + result card saved.
-- Run once in the Supabase SQL editor. Safe to run again.
create table if not exists public.online_test_attempts (
  id            uuid primary key default gen_random_uuid(),
  test_slug     text not null,
  student_id    text not null,
  student_name  text,
  roll_no       text,
  class         int,
  section_label text,
  teacher_name  text,
  token         text not null,
  status        text not null default 'in_progress',   -- in_progress | submitted
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  correct       int,
  wrong         int,
  skipped       int,
  percentage    numeric,
  grade         text,
  tab_switches  int,
  camera_dropped boolean,
  answers       jsonb,
  card_image    text,                                   -- data:image/jpeg;base64,...
  unique (test_slug, student_id)
);
alter table public.online_test_attempts enable row level security;
-- No policies on purpose: only the server (service-role key) can read/write.

-- Active / Closed switch per test (added later; safe to run again).
create table if not exists public.online_test_settings (
  test_slug  text primary key,
  is_open    boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.online_test_settings enable row level security;
