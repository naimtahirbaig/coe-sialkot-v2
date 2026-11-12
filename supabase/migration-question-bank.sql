-- Question Bank + Paper Generator (SBA paper format).
-- Run once in the Supabase SQL editor. Safe to run again.
-- (If you already ran an earlier version of this file, run the DROP lines at the very bottom first.)

-- Teacher accounts (passwords are stored as bcrypt hashes, never in plain text).
create table if not exists public.qb_teachers (
  id            bigint generated always as identity primary key,
  username      text not null unique,
  name          text not null,
  password_hash text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Reading passages ("Paragraph Instruction") shared by a group of MCQs.
create table if not exists public.qb_passages (
  id              bigint generated always as identity primary key,
  class_num       int  not null check (class_num between 1 and 12),
  subject         text not null,
  chapter         text not null default '',
  instruction     text not null default '',      -- e.g. "Read the following poem carefully and answer ..."
  text            text not null,
  image           text not null default '',      -- data:image/...;base64,... (optional picture beside the passage)
  created_by      bigint references public.qb_teachers(id) on delete set null,
  created_by_name text not null default 'Admin',
  created_at      timestamptz not null default now()
);

-- The question bank.
create table if not exists public.qb_questions (
  id              bigint generated always as identity primary key,
  class_num       int  not null check (class_num between 1 and 12),
  subject         text not null,
  chapter         text not null default '',            -- e.g. 'Ch 3: Algebra'
  section         text not null default '',            -- English / Urdu only (e.g. 'Reading Comprehension')
  qtype           text not null check (qtype in ('mcq','true_false','fill_blank','short','long')),
  text            text not null,                 -- may contain maths between $...$ (LaTeX)
  opts            jsonb not null default '[]'::jsonb,   -- ["A text","B text","C text","D text"] for MCQs
  correct         text not null default '',             -- 'A'-'D' for MCQ, 'True'/'False' for true/false
  answer          text not null default '',             -- model answer (optional)
  image           text not null default '',             -- data:image/...;base64,... (optional figure)
  has_image       boolean generated always as (image <> '') stored,
  passage_id      bigint references public.qb_passages(id) on delete set null,
  marks           numeric not null check (marks > 0 and marks <= 100),
  difficulty      text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_by      bigint references public.qb_teachers(id) on delete set null,
  created_by_name text not null default 'Admin',
  created_at      timestamptz not null default now()
);
alter table public.qb_questions add column if not exists section text not null default '';
create index if not exists qb_questions_lookup on public.qb_questions (class_num, subject, qtype, marks);
create index if not exists qb_questions_passage on public.qb_questions (passage_id);

-- Generated papers. Each paper keeps its own copy of everything it shows (in `body`),
-- so editing or deleting a question later never changes a paper already made.
create table if not exists public.qb_papers (
  id          bigint generated always as identity primary key,
  title       text not null,
  class_num   int  not null,
  subject     text not null,
  total_marks numeric not null,
  filters     jsonb not null default '{}'::jsonb,       -- {"chapters":[...],"difficulty":""}
  body        jsonb not null default '{}'::jsonb,       -- header, Part A, Part B
  qids        jsonb not null default '[]'::jsonb,       -- question ids used (to avoid repeats next time)
  created_at  timestamptz not null default now()
);
create index if not exists qb_papers_class_subject on public.qb_papers (class_num, subject);

-- No policies on purpose: only the server (service-role key) can read or write.
alter table public.qb_teachers  enable row level security;
alter table public.qb_passages  enable row level security;
alter table public.qb_questions enable row level security;
alter table public.qb_papers    enable row level security;

-- Only if you ran the FIRST version of this file (before the SBA layout) and have no data
-- you want to keep, run these three lines once, then run everything above again:
--   drop table if exists public.qb_papers;
--   drop table if exists public.qb_questions;
--   drop table if exists public.qb_passages;
