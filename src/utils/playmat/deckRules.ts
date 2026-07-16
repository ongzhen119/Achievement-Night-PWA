// Nemesis deck-building rules and deck-code import/export.
//
// Nemesis format (from the tournament rules):
//   * Choose exactly 2 DIFFERENT Rivals decks.
//   * Objective deck: 12 or more objective cards from those decks.
//       - at most 6 Surge objectives.
//   * Power deck: 20 or more power cards (gambits + upgrades) from those decks.
//       - up to half of the power cards may be Ploys.
//   * Every card in each deck must have a UNIQUE NAME (no duplicates).
//
// These are the only "rules" enforced — the playmat itself is not a rules engine.

import {
  CatalogCard,
  catalogCards,
  getCatalogCard
} from "../../data/playmat/catalog";

export const NEMESIS_SOURCE_DECKS = 2;
export const NEMESIS_MIN_OBJECTIVES = 12;
export const NEMESIS_MAX_SURGE = 6;
export const NEMESIS_MIN_POWER = 20;

export interface CustomDeckDraft {
  name: string;
  sourceDeckIds: string[];
  objectiveUids: string[];
  powerUids: string[];
}

export interface DeckValidation {
  legal: boolean;
  /** i18n keys describing each failing rule. */
  errorKeys: string[];
  objectiveCount: number;
  surgeCount: number;
  powerCount: number;
  ployCount: number;
  maxPloys: number;
}

function uniqueByName(cards: CatalogCard[]) {
  const names = new Set<string>();
  const duplicates: string[] = [];
  for (const card of cards) {
    const key = card.name.trim().toLowerCase();
    if (names.has(key)) {
      duplicates.push(card.name);
    } else {
      names.add(key);
    }
  }

  return duplicates;
}

export function resolveCards(uids: string[]): CatalogCard[] {
  return uids
    .map((uid) => getCatalogCard(uid))
    .filter((card): card is CatalogCard => card !== null);
}

export function validateNemesisDeck(draft: CustomDeckDraft): DeckValidation {
  const objectives = resolveCards(draft.objectiveUids);
  const power = resolveCards(draft.powerUids);
  const surgeCount = objectives.filter((card) => card.surge).length;
  const ployCount = power.filter((card) => card.ploy).length;
  const maxPloys = Math.floor(power.length / 2);
  const errorKeys: string[] = [];

  // Exactly two different source decks.
  const sources = new Set(draft.sourceDeckIds);
  if (sources.size !== NEMESIS_SOURCE_DECKS) {
    errorKeys.push("playmat.deckError.sources");
  }

  // Every chosen card must belong to one of the chosen source decks.
  const fromChosenSources = [...objectives, ...power].every((card) =>
    sources.has(card.deckId)
  );
  if (!fromChosenSources) {
    errorKeys.push("playmat.deckError.foreignCards");
  }

  // Objective rules.
  if (objectives.length < NEMESIS_MIN_OBJECTIVES) {
    errorKeys.push("playmat.deckError.minObjectives");
  }
  if (surgeCount > NEMESIS_MAX_SURGE) {
    errorKeys.push("playmat.deckError.maxSurge");
  }

  // Power rules.
  if (power.length < NEMESIS_MIN_POWER) {
    errorKeys.push("playmat.deckError.minPower");
  }
  if (ployCount > maxPloys) {
    errorKeys.push("playmat.deckError.maxPloys");
  }

  // Unique names within each deck.
  if (uniqueByName(objectives).length > 0 || uniqueByName(power).length > 0) {
    errorKeys.push("playmat.deckError.duplicates");
  }

  return {
    legal: errorKeys.length === 0,
    errorKeys,
    objectiveCount: objectives.length,
    surgeCount,
    powerCount: power.length,
    ployCount,
    maxPloys
  };
}

/** Cards available for a Nemesis build given the chosen source decks. */
export function poolForSources(sourceDeckIds: string[]): CatalogCard[] {
  const sources = new Set(sourceDeckIds);
  return catalogCards.filter((card) => sources.has(card.deckId));
}

// ---------------------------------------------------------------------------
// Deck codes (import / export) — future-ready, human-shareable.
// Format: base64url of JSON { v, n, s, o, p }.
// ---------------------------------------------------------------------------

interface DeckCodePayload {
  v: 1;
  n: string;
  s: string[];
  o: string[];
  p: string[];
}

function toBase64Url(text: string) {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string) {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

export function exportDeckCode(draft: CustomDeckDraft): string {
  const payload: DeckCodePayload = {
    v: 1,
    n: draft.name,
    s: draft.sourceDeckIds,
    o: draft.objectiveUids,
    p: draft.powerUids
  };

  return toBase64Url(JSON.stringify(payload));
}

export function importDeckCode(code: string): CustomDeckDraft | null {
  try {
    const parsed = JSON.parse(fromBase64Url(code.trim())) as DeckCodePayload;
    if (parsed.v !== 1 || !Array.isArray(parsed.o) || !Array.isArray(parsed.p)) {
      return null;
    }

    return {
      name: typeof parsed.n === "string" ? parsed.n : "Imported deck",
      sourceDeckIds: Array.isArray(parsed.s) ? parsed.s : [],
      objectiveUids: parsed.o.filter((uid) => typeof uid === "string"),
      powerUids: parsed.p.filter((uid) => typeof uid === "string")
    };
  } catch {
    return null;
  }
}
