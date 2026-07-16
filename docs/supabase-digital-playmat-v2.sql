-- Digital Playmat v2 — warband/deck split, player selection, custom decks.
-- Run AFTER docs/supabase-digital-playmat.sql. Additive and idempotent.
--
-- Adds:
--   * playmat_players.community_player_id  (links a seat to a community player)
--   * playmat_players.warband_id           (fighters chosen)
--   * playmat_players.format               ('rivals' | 'nemesis')
--   * playmat_custom_decks                 (Nemesis decks saved to a profile)
-- Room player cap (max 2) is enforced in the app, not the schema.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- playmat_players: new columns
-- ---------------------------------------------------------------------------

alter table public.playmat_players
  add column if not exists community_player_id uuid references public.community_players(id),
  add column if not exists warband_id text,
  add column if not exists format text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'playmat_players_format_check'
  ) then
    alter table public.playmat_players add constraint playmat_players_format_check
      check (format is null or format in ('rivals', 'nemesis'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- playmat_custom_decks: Nemesis decks saved to a community player's profile
-- ---------------------------------------------------------------------------

create table if not exists public.playmat_custom_decks (
  id uuid primary key default gen_random_uuid(),
  community_player_id uuid not null references public.community_players(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  format text not null default 'nemesis' check (format in ('nemesis')),
  -- the two source Rivals decks this Nemesis deck draws from
  source_deck_ids text[] not null default '{}',
  -- chosen card uids ("<deckId>:<cardId>")
  objective_uids text[] not null default '{}',
  power_uids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playmat_custom_decks_owner_idx
  on public.playmat_custom_decks (community_player_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security (public honour-system policies, like the rest of the app)
-- ---------------------------------------------------------------------------

alter table public.playmat_custom_decks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_custom_decks'
      and policyname = 'playmat public read decks'
  ) then
    create policy "playmat public read decks"
      on public.playmat_custom_decks for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_custom_decks'
      and policyname = 'playmat public create decks'
  ) then
    create policy "playmat public create decks"
      on public.playmat_custom_decks for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_custom_decks'
      and policyname = 'playmat public update decks'
  ) then
    create policy "playmat public update decks"
      on public.playmat_custom_decks for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'playmat_custom_decks'
      and policyname = 'playmat public delete decks'
  ) then
    create policy "playmat public delete decks"
      on public.playmat_custom_decks for delete using (true);
  end if;
end $$;

grant select, insert, update, delete on public.playmat_custom_decks to anon, authenticated;

-- Realtime so a freshly saved deck appears on other devices without a refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'playmat_custom_decks'
  ) then
    alter publication supabase_realtime add table public.playmat_custom_decks;
  end if;
end $$;
