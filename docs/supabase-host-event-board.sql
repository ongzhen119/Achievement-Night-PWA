-- Aexern Host Event Board
-- Run in Supabase SQL Editor after supabase-companion-revamp.sql.
-- Table is named host_events because the legacy achievement system already owns "events".
--
-- IMPORTANT: after running this once, set the real host PIN (replace CHANGE-ME below,
-- or run later):
--   update public.host_secrets set pin_hash = crypt('your-new-pin', gen_salt('bf'));

create extension if not exists pgcrypto;

-- 1. Events
create table if not exists public.host_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  game_system text not null default 'Warhammer Underworlds',
  event_type text not null default 'Casual Session',
  format text not null default 'Teaching Game / Rivals / Nemesis',
  venue_name text not null default 'Aexern Board Game Shop',
  venue_note text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Kuala_Lumpur',
  host_name text not null default 'Raven',
  status text not null default 'scheduled'
    check (status in ('draft', 'scheduled', 'cancelled', 'completed')),
  beginner_friendly boolean not null default true,
  demo_available boolean not null default true,
  board_count integer not null default 2 check (board_count >= 0),
  player_capacity integer check (player_capacity is null or player_capacity > 0),
  description text,
  what_to_bring text,
  prize_note text,
  whatsapp_note text,
  cancelled_reason text,
  completed_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (status <> 'cancelled' or length(trim(coalesce(cancelled_reason, ''))) > 0)
);

create index if not exists host_events_status_start_idx
  on public.host_events (status, start_at);

-- 2. Player interest ("I'm Interested", not registration)
create table if not exists public.event_interests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.host_events(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create index if not exists event_interests_event_idx
  on public.event_interests (event_id);

-- 3. Host PIN, stored server-side only (RLS enabled, zero policies = not readable via API)
create table if not exists public.host_secrets (
  id boolean primary key default true check (id),
  pin_hash text not null
);

alter table public.host_secrets enable row level security;

insert into public.host_secrets (pin_hash)
values (crypt('CHANGE-ME', gen_salt('bf')))
on conflict (id) do nothing;

-- 4. RLS: public can read non-draft events and read/insert interest. Nobody can
--    write host_events through the anon key; host writes go through the RPCs below.
alter table public.host_events enable row level security;
alter table public.event_interests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'host_events'
      and policyname = 'public read visible host events'
  ) then
    create policy "public read visible host events"
      on public.host_events for select using (status <> 'draft');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_interests'
      and policyname = 'public read event interests'
  ) then
    create policy "public read event interests"
      on public.event_interests for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_interests'
      and policyname = 'public mark interest on scheduled events'
  ) then
    create policy "public mark interest on scheduled events"
      on public.event_interests for insert with check (
        exists (
          select 1 from public.host_events e
          where e.id = event_id and e.status = 'scheduled'
        )
      );
  end if;
end $$;

grant select on public.host_events to anon, authenticated;
grant select, insert on public.event_interests to anon, authenticated;

-- 5. Host RPCs (security definer: they bypass RLS after checking the PIN)
create or replace function public.host_verify_pin(p_pin text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.host_secrets
    where pin_hash = crypt(p_pin, pin_hash)
  );
$$;

-- Returns all events including drafts, for Host Mode.
create or replace function public.host_list_events(p_pin text)
returns setof public.host_events
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.host_verify_pin(p_pin) then
    raise exception 'HOST_PIN_INVALID';
  end if;
  return query select * from public.host_events;
end;
$$;

-- Create (no id in p_event) or full update (id present). The client always sends
-- the complete editable field set, so the update overwrites every editable column.
create or replace function public.host_save_event(p_pin text, p_event jsonb)
returns public.host_events
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.host_events;
  saved public.host_events;
begin
  if not public.host_verify_pin(p_pin) then
    raise exception 'HOST_PIN_INVALID';
  end if;

  r := jsonb_populate_record(null::public.host_events, p_event);

  if r.id is null then
    insert into public.host_events (
      title, game_system, event_type, format, venue_name, venue_note,
      start_at, end_at, timezone, host_name, status, beginner_friendly,
      demo_available, board_count, player_capacity, description,
      what_to_bring, prize_note, whatsapp_note, cancelled_reason, completed_summary
    ) values (
      r.title,
      coalesce(r.game_system, 'Warhammer Underworlds'),
      coalesce(r.event_type, 'Casual Session'),
      coalesce(r.format, 'Teaching Game / Rivals / Nemesis'),
      coalesce(r.venue_name, 'Aexern Board Game Shop'),
      r.venue_note,
      r.start_at,
      r.end_at,
      coalesce(r.timezone, 'Asia/Kuala_Lumpur'),
      coalesce(r.host_name, 'Raven'),
      coalesce(r.status, 'scheduled'),
      coalesce(r.beginner_friendly, true),
      coalesce(r.demo_available, true),
      coalesce(r.board_count, 2),
      r.player_capacity,
      r.description,
      r.what_to_bring,
      r.prize_note,
      r.whatsapp_note,
      r.cancelled_reason,
      r.completed_summary
    )
    returning * into saved;
  else
    update public.host_events set
      title = r.title,
      game_system = coalesce(r.game_system, game_system),
      event_type = r.event_type,
      format = r.format,
      venue_name = r.venue_name,
      venue_note = r.venue_note,
      start_at = r.start_at,
      end_at = r.end_at,
      timezone = coalesce(r.timezone, timezone),
      host_name = r.host_name,
      status = r.status,
      beginner_friendly = r.beginner_friendly,
      demo_available = r.demo_available,
      board_count = r.board_count,
      player_capacity = r.player_capacity,
      description = r.description,
      what_to_bring = r.what_to_bring,
      prize_note = r.prize_note,
      whatsapp_note = r.whatsapp_note,
      cancelled_reason = r.cancelled_reason,
      completed_summary = r.completed_summary,
      updated_at = now()
    where id = r.id
    returning * into saved;

    if saved.id is null then
      raise exception 'EVENT_NOT_FOUND';
    end if;
  end if;

  return saved;
end;
$$;

grant execute on function public.host_verify_pin(text) to anon, authenticated;
grant execute on function public.host_list_events(text) to anon, authenticated;
grant execute on function public.host_save_event(text, jsonb) to anon, authenticated;
