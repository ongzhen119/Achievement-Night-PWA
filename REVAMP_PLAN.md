# Aexern Underworlds Companion Revamp Plan

## Summary

Replace the achievement/event-ranking product with an activity-first community companion. One battle becomes one shared record credited to both players. Supabase remains the shared store; profile selection is saved locally without login.

Before product code changes:

1. Run approved `codegraph init -i`.
2. Preserve existing Supabase tables and rows; apply no destructive migration.

## Current Project Diagnosis

- Current routes: Home, local Profile, Hall of Fame, achievement Stats, Event Join, Checklist, Quick Start, Ranking, Result, Battle Record, and Host.
- Current components: `AchievementCard`, `BottomNav`, `HostPlayerRow`, `LanguageToggle`, `PlayerHeader`, `QuickStartStepCard`, `RankingCard`, and `SectionPanel`.
- Persistence:
  - Supabase stores events, event players, achievements, battle records, and Hall of Fame records.
  - SQL definitions are split between README and three migration files rather than one current schema.
  - Local storage holds language, one device-local community profile, event player caches, and Quick Start progress.
- A partial community pivot already exists, but battle logging is buried behind `/event/:slug/result`.
- Existing battles lack opponent player ID and opponent glory. Stats credit only the submitting player, so duplicate or incomplete histories are likely.
- Profiles are device-local UUIDs rather than selectable shared community players.
- Home has no primary “Log Battle” action or recent activity feed and duplicates navigation links.
- Stats, rankings, host tools, titles, and Hall of Fame remain achievement-driven.
- The event host PIN is fetched through public Supabase reads and checked in the browser; it is only a UI gate, not security.
- Existing dark stone/gold/ember styling, bilingual support, PWA shell, language toggle, and mobile tap sizing are reusable.
- Branding still says “Achievement” in UI, translations, HTML metadata, manifest, cache name, and icon.
- TypeScript currently passes; there is no automated test suite.
- CodeGraph is not initialized; initialization was approved.

### Achievement removal

Remove from the active product:

- Event Join, Checklist, Ranking, Result Card, achievement Stats, and achievement Host routes/pages.
- `AchievementCard`, `SectionPanel`, `PlayerHeader`, `RankingCard`, and `HostPlayerRow`.
- Achievement definitions, level logic, achievement scoring/stat queries, event player cache, ranking subscriptions, and obsolete translations/styles.
- Achievement-derived Hall of Fame UI. Keep its database table untouched as legacy data.

Retain Quick Start as a secondary standalone `/guide` route outside primary navigation.

## New Application Structure

- `/` — Community Hub: Aexern logo placeholder, selected profile, large Log Battle button, recent battles, compact community totals, secondary Quick Start link.
- `/battles/new` — Log Battle.
- `/battles` — chronological shared Battle Records.
- `/players` — create/select a community player and view the roster.
- `/players/:playerId` — Player Profile with games, W/L/D, glory, warbands, and recent battles.
- `/community` — screenshot-friendly Community Board with overall activity and player record cards.
- `/guide` — retained Quick Start guide.
- Unknown routes redirect to `/`.

Primary mobile navigation: Home, Battles, Players, Community. Settings/Data Management is omitted from MVP.

## Data Model and Login Recommendation

### Profiles

Use a Supabase `community_players` table plus local profile selection:

- `id`
- `nickname`
- `default_warband_id`
- `is_active`
- `created_at`
- case-insensitive unique nickname

Store only the selected player ID in local storage. On first use, the player selects an existing nickname or creates one.

Do not add PINs, Supabase Auth, or full login. For four trusted players, profile selection has the lowest barrier. A client-readable PIN would provide false security; anonymous/full auth should only be added when impersonation or editing becomes a demonstrated problem.

### Warbands

Create a small Supabase `warbands` catalog:

- `id`
- `name`
- `is_active`
- `created_at`

Manage rows manually in Supabase for MVP; no warband administration UI.

### Battles

Reuse and migrate `battle_records` rather than introducing a parallel table. Expose this TypeScript model:

```ts
type Battle = {
  id: string;
  date: string;
  playerId: string;
  opponentId: string;
  playerWarband: string;
  opponentWarband: string;
  format: "Rivals" | "Nemesis";
  result: "win" | "loss" | "draw";
  playerGlory: number;
  opponentGlory: number;
  notes: string | null;
  sessionId: string | null;
  createdAt: string;
};
```

Add the missing opponent ID, opponent glory, played date, and warband references while mapping existing columns such as `community_player_id`, `battle_result`, and `glory_score`.

One physical game creates one row. The opponent receives the inverse result automatically; draws remain draws. Both players’ glory and game totals derive from that row.

Legacy rows without opponent identity remain stored and visible only as legacy activity; exclude them from new two-sided community totals until manually completed.

### Sessions and statistics

Reuse existing `events` as optional store sessions. The new UI consumes only ID, name, and event date; battle logging does not require a session.

Do not create a community-statistics table. Derive totals and player summaries from players and shared battle rows. Four players do not justify aggregate infrastructure.

RLS remains honour-system based: public read and insert for profiles and battles, with no general update/delete UI.

## UI/UX Direction

- Preserve the existing charcoal, gold, ember-red, parchment, serif-heading, and bilingual foundations.
- Add an obvious Aexern logo placeholder without copyrighted artwork.
- Make “Log Battle” the dominant action on Home.
- Use compact battle cards showing both players, warbands, result, glory, format, date, and memorable note.
- Keep profile creation/selection and the battle form usable with one hand after a game.
- Community Board prioritizes activity and history—total battles, players, total glory, player records, and memorable moments—not ELO or league position.
- Keep screenshot content inside a clean board panel without controls or fixed navigation overlapping it.
- Replace all visible Achievement branding, manifest metadata, cache names, and icon references.
- Preserve English/Simplified Chinese and verify both languages at mobile width.

## MVP Scope

### Must implement now

- Shared Supabase player roster and local selection.
- One-row shared battle logging with both players, warbands, glory scores, format, result, date, and notes.
- Community Hub, Battle Records, Players, Player Profile, and Community Board.
- Recent activity and derived W/L/D/glory statistics.
- Achievement-flow removal, new navigation, Aexern/PWA rebranding, bilingual copy, migration SQL, and README setup instructions.
- Clear empty, loading, offline/configuration, and save-error states.

### Can implement later

- Secure profile PIN or Supabase anonymous authentication.
- Battle editing/deletion with authenticated ownership.
- Realtime feeds, session management UI, filters, exports, and richer Hall of Fame awards.
- Host moderation and historical legacy-data repair tools.

### Avoid for now

- ELO, leagues, tournament pairing, opponent confirmation, full accounts, payments, notifications, achievement checklists, and speculative admin systems.

## Safe Implementation Sequence

1. Initialize CodeGraph before product edits.
2. Add one idempotent Supabase revamp migration; preserve existing tables and rows.
3. Update Supabase types, profile storage, battle queries, and pure two-sided stat calculations.
4. Replace routes and pages, repurpose `BottomNav`, and add only reusable battle/player cards.
5. Remove orphaned achievement pages, components, utilities, translations, and their CSS.
6. Rebrand HTML, manifest, service-worker cache, icon placeholder, README, and Supabase instructions.
7. Build and visually verify the complete mobile flow.

Likely touched areas: `src/main.tsx`, `src/pages`, `src/components/BottomNav.tsx`, Supabase/profile/stat utilities, translations/styles, `public`, README, and a new SQL migration under `docs`.

## Test and Acceptance Plan

- Add one dependency-free development self-check for two-sided stats: win/loss inversion, draws, glory totals, and one shared battle counted once globally and once per player.
- Verify rejection of self-opponents, missing participants, invalid formats, and negative glory.
- Verify create/select profile persistence and profile switching.
- Verify legacy incomplete battles do not corrupt shared totals.
- Run TypeScript and production build.
- Browser-test at approximately 390px width in English and Chinese.
- Confirm Home → select/create profile → log battle → recent feed → both player profiles → Community Board.
- Confirm the Community Board is readable in a WhatsApp screenshot and no achievement UI remains reachable from the main flow.
- Confirm install metadata uses Aexern Companion branding.

## Assumptions

- Existing Supabase and Vite dependencies remain; no new backend or test framework is added.
- Existing battle/event data must be preserved, even when incomplete.
- Unknown / needs confirmation: which migrations are deployed and whether current rows are production history. The migration therefore performs no drops.
- Unknown / needs confirmation: final Aexern logo artwork. MVP uses a clearly replaceable original placeholder.
