# Warhammer Underworlds Digital Playmat

## Core Features

### 1. Deck Builder

Players can:

* Browse all available cards
* Search and filter cards
* View full card details
* Create multiple decks
* Edit existing decks
* Validate deck legality
* Save decks to their profile
* Duplicate decks
* Delete decks
* Import / Export deck codes (future-ready)

---

### 2. Fighter Upgrades

Players can:

* Assign upgrade cards to a specific fighter
* View which upgrades are attached to each fighter
* Move upgrade cards with their assigned fighter
* Unassign or reassign upgrades during play
* Track fighter-specific enhancements, weapons, and abilities
* Display upgrade status clearly on the playmat

---

### 3. Host / Join Room

Multiplayer should support:

* Create Room (Host)
* Generate a unique room code (e.g. `ABCD`)
* Join Room using room code
* Display connected players
* Show connection status
* Allow host to start the session
* Automatically reconnect if a player refreshes

---

### 4. Shared Digital Playmat

Each player has their own play area.

Player Area:

* Deck
* Hand
* Played Cards
* Discard Pile
* Objective Deck
* Objective Discard
* Glory Counter
* Fighters
* Upgrade Cards attached to specific fighters

Shared Area:

* Current Round
* Current Phase
* Dice Result History
* Event Log

Cards should support:

* Drag & Drop
* Zoom on click
* Tap to read card details
* Move between zones
* Reorder cards in Played zone
* Attach upgrade cards to a specific fighter

---

### 5. Multiplayer Synchronisation

Use **Supabase Realtime**.

Every action should synchronise instantly to every connected player.

Examples:

* Draw Card
* Play Card
* Discard Card
* Shuffle Deck
* Gain Glory
* Spend Glory
* Move Card
* Reveal Objective
* End Phase
* Roll Dice
* Assign Upgrade to Fighter
* Remove Upgrade from Fighter

The UI should update automatically without requiring page refresh.

---

### 6. Event Driven Architecture

Do NOT continuously overwrite the whole game state.

Instead, record actions as events.

Example events:

* DRAW_CARD
* PLAY_CARD
* MOVE_CARD
* DISCARD_CARD
* SHUFFLE_DECK
* GAIN_GLORY
* SPEND_GLORY
* ROLL_DICE
* END_PHASE
* ASSIGN_UPGRADE
* REMOVE_UPGRADE

Realtime clients should consume these events and update their local game state.

This architecture should support future features such as:

* Replay Match
* Undo (optional)
* Spectator Mode
* Match History
* Battle Log
* Analytics

---

### 7. Dice Roller

Support official Warhammer Underworlds dice.

Players can roll:

* Attack Dice
* Defence Dice
* Magic Dice

Display:

* Individual dice faces
* Total roll history
* Timestamp
* Player who rolled

Synchronise results to all players.

---

### 8. Card Help

Every card should have:

* Full card image
* Simplified explanation
* Timing
* FAQ

---

### 9. Responsive Design

Support:

* Desktop
* Tablet
* Mobile (primary)
* Progressive Web App (PWA)

The interface should feel like a tabletop rather than a traditional admin dashboard.

---

## Tech Stack

Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React DnD (or dnd-kit)

Backend

* Supabase
* PostgreSQL
* Supabase Realtime
* Authentication

---

## Design Goals

The application should prioritise:

* Fast gameplay
* Minimal clicks
* Large touch targets
* Smooth drag-and-drop interactions
* Clear card readability
* Low learning curve for new players

Avoid unnecessary animations that slow gameplay.

The experience should feel like using a digital tabletop companion rather than playing a video game.

---

## Future Expansion (Not MVP)

* AI opponent
* Online matchmaking
* Spectator mode
* Replay viewer
* Tournament mode
* Achievement system
* Statistics dashboard
* Community deck sharing
* Deck recommendations
* Offline mode
* Voice chat integration
