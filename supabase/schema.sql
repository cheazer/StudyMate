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

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  course_name text not null,
  title text not null,
  category text not null check (category in ('math','programming','science','other')),
  progress_percent int not null default 0,
  last_touched timestamptz default now()
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

-- Row-level security: every table is scoped to the owning user.
alter table profiles enable row level security;
alter table topics enable row level security;
alter table roadmaps enable row level security;
alter table study_packs enable row level security;
alter table attempts enable row level security;
alter table streak_log enable row level security;

-- TODO once auth is wired up: replace the permissive demo policies below with
-- using (auth.uid() = user_id) / with check (auth.uid() = user_id) on each
-- table. Left open here so the hackathon build isn't blocked on auth first.
create policy "demo_allow_all_profiles" on profiles for all using (true) with check (true);
create policy "demo_allow_all_topics" on topics for all using (true) with check (true);
create policy "demo_allow_all_roadmaps" on roadmaps for all using (true) with check (true);
create policy "demo_allow_all_study_packs" on study_packs for all using (true) with check (true);
create policy "demo_allow_all_attempts" on attempts for all using (true) with check (true);
create policy "demo_allow_all_streak_log" on streak_log for all using (true) with check (true);