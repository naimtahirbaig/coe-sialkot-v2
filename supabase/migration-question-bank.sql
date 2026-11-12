-- Question Bank + Paper Generator.
-- Run once in the Supabase SQL editor. Safe to run again.

-- Teacher accounts (passwords are stored as bcrypt hashes, never in plain text).
create table if not exists public.qb_teachers (
  id            bigint generated always as identity primary key,
  username      text not null unique,
  name          text not null,
  password_hash text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- The question bank.
create table if not exists public.qb_questions (
  id              bigint generated always as identity primary key,
  class_num       int  not null check (class_num between 1 and 12),
  subject         text not null,
  chapter         text not null default '',
  qtype           text not null check (qtype in ('mcq','true_false','fill_blank','short','long')),
  text            text not null,
  opts            jsonb not null default '[]'::jsonb,   -- ["A text","B text","C text","D text"] for MCQs
  correct         text not null default '',             -- 'A'-'D' for MCQ, 'True'/'False' for true/false
  answer          text not null default '',             -- model answer (optional)
  marks           numeric not null check (marks > 0 and marks <= 100),
  difficulty      text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_by      bigint references public.qb_teachers(id) on delete set null,
  created_by_name text not null default 'Admin',
  created_at      timestamptz not null default now()
);
create index if not exists qb_questions_lookup on public.qb_questions (class_num, subject, qtype, marks);

-- Generated papers. Each paper keeps its own copy of its questions (in `sections`),
-- so editing or deleting a question later never changes a paper already made.
create table if not exists public.qb_papers (
  id           bigint generated always as identity primary key,
  title        text not null,
  school       text not null default '',
  class_num    int  not null,
  subject      text not null,
  total_marks  numeric not null,
  duration_min int  not null default 0,
  instructions text not null default '',
  filters      jsonb not null default '{}'::jsonb,      -- {"chapters":[...],"difficulty":""}
  sections     jsonb not null default '[]'::jsonb,
  qids         jsonb not null default '[]'::jsonb,      -- question ids used (to avoid repeats next time)
  created_at   timestamptz not null default now()
);
create index if not exists qb_papers_class_subject on public.qb_papers (class_num, subject);

-- No policies on purpose: only the server (service-role key) can read or write.
alter table public.qb_teachers  enable row level security;
alter table public.qb_questions enable row level security;
alter table public.qb_papers    enable row level security;
