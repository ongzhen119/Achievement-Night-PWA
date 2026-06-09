# Achievement Night PWA

Mobile-first React + Vite + TypeScript PWA for casual weekly tabletop nights. Players join by event link, enter the host join code, save achievements to Supabase, and view a live ranking. Hosts use a pin-gated page to manage players, reset achievements, lock the event, and screenshot the ranking.

## Run Locally

```bash
npm install
npm run dev
npm run build
```

## Supabase Environment

Create a Supabase project, then copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Restart `npm run dev` after changing environment variables.

## Table Creation SQL

Run this SQL in the Supabase SQL editor.

```sql
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  event_date date not null,
  join_code text not null,
  host_pin text not null,
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  warband text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  achievement_id text not null,
  created_at timestamptz not null default now(),
  unique (event_id, player_id, achievement_id)
);

create index if not exists players_event_id_idx
  on public.players(event_id);

create index if not exists player_achievements_event_id_idx
  on public.player_achievements(event_id);

create index if not exists player_achievements_player_id_idx
  on public.player_achievements(player_id);

alter table public.events enable row level security;
alter table public.players enable row level security;
alter table public.player_achievements enable row level security;

create policy "MVP read events"
  on public.events for select
  using (true);

create policy "MVP update events"
  on public.events for update
  using (true)
  with check (true);

create policy "MVP read players"
  on public.players for select
  using (true);

create policy "MVP insert players"
  on public.players for insert
  with check (true);

create policy "MVP delete players"
  on public.players for delete
  using (true);

create policy "MVP read achievements"
  on public.player_achievements for select
  using (true);

create policy "MVP insert achievements"
  on public.player_achievements for insert
  with check (true);

create policy "MVP update achievements"
  on public.player_achievements for update
  using (true)
  with check (true);

create policy "MVP delete achievements"
  on public.player_achievements for delete
  using (true);
```

These MVP policies are intentionally permissive because the app does not include full login yet. The host pin is a lightweight UI gate, not a secure admin system. Tighten RLS before using this for anything sensitive.

For live ranking updates, enable Realtime for `players`, `player_achievements`, and `events` in Supabase.

## Create a New Weekly Event

Insert one row into `events` for each weekly night:

```sql
insert into public.events (slug, name, event_date, join_code, host_pin)
values (
  'aexern-achievement-night-2026-06-13',
  'Aexern Achievement Night',
  '2026-06-13',
  'EMBER13',
  'HOST-1337'
);
```

Players use `/event/aexern-achievement-night-2026-06-13`.

Hosts use `/event/aexern-achievement-night-2026-06-13/host`.

## Edit Checklist Wording

Edit achievement grouping and IDs in:

```txt
src/data/achievements.ts
```

Edit English and Simplified Chinese visible wording in:

```txt
src/i18n/translations.ts
```

The checklist score is calculated from checked rows in `player_achievements`, not from local storage.

## Share in WhatsApp

After deploying the PWA, send the event URL to the group chat:

```txt
https://your-domain.example/event/aexern-achievement-night-2026-06-13
```

Include the join code in the message. Example:

```txt
Achievement Night is open.
Link: https://your-domain.example/event/aexern-achievement-night-2026-06-13
Join code: EMBER13
```

After the event, open the ranking page or host ranking preview and screenshot it for WhatsApp.
