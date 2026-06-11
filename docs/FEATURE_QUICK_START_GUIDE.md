# Feature Spec: Quick Start Guide / Setup Assistant

## Goal

Add a mobile-friendly Quick Start Guide to the Achievement PWA.

The guide should help players set up a full game quickly without flipping through the rulebook during the event.

This is not a replacement for the official rulebook. It is an event helper and setup checklist.

## Important Content Rule

Do not copy official rulebook wording directly.

Use short paraphrased helper text written in simple language.

The guide should be easy to scan, tap, and follow on a phone.

## Navigation

Add a new main navigation item:

* Achievements
* Quick Start Guide

If the app already has Scoreboard or other pages, do not break them.

## UX Requirements

The Quick Start Guide should use numbered setup cards.

Each setup card should include:

* Step number
* Short title
* Short summary
* Checklist items
* Optional expandable details
* Optional reminder or warning notes

The layout must be mobile-friendly:

* large readable text
* tap-friendly checkboxes
* collapsible cards or accordion sections
* clear progress display
* minimal long paragraphs
* good spacing
* suitable for phone use at the table

Add progress display:

Example:

Setup Progress: 3 / 6 steps completed

Add a reset button:

* “Reset Setup Progress”
* Must ask for confirmation before clearing progress

Store progress in localStorage.

## Data / Config Requirement

Create or reuse a clearly named config file:

`src/data/quickStartGuide.ts`

The guide content must be editable from this file.

Use TypeScript types.

Add comments showing where to edit:

* step title
* summary
* checklist items
* details
* reminders
* warning notes

Suggested structure:

```ts
export type QuickStartStep = {
  id: string;
  title: string;
  summary: string;
  checklistItems: string[];
  details?: string[];
  reminders?: string[];
  warningNotes?: string[];
};
```

## Setup Guide Content

### Step 1: Muster Warbands

Summary:

Each player chooses their warband and Rivals deck, then prepares the required components.

Checklist:

* Each player picks 1 warband.
* Each player picks 1 Rivals deck.
* Reveal chosen warbands and decks.
* Place fighters, cards, tokens, boards, and decks within reach.
* Separate the Rivals deck into Objective cards and Power cards.
* Put both decks face down.

Details:

* Objective cards are used for scoring.
* Power cards are used for gambits, upgrades, and other plays during the game.

### Step 2: Draw Starting Hand

Summary:

Each player shuffles both decks separately and draws their starting cards.

Checklist:

* Shuffle Objective deck face down.
* Shuffle Power deck face down.
* Draw 3 Objective cards.
* Draw 5 Power cards.
* Keep hand secret from opponent.
* Decide whether to use the allowed redraw.

Reminder:

* A redraw can help if the starting hand is difficult to use.

### Step 3: Determine Territories

Summary:

Players roll off to decide battlefield side and territory.

Checklist:

* Both players roll off.
* Winner chooses the battlefield side.
* Winner chooses their territory.
* The other territory belongs to the opponent.

Reminder:

* Use the official rulebook for unusual roll-off cases.

### Step 4: Place Treasure Tokens

Summary:

Players place feature tokens face down, then reveal them as treasure tokens after placement.

Checklist:

* The player who did not choose territory shuffles the feature tokens face down.
* That player places the first feature token.
* Players alternate placing feature tokens.
* Place 5 feature tokens total.
* After all 5 are placed, flip them to the numbered side.

Warning notes:

* Do not place on starting hexes.
* Do not place on blocked hexes.
* Do not place on stagger hexes.
* Do not place on edge hexes unless no legal placement is possible.
* Do not place within 2 hexes of another feature token.
* After placement, each player’s territory should contain at least 1 feature token.

UX note:

Show warning notes as compact chips, badges, or short bullets. Do not show them as one long paragraph.

### Step 5: Place Aqua Ghyranis Tokens

Summary:

Each player places 1 Aqua Ghyranis token using the same placement style as treasure tokens.

Checklist:

* The player who placed the last treasure token places 1 Aqua Ghyranis token.
* The other player places 1 Aqua Ghyranis token.
* Follow the same placement restrictions as treasure tokens.

Reminder:

* Keep this section short and easy to check.

### Step 6: Deploy Fighters

Summary:

Players take turns placing fighters into starting hexes in their own territory.

Checklist:

* Start with the player who placed the final feature token.
* Players alternate placing 1 fighter at a time.
* Place fighters only in empty starting hexes in friendly territory.
* If one player runs out of fighters, the other player continues.
* Continue until all fighters are deployed.

Completion message:

When Step 6 is completed, show:

“Setup complete. Start Round 1.”

## Design Direction

The guide should feel like a tabletop event assistant:

* atmospheric but readable
* clean card layout
* not too much animation
* fast to use during a live game
* suitable for screenshot or phone reference

## Constraints

Do not add:

* backend
* login
* database
* Supabase
* Firebase
* complicated rules engine

Do not break:

* existing Achievement Checklist
* existing localStorage data if possible
* existing build process

## Done Criteria

The feature is done when:

* Quick Start Guide page exists
* setup steps are shown as mobile-friendly cards
* checklist progress saves in localStorage
* reset progress works with confirmation
* guide content is editable from `src/data/quickStartGuide.ts`
* existing Achievement Checklist still works
* project builds successfully
