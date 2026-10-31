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

-- Tests created from the admin page (question bank stored here).
create table if not exists public.online_test_defs (
  slug        text primary key,
  title       text not null,
  class_num   int  not null,
  subject     text not null,
  chapter     text,
  month_label text not null,
  per_q       int  not null default 15,
  paper_size  int  not null,
  questions   jsonb not null,     -- [[question, [opt1, opt2, ...], correctIndex], ...]
  created_at  timestamptz not null default now()
);
alter table public.online_test_defs enable row level security;

-- Old attempts are kept here when a retest is given.
create table if not exists public.online_test_attempt_history (
  id          uuid primary key default gen_random_uuid(),
  archived_at timestamptz not null default now(),
  reason      text,
  data        jsonb not null
);
alter table public.online_test_attempt_history enable row level security;

-- Resume after a power cut / dropped internet: the paper, answers so far and
-- photos are saved while the student sits the test.
alter table public.online_test_attempts add column if not exists progress jsonb;
alter table public.online_test_attempts add column if not exists last_seen timestamptz;
