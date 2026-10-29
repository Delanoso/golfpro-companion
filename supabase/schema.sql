-- Run this once in Supabase SQL Editor.
-- Enables shared leagues with invite links and linked scorecards.

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table if not exists public.league_rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  source_round_id text,
  round_date date not null,
  course text not null,
  par integer not null,
  total_score integer not null,
  putts integer not null,
  one_putts integer not null,
  three_putts integer not null,
  holes integer not null check (holes in (9, 18)),
  hole_scores jsonb not null default '[]'::jsonb,
  wedge_shots jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_rounds enable row level security;

create or replace function public.is_league_member(target_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members lm
    where lm.league_id = target_league_id
      and lm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_league_member(uuid) to authenticated;

-- League access: users can create leagues they own.
drop policy if exists leagues_insert_own on public.leagues;
create policy leagues_insert_own
on public.leagues
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists leagues_select_authenticated on public.leagues;
create policy leagues_select_authenticated
on public.leagues
for select
to authenticated
using (true);

-- Members: users can see members in leagues they belong to.
drop policy if exists league_members_select_member on public.league_members;
create policy league_members_select_member
on public.league_members
for select
to authenticated
using (public.is_league_member(league_id));

-- Members: users can insert themselves into leagues (join by invite code done in app).
drop policy if exists league_members_insert_self on public.league_members;
create policy league_members_insert_self
on public.league_members
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists league_members_update_self on public.league_members;
create policy league_members_update_self
on public.league_members
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- League rounds: members can read rounds from their leagues.
drop policy if exists league_rounds_select_member on public.league_rounds;
create policy league_rounds_select_member
on public.league_rounds
for select
to authenticated
using (public.is_league_member(league_id));

-- League rounds: members can add their own linked scorecards.
drop policy if exists league_rounds_insert_self on public.league_rounds;
create policy league_rounds_insert_self
on public.league_rounds
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_league_member(league_id)
);
