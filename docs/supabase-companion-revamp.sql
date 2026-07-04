-- Aexern Underworlds Companion MVP
-- Safe additive migration: legacy achievement/event tables and rows are not dropped.

create extension if not exists pgcrypto;

create table if not exists public.community_players (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (length(trim(nickname)) > 0),
  favourite_warband text,
  joined_year integer check (joined_year is null or joined_year between 1900 and 2200),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists community_players_nickname_unique
  on public.community_players (lower(trim(nickname)));

-- Create the existing legacy table when this is a fresh companion installation.
create table if not exists public.battle_records (
  id uuid primary key default gen_random_uuid(),
  community_player_id text not null,
  event_id uuid,
  event_slug text,
  battle_result text not null check (battle_result in ('win', 'loss', 'draw')),
  warband text not null,
  opponent_warband text,
  format text,
  epic_moments text[],
  glory_score integer,
  notes text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.battle_records
  add column if not exists played_on date,
  add column if not exists player_id uuid references public.community_players(id),
  add column if not exists opponent_id uuid references public.community_players(id),
  add column if not exists player_warband text,
  add column if not exists result text,
  add column if not exists player_glory integer,
  add column if not exists opponent_glory integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'battle_records_companion_complete_check'
  ) then
    alter table public.battle_records add constraint battle_records_companion_complete_check
      check (
        player_id is null or (
          played_on is not null and opponent_id is not null and
          player_warband is not null and opponent_warband is not null and
          format is not null and result is not null and
          player_glory is not null and opponent_glory is not null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'battle_records_companion_values_check'
  ) then
    alter table public.battle_records add constraint battle_records_companion_values_check
      check (
        player_id is null or (
          player_id <> opponent_id and
          format in ('Rivals', 'Nemesis') and
          result in ('win', 'loss', 'draw') and
          player_glory >= 0 and opponent_glory >= 0
        )
      );
  end if;
end $$;

create index if not exists battle_records_played_on_idx
  on public.battle_records (played_on desc, created_at desc);

create index if not exists battle_records_player_id_idx
  on public.battle_records (player_id);

create index if not exists battle_records_opponent_id_idx
  on public.battle_records (opponent_id);

alter table public.community_players enable row level security;
alter table public.battle_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_players'
      and policyname = 'companion public read players'
  ) then
    create policy "companion public read players"
      on public.community_players for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_players'
      and policyname = 'companion public create players'
  ) then
    create policy "companion public create players"
      on public.community_players for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'battle_records'
      and policyname = 'companion public read battles'
  ) then
    create policy "companion public read battles"
      on public.battle_records for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'battle_records'
      and policyname = 'companion public create battles'
  ) then
    create policy "companion public create battles"
      on public.battle_records for insert with check (true);
  end if;
end $$;

grant select, insert on public.community_players to anon, authenticated;
grant select, insert on public.battle_records to anon, authenticated;
