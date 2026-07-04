# Aexern Underworlds Companion

Mobile-first React, Vite, TypeScript, and Supabase PWA for the small Aexern board game shop community. It records one shared battle after each game, preserves player history, and provides a screenshot-friendly Community Board for WhatsApp.

This is a casual community log, not a tournament engine.

## Run Locally

```bash
npm install
npm run dev
npm run build
```

## Supabase Setup

Copy `.env.example` to `.env` and provide the public project values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Run [`docs/supabase-companion-revamp.sql`](docs/supabase-companion-revamp.sql) in the Supabase SQL editor, then restart the development server.

The migration is additive. Existing event, achievement, Hall of Fame, and legacy battle rows are not dropped. Legacy battles without two linked players are excluded from the new shared community statistics.

### Data storage

- `community_players`: nickname, optional favourite warband, optional joined year.
- `battle_records`: one physical game, both players, both warbands, format, result, glory scores, date, and memorable note.
- `localStorage`: selected player ID, language choice, and optional Quick Start progress.

The selected player is device/browser-specific. Clearing browser data requires selecting the player again, but shared profiles and battles remain in Supabase.

The MVP uses public read/insert policies and an honour system. It stores no email, phone number, password, or real identity. Do not use it for sensitive data.

## Main Routes

- `/` — Community Hub and recent battles.
- `/battles/new` — Log one shared battle.
- `/battles` — Battle history with a simple player filter.
- `/players` — Create or select a player.
- `/players/:playerId` — Player record and battle history.
- `/community` — Community Board and lightweight Hall of Fame.
- `/guide` — optional new-player table setup guide.

## What Changed

- “Log Battle” is now the main action.
- Profiles are shared Supabase rows selected locally without login.
- Each game updates both players from one battle record.
- Player records include games, W/L/D, win rate, favourite warband, and total glory.
- The Community Board includes Most Games, Top Win Rate, Most Glory, Most Recent Winner, and Most Active Player.
- Branding, install metadata, icon, navigation, and English/Chinese community labels now use Aexern Companion wording.

## What Was Removed from the Product Flow

Achievement checklist, achievement ranking, event join/result flow, and host achievement controls are no longer registered routes or navigation items. Their old source and database tables are retained temporarily for safe legacy compatibility, but the active app does not use them.

## WhatsApp Sharing

Open `/community` after a store session and capture the Community Board. It is formatted as a single mobile card without management controls inside the share area.

## Recommended Future Upgrade

Add Supabase anonymous authentication only when the community needs secure editing or deletion. Other deferred work includes host moderation, battle corrections, CSV export, session management, and realtime refresh. ELO, league ranking, tournament pairing, and full accounts remain intentionally out of scope.
