// ============================================================================
// DEPRECATED — this file has been split for the warband/deck redesign.
// ============================================================================
// Warband (fighters) and deck (cards) are now independent:
//   * Fighters / warbands →  ./warbands.ts
//   * The four Rivals decks (card lists) →  ./rivalsDecks.ts
//   * The combined card pool + uid lookups →  ./catalog.ts
//   * Nemesis deck-building rules →  ../../utils/playmat/deckRules.ts
//
// Kept only as a re-export so older imports keep resolving. Prefer importing
// from the modules above directly.
// ============================================================================

export type {
  PlaymatCardType,
  PlaymatCardDef,
  PlaymatRivalsDeckDef
} from "./rivalsDecks";
export {
  rivalsDecks,
  getRivalsDeck,
  OPENING_POWER_HAND,
  OPENING_OBJECTIVE_HAND,
  STANDARD_ROUNDS
} from "./rivalsDecks";

export type { PlaymatFighterDef, PlaymatWarbandDef } from "./warbands";
export {
  playmatWarbands,
  getWarband,
  getFighter,
  fighterImagePath,
  MIN_FIGHTERS,
  MAX_FIGHTERS
} from "./warbands";

export type { CatalogCard } from "./catalog";
export {
  catalogCards,
  getCatalogCard,
  makeUid,
  deckCardUids,
  cardImagePathByUid,
  cardBackPath
} from "./catalog";
