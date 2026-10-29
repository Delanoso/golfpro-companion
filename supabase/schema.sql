-- Run this once in Supabase SQL Editor.
-- Includes app profile + sync storage + shared leagues with invite links.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  public_profile boolean not null default false,
  share_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  is_archived boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
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

alter table public.players add column if not exists public_profile boolean not null default false;
alter table public.players add column if not exists share_code text;
alter table public.players add column if not exists updated_at timestamptz not null default now();
create unique index if not exists players_share_code_unique_idx on public.players(share_code) where share_code is not null;

alter table public.leagues add column if not exists is_archived boolean not null default false;
alter table public.leagues add column if not exists is_locked boolean not null default false;

alter table public.league_members add column if not exists role text not null default 'member';
alter table public.league_members drop constraint if exists league_members_role_check;
alter table public.league_members
  add constraint league_members_role_check check (role in ('member', 'admin'));

create unique index if not exists league_rounds_unique_source_per_user
  on public.league_rounds(league_id, user_id, source_round_id)
  where source_round_id is not null;

alter table public.players enable row level security;
alter table public.player_app_data enable row level security;
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

create or replace function public.is_league_admin(target_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leagues l
    where l.id = target_league_id
      and l.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.league_members lm
    where lm.league_id = target_league_id
      and lm.user_id = auth.uid()
      and lm.role = 'admin'
  );
$$;

grant execute on function public.is_league_member(uuid) to authenticated;
grant execute on function public.is_league_admin(uuid) to authenticated;

drop policy if exists players_insert_own on public.players;
create policy players_insert_own
on public.players
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists players_select_visible on public.players;
create policy players_select_visible
on public.players
for select
to anon, authenticated
using (public_profile = true or auth.uid() = id);

drop policy if exists players_update_own on public.players;
create policy players_update_own
on public.players
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists player_app_data_select_own on public.player_app_data;
create policy player_app_data_select_own
on public.player_app_data
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists player_app_data_select_public on public.player_app_data;
create policy player_app_data_select_public
on public.player_app_data
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.players p
    where p.id = user_id
      and p.public_profile = true
  )
);

drop policy if exists player_app_data_insert_own on public.player_app_data;
create policy player_app_data_insert_own
on public.player_app_data
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists player_app_data_update_own on public.player_app_data;
create policy player_app_data_update_own
on public.player_app_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists leagues_update_admin on public.leagues;
create policy leagues_update_admin
on public.leagues
for update
to authenticated
using (public.is_league_admin(id))
with check (public.is_league_admin(id));

drop policy if exists leagues_delete_owner on public.leagues;
create policy leagues_delete_owner
on public.leagues
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists league_members_select_member on public.league_members;
create policy league_members_select_member
on public.league_members
for select
to authenticated
using (public.is_league_member(league_id));

drop policy if exists league_members_insert_self on public.league_members;
create policy league_members_insert_self
on public.league_members
for insert
to authenticated
with check (auth.uid() = user_id and role = 'member');

drop policy if exists league_members_update_member_or_admin on public.league_members;
create policy league_members_update_member_or_admin
on public.league_members
for update
to authenticated
using (auth.uid() = user_id or public.is_league_admin(league_id))
with check (auth.uid() = user_id or public.is_league_admin(league_id));

drop policy if exists league_members_delete_member_or_admin on public.league_members;
create policy league_members_delete_member_or_admin
on public.league_members
for delete
to authenticated
using (auth.uid() = user_id or public.is_league_admin(league_id));

drop policy if exists league_rounds_select_member on public.league_rounds;
create policy league_rounds_select_member
on public.league_rounds
for select
to authenticated
using (public.is_league_member(league_id));

drop policy if exists league_rounds_insert_self on public.league_rounds;
create policy league_rounds_insert_self
on public.league_rounds
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_league_member(league_id)
  and exists (
    select 1
    from public.leagues l
    where l.id = league_id
      and l.is_archived = false
      and l.is_locked = false
  )
);

drop policy if exists league_rounds_delete_admin_or_owner on public.league_rounds;
create policy league_rounds_delete_admin_or_owner
on public.league_rounds
for delete
to authenticated
using (auth.uid() = user_id or public.is_league_admin(league_id));
