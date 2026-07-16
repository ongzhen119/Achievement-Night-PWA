-- Digital Playmat (Warhammer Underworlds companion)
-- Safe additive migration. Existing companion tables are not touched.
-- Run this whole file in the Supabase SQL editor, then restart the dev server.
--
-- Architecture: event sourcing.
--   playmat_rooms   -> one row per table/room (code, status)
--   playmat_players -> one row per seat in a room
--   playmat_events  -> append-only ordered action log; clients replay it
-- Nothing overwrites whole game state; every action is one inserted event row.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.playmat_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9]{4}$'),
  status text not null default 'lobby' check (status in ('lobby', 'active', 'ended')),
  created_at timestamptz not null default now()
);

create unique index if not exists playmat_rooms_code_unique
  on public.playmat_rooms (code);

create table if not exists public.playmat_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.playmat_rooms(id) on delete cascade,
  -- Device secret stored in localStorage so a refreshed browser can resume
  -- its seat without any login. Honour system, same as the rest of the app.
  token uuid not null default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  deck_id text,
  is_host boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists playmat_players_room_idx
  on public.playmat_players (room_id);

create table if not exists public.playmat_events (
  -- Monotonic id gives every room a single authoritative event order.
  id bigint generated always as identity primary key,
  room_id uuid not null references public.playmat_rooms(id) on delete cascade,
  player_id uuid references public.playmat_players(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists playmat_events_room_idx
  on public.playmat_events (room_id, id);

-- ---------------------------------------------------------------------------
-- Row Level Security (public honour-system policies, like the rest of the app)
-- ---------------------------------------------------------------------------

alter table public.playmat_rooms enable row level security;
alter table public.playmat_players enable row level security;
alter table public.playmat_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_rooms'
      and policyname = 'playmat public read rooms'
  ) then
    create policy "playmat public read rooms"
      on public.playmat_rooms for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_rooms'
      and policyname = 'playmat public create rooms'
  ) then
    create policy "playmat public create rooms"
      on public.playmat_rooms for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_rooms'
      and policyname = 'playmat public update rooms'
  ) then
    create policy "playmat public update rooms"
      on public.playmat_rooms for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_players'
      and policyname = 'playmat public read players'
  ) then
    create policy "playmat public read players"
      on public.playmat_players for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_players'
      and policyname = 'playmat public create players'
  ) then
    create policy "playmat public create players"
      on public.playmat_players for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_players'
      and policyname = 'playmat public update players'
  ) then
    create policy "playmat public update players"
      on public.playmat_players for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_events'
      and policyname = 'playmat public read events'
  ) then
    create policy "playmat public read events"
      on public.playmat_events for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_events'
      and policyname = 'playmat public create events'
  ) then
    create policy "playmat public create events"
      on public.playmat_events for insert with check (true);
  end if;
end $$;

grant select, insert, update on public.playmat_rooms to anon, authenticated;
grant select, insert, update on public.playmat_players to anon, authenticated;
grant select, insert on public.playmat_events to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: publish inserts/updates so every connected device syncs instantly
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'playmat_rooms'
  ) then
    alter publication supabase_realtime add table public.playmat_rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'playmat_players'
  ) then
    alter publication supabase_realtime add table public.playmat_players;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'playmat_events'
  ) then
    alter publication supabase_realtime add table public.playmat_events;
  end if;
end $$;
