# Digital Playmat — Setup Guide

The Digital Playmat replaces physical **cards** while you keep playing with real
miniatures and dice at the table. Each player opens the app on their own phone,
picks their player name, warband, and deck, joins the same room with a 4-letter
code, and every draw, play, glory change and upgrade syncs instantly through
Supabase Realtime.

It is a 1v1 companion, not a rules engine: a room seats **two** players and the
app never enforces game rules — players move cards like real cardboard.

---

## 1. Database setup

Run these two files in the Supabase SQL editor, in order (both are additive and
safe to re-run):

1. `docs/supabase-digital-playmat.sql` — rooms, seats, and the event log.
2. `docs/supabase-digital-playmat-v2.sql` — player selection, warband/format on
   each seat, and the `playmat_custom_decks` table for Nemesis decks.

They reuse your existing `community_players` table for player identity, so
players are chosen from a dropdown — no typing names, no login.

## 2. Warband and deck are separate

A player brings a **warband** (their fighters) and, separately, a **deck** of
cards. Any warband can pair with any deck.

**Warbands** — edit `src/data/playmat/warbands.ts`. Four are scaffolded:

- The Gnarlspirit Pack
- Sons of Velmorn
- Grinkak's Looncourt
- Drepur's Wraithcreepers

Each warband may have **3 to 7 fighters** — just add or remove entries in its
`fighters` array and set each fighter's `name` and printed `wounds`.

**Decks** — the four fixed Rivals decks live in `src/data/playmat/rivalsDecks.ts`:

- Blazing Assault
- Emberstone Sentinel
- Pillage and Plunder
- Countdown to Cataclysm

Each card has a `type` (`objective` / `gambit` / `upgrade`) plus, for the
Nemesis builder, `glory` and `surge` on objectives and `ploy` on gambits.

## 3. Card and fighter images (pre-loaded)

Card data and images come from the open-source **wunderworlds.club** project
([PompolutZ/wuclub_monorepo](https://github.com/PompolutZ/wuclub_monorepo)) —
please credit them, and consider dropping the author a thank-you. The images
are © Games Workshop; this is unofficial fan content for personal community
play.

Already vendored into the project (no work needed):

- `public/cards/<deckId>/<CODE><n>.webp` — all 128 cards of the four decks
  (BL/ES/PL/CC), bilingual EN/中文 renders, plus Countdown to Cataclysm's Map
  and Plot cards.
- `public/warbands/<warbandId>/…webp` — fighter cards + inspired sides +
  warscrolls for Gnarlspirit Pack, Sons of Velmorn, and Grinkrak's Looncourt.

To re-download (or pick up upstream fixes):

```bash
node scripts/fetch-wuclub-assets.mjs          # skips existing files
node scripts/fetch-wuclub-assets.mjs --force  # re-downloads everything
```

**Missing: Drepur's Wraithcreepers fighter cards** — the wuclub repo has no
images for them yet. Those four fighters show styled text placeholders until
you drop scans into `public/warbands/drepurs-wraithcreepers/` and point the
`image`/`inspiredImage` fields in `src/data/playmat/warbands.ts` at them (also
set their real printed Wounds there).

All card names, glory values, Surge/Ploy flags, and full rules text were
generated from the wuclub card database into `src/data/playmat/rivalsDecks.ts`
— the zoom view shows each card's rules text below the image.

## 4. Formats: Rivals and Nemesis

When setting up a seat, a player chooses a **format**:

- **Rivals** — use one of the four fixed decks as-is. No building.
- **Nemesis** — use a custom deck built in the Deck Builder.

### Deck Builder (`/playmat/decks`)

Nemesis decks are saved to a player's profile in Supabase (pick the player
first, then build). The builder enforces the Nemesis rules:

- Choose exactly **2 different** Rivals decks as sources.
- Objective deck: **12+** objective cards, at most **6 Surge**.
- Power deck: **20+** power cards, at most **half** may be Ploys.
- Every card name must be **unique** within each deck.

A live legal/illegal badge shows status. You can browse and search the combined
card pool, filter by type / Surge / Ploy, view any card full-size, and
create / edit / duplicate / delete decks. Decks can also be exported and
imported as a share code.

## 5. Playing a game

1. **Home → Digital Playmat** (`/playmat`).
2. Set up your seat: choose your **player** (dropdown, or add a new one),
   **warband**, then **format** and **deck**.
3. Host taps **Create Room** and reads the 4-letter code to their opponent.
4. The opponent taps **Join Room** with the code (or opens `/playmat/CODE`),
   sets up their own seat, and sits down. A room holds two players only.
5. Host taps **Start Game** — decks shuffle and opening hands deal (5 power /
   3 objectives).
6. During play (all synced live):
   - Tap a card to zoom; big buttons play / discard / score / attach / move.
   - Tap a deck pile to draw or shuffle.
   - Tap a fighter for damage, inspire, out-of-action, and attached upgrades.
   - Glory `+`/`−` in the dock; scoring an objective adds its glory
     automatically.
   - **End Phase** cycles the round; the book icon shows the battle log.
7. After round 3 the host can **End Game** for a final glory standings screen.

Refresh/disconnect is safe: the seat is remembered on the device and the full
game state is rebuilt by replaying the event log.

## 6. Architecture notes

Every action is one row in `playmat_events`, replayed through a pure reducer
(`src/utils/playmat/engine.ts`). Cards are referenced by a global uid
(`<deckId>:<cardId>`) resolved through `src/data/playmat/catalog.ts`, so a deck —
fixed or custom — is just a list of uids. Nothing overwrites whole game state,
leaving room for replay/undo/spectator later.

Key files:

```
src/data/playmat/warbands.ts       warbands + fighters (host edits)
src/data/playmat/rivalsDecks.ts    the four fixed decks (host edits)
src/data/playmat/catalog.ts        combined card pool + uid lookups
src/utils/playmat/engine.ts        event reducer + replay
src/utils/playmat/deckRules.ts     Nemesis validation + deck codes
src/utils/playmat/customDecks.ts   custom deck CRUD (Supabase)
src/utils/playmat/rooms.ts         rooms/seats/events + 2-player cap
src/utils/playmat/useGameRoom.ts   realtime sync hook
src/pages/PlaymatLobbyPage.tsx     /playmat  (seat setup + create/join)
src/pages/PlaymatRoomPage.tsx      /playmat/:code  (lobby + game board)
src/pages/PlaymatDecksPage.tsx     /playmat/decks  (deck list)
src/pages/PlaymatDeckEditorPage.tsx /playmat/decks/:id  (builder)
src/components/playmat/*           tiles, pickers, modals, seat setup
```
