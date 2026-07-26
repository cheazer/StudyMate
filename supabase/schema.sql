-- Run this in the Supabase SQL editor (or via supabase db push).
-- Matches the contract in lib/types.ts — keep them in sync.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  course_name text not null,
  weekly_goal_hours int not null,
  biggest_challenge text not null,
  preferred_study_time text not null check (preferred_study_time in ('morning','afternoon','evening','late-night')),
  preferred_format text not null check (preferred_format in ('video','reading','practice','mixed')),
  created_at timestamptz default now()
);

-- A course is a folder a student creates and uploads PDF material into.
-- Gemma analyzes the combined material and caches suggested subtopics +
-- a roadmap here; accepting a suggestion (or adding a custom one) creates a
-- real row in `topics` below.
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  suggested_subtopics jsonb not null default '[]',
  roadmap jsonb not null default '[]',
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

-- One row per uploaded PDF. Only the extracted text is kept — the original
-- file is discarded after parsing (no storage bucket needed).
create table if not exists course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  filename text not null,
  extracted_text text not null,
  char_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  course_name text not null,
  title text not null,
  category text not null check (category in ('math','programming','science','other')),
  progress_percent int not null default 0,
  last_touched timestamptz default now()
);

-- `topics` may already exist from before courses/folders existed — add the
-- new column rather than relying on `create table if not exists`, which
-- silently no-ops (including the new column) against a table that's already
-- there.
alter table topics add column if not exists course_id uuid references courses(id) on delete cascade;

-- Free-form notes a student takes while studying a topic.
create table if not exists notes (
  topic_id uuid primary key references topics(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz default now()
);

create table if not exists roadmaps (
  topic_id uuid primary key references topics(id) on delete cascade,
  milestones jsonb not null default '[]'
);

create table if not exists study_packs (
  topic_id uuid primary key references topics(id) on delete cascade,
  notes text,
  flashcards jsonb not null default '[]',
  mcqs jsonb not null default '[]',
  worked_examples jsonb not null default '[]'
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  topic_id uuid references topics(id) on delete cascade,
  mcq_id text not null,
  correct boolean not null,
  attempted_at timestamptz default now()
);

create table if not exists streak_log (
  user_id uuid references auth.users(id) default auth.uid(),
  date date not null,
  minutes_studied int not null default 0,
  primary key (user_id, date)
);

-- Demo user row: every table's user_id references auth.users(id), and until
-- real auth is wired up, the app writes rows using the nil UUID below
-- (see lib/constants.ts DEMO_USER_ID). That FK requires a matching row to
-- actually exist in auth.users, or every insert/upsert against these tables
-- (streak_log, courses, topics, profiles, ...) fails with a 23503 foreign
-- key violation. Insert it once so the demo flow works without real auth.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'demo@studymate.local', '',
  now(), now(), now(),
  '{"provider":"demo","providers":["demo"]}', '{}', false
)
on conflict (id) do nothing;

-- Row-level security: every table is scoped to the owning user.
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_materials enable row level security;
alter table topics enable row level security;
alter table notes enable row level security;
alter table roadmaps enable row level security;
alter table study_packs enable row level security;
alter table attempts enable row level security;
alter table streak_log enable row level security;

-- TODO once auth is wired up: replace the permissive demo policies below with
-- using (auth.uid() = user_id) / with check (auth.uid() = user_id) on each
-- table. Left open here so the hackathon build isn't blocked on auth first.
create policy "demo_allow_all_profiles" on profiles for all using (true) with check (true);
create policy "demo_allow_all_courses" on courses for all using (true) with check (true);
create policy "demo_allow_all_course_materials" on course_materials for all using (true) with check (true);
create policy "demo_allow_all_topics" on topics for all using (true) with check (true);
create policy "demo_allow_all_notes" on notes for all using (true) with check (true);
create policy "demo_allow_all_roadmaps" on roadmaps for all using (true) with check (true);
create policy "demo_allow_all_study_packs" on study_packs for all using (true) with check (true);
create policy "demo_allow_all_attempts" on attempts for all using (true) with check (true);
create policy "demo_allow_all_streak_log" on streak_log for all using (true) with check (true);