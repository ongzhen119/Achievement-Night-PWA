# AGENTS.md
# Product Vision

This application is not an achievement app.

It is a community platform for local Warhammer Underworlds events.

The priorities are:

1. Organise local events
2. Preserve community history
3. Celebrate champions
4. Encourage player retention
5. Achievements are optional side content

Every new feature should strengthen the community first before adding competitive systems.

Avoid unnecessary complexity.

Minimise login barriers.

Preserve simplicity for first-time players.


## Project Name

Achievement PWA

## Purpose

Build a mobile-first PWA for casual tabletop community events.

Players open an event link from WhatsApp, enter their name and warband, tick achievements, see their title/level, and view a live event ranking.

The app is for retention and community memory. It should help the host screenshot results and post them back to WhatsApp after each event.

This is not a tournament engine.

## Main Priority

Build a reusable weekly event system.

The host should be able to create or reuse an event, share the link, let players join, and screenshot the live ranking.

## Tech Stack

* React
* Vite
* TypeScript
* Supabase backend
* PWA support
* Mobile-first UI

Do not build a custom Node/ASP.NET backend for MVP.

## Backend Requirement

Use Supabase for persistence.

Required tables:

### events

* id
* slug
* name
* event_date
* join_code
* host_pin
* is_locked
* created_at

### players

* id
* event_id
* display_name
* warband
* created_at

### player_achievements

* id
* event_id
* player_id
* achievement_id
* created_at

Score should be calculated from checked achievements.

Do not collect phone number, email, password, real identity, or sensitive data.

## Event Behaviour

Each event has its own URL:

`/event/:slug`

Example:

`/event/aexern-achievement-2026-06-13`

Player flow:

1. Open event link
2. Enter join code
3. Enter player name
4. Enter warband
5. Tick achievements
6. View ranking / result card

Host flow:

1. Open `/event/:slug/host`
2. Enter host pin
3. View all players
4. Delete fake players
5. Reset a player’s achievements
6. Lock event
7. Screenshot ranking

Keep host tools minimal.

## Reusable Weekly Event Requirement

The app must support multiple events over time.

Do not hardcode one event only.

The host should be able to manage future weekly events through seed data or Supabase rows.

For MVP, event creation can be manual in Supabase table.

Add clear README instructions explaining how to create a new weekly event by inserting a row into the `events` table.

## Checklist Customisation

The achievement checklist must be easy for the host to edit.

All achievement definitions must be stored in:

`src/data/achievements.ts`

Do not hardcode achievement text inside React components.

Use translation keys in the achievement data.

Example:

```ts
export const achievements = [
  {
    id: "complete-first-game",
    sectionKey: "section.firstSteps",
    titleKey: "achievement.completeFirstGame",
    points: 1
  }
];
```

All visible achievement wording must be stored in:

`src/i18n/translations.ts`

To customise checklist wording:

1. Edit achievement ids / grouping in `src/data/achievements.ts`
2. Edit English and Chinese wording in `src/i18n/translations.ts`

Add comments in both files telling the host where to edit.

## Bilingual Requirement

Support:

* English
* Simplified Chinese

Default language: English.

Add language toggle:

* EN
* 中文

Save selected language in localStorage.

Do not hardcode visible text in components.

Create:

`src/i18n/translations.ts`
`src/i18n/useLanguage.ts`

The language hook should provide:

* current language
* set language
* `t(key)`

Recommended font stack:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif;
```

Chinese UI must not overflow cards or buttons.

## Required Pages

### 1. Landing / Join Page

Route:

`/event/:slug`

Show:

* event name
* event date
* app title
* short event description
* join code input
* player name input
* warband input
* button: Enter the Arena

Important text:

* Honour system note
* This is a casual community tracker

### 2. Checklist Page

Show:

* player name
* warband
* score
* current title
* progress bar
* achievement checklist grouped by section

Each achievement should be a toggle card.

Completed cards should feel claimed / glowing.

Unchecked cards should feel like dark stone or locked parchment.

### 3. Ranking Page

Show live ranking for current event:

* rank
* player name
* warband
* score
* title
* progress bar

This page must be screenshot-friendly.

Title:
“Achievement Ranking”

Footer:
“Casual Achievement · Honour System · Play for the story”

### 4. Result Card Page

Show current player:

* player name
* warband
* score / 16
* title
* completed achievement count
* slogan

Add button:

* Copy Summary Text

### 5. Host Page

Route:

`/event/:slug/host`

Host enters host pin.

After validation, show:

* event name
* players
* scores
* delete player
* reset player achievements
* lock/unlock event
* screenshot-friendly ranking preview

## Achievement Sections and Default Text

### First Steps / 入门成就

* Complete your first game / 完成你的第一局
* Make a successful move or charge / 成功进行一次移动或冲锋
* Play a power card successfully / 成功打出一张力量牌
* Gain your first glory point / 第一次获得荣耀点

### Battle Moments / 战斗成就

* Land a successful attack / 攻击命中一次
* Roll a critical success / 掷出一个暴击
* Take down an enemy fighter / 击倒一名敌方战士
* Keep your leader alive until the end of the game / 你的首领存活到该局结束

### Objective Play / 目标成就

* Score 1 objective card / 完成 1 张目标卡
* Gain 3 or more glory in one game / 单局内获得 3 点或以上荣耀
* Hold an objective token until the end of a round / 占据一个目标标记直到回合结束
* Score 2 objective cards in the same game / 在同一局中完成 2 张目标卡

### Glory Moments / 高光时刻

* Come back after falling behind / 落后后追回比分
* Help another player understand a rule / 帮助对手理解一个规则或流程
* Create a moment that makes the table react / 完成一次让全桌惊呼的精彩行动
* Make one player say: “I want to come again next time” / 让其中一位玩家说：‘下次还想再来！’

## Levels

Use score to determine title:

* 0–4: Arena Initiate / 初入竞技场
* 5–8: Rising Challenger / 崭露锋芒
* 9–12: Glory Hunter / 荣耀追猎者
* 13–16: Event Legend / 活动传奇

Store level logic in:

`src/utils/levels.ts`

## UI Direction

The app must not look like a generic admin dashboard.

It should look like a dark fantasy event companion.

Use original dark fantasy atmosphere:

* dark stone
* parchment panels
* warm gold
* ember glow
* dice
* blades
* shields
* relics
* subtle runes
* arena vibe

Do not use official Warhammer logos, Games Workshop assets, copyrighted artwork, or copied game UI.

The UI must be:

* mobile-first
* screenshot-friendly
* readable
* polished
* suitable for WhatsApp, Reddit, Xiaohongshu, and store promotion

Colour direction:

* background: dark charcoal
* panels: dark stone / parchment
* accent: warm gold / ember
* text: off-white
* secondary text: muted grey
* completed state: glowing gold

## Required Files / Structure

```txt
src/
  components/
    AchievementCard.tsx
    SectionPanel.tsx
    PlayerHeader.tsx
    RankingCard.tsx
    BottomNav.tsx
    LanguageToggle.tsx
    HostPlayerRow.tsx

  data/
    achievements.ts

  i18n/
    translations.ts
    useLanguage.ts

  utils/
    levels.ts
    storage.ts
    supabase.ts

  pages/
    EventJoinPage.tsx
    ChecklistPage.tsx
    RankingPage.tsx
    ResultCardPage.tsx
    HostPage.tsx
```

## Supabase

Create:

`src/utils/supabase.ts`

Use environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Add `.env.example`.

Do not commit real Supabase keys.

## PWA

The app should be installable.

Requirements:

* manifest
* app name: Achievement
* original icon only
* offline shell is okay
* data requires internet when syncing to Supabase

## README

README must explain:

1. How to run:

```bash
npm install
npm run dev
npm run build
```

2. How to set Supabase environment variables

3. How to create tables

4. How to create a new weekly event

5. Where to edit the checklist:

* `src/data/achievements.ts`
* `src/i18n/translations.ts`

6. How to share event link in WhatsApp

## Do Not Build Yet

Do not build:

* full login system
* store voucher league ranking
* match result submission
* opponent confirmation
* payment
* complex admin panel
* tournament pairing
* user profile system
* email system

These can come later.
