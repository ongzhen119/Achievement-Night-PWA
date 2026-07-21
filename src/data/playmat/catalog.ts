// ============================================================================
// CARD CATALOG — the combined pool of every card across the four Rivals decks.
// ============================================================================
// Each card gets a GLOBAL uid of "<deckId>:<cardId>" so the same card name can
// appear in two different decks without clashing. The engine, event log, and UI
// all resolve cards through this catalog by uid, so a deck (fixed or custom)
// is simply a list of uids.

import {
  PlaymatCardDef,
  PlaymatCardType,
  rivalsDecks
} from "./rivalsDecks";

export interface CatalogCard {
  /** Global id: "<deckId>:<cardId>". */
  uid: string;
  /** Source Rivals deck id (used for image path + Nemesis source-deck rule). */
  deckId: string;
  deckName: string;
  /** Local id within the deck (image filename base). */
  cardId: string;
  name: string;
  type: PlaymatCardType;
  glory: number;
  surge: boolean;
  ploy: boolean;
  /** Card rules text (shown in the zoom view). */
  rule?: string;
  image?: string;
}

export function makeUid(deckId: string, cardId: string) {
  return `${deckId}:${cardId}`;
}

function toCatalogCard(
  deckId: string,
  deckName: string,
  card: PlaymatCardDef
): CatalogCard {
  return {
    uid: makeUid(deckId, card.id),
    deckId,
    deckName,
    cardId: card.id,
    name: card.name,
    type: card.type,
    glory: card.glory ?? (card.type === "objective" ? 1 : 0),
    surge: card.surge ?? false,
    ploy: card.ploy ?? false,
    rule: card.rule,
    image: card.image
  };
}

// Flattened pool + fast lookup map, built once at module load.
export const catalogCards: CatalogCard[] = rivalsDecks.flatMap((deck) =>
  deck.cards.map((card) => toCatalogCard(deck.id, deck.name, card))
);

const catalogByUid = new Map(catalogCards.map((card) => [card.uid, card]));

export function getCatalogCard(uid: string | null | undefined): CatalogCard | null {
  if (!uid) {
    return null;
  }

  return catalogByUid.get(uid) ?? null;
}

/** All uids belonging to a Rivals deck, in printed order (used by Rivals format). */
export function deckCardUids(deckId: string): string[] {
  return catalogCards.filter((card) => card.deckId === deckId).map((card) => card.uid);
}

export function cardImagePathByUid(uid: string): string | null {
  const card = getCatalogCard(uid);
  if (!card) {
    return null;
  }

  if (card.image) {
    return card.image;
  }

  // Tolerate a card id that already includes an extension.
  const hasExtension = /\.(jpe?g|png|webp)$/i.test(card.cardId);
  return hasExtension
    ? `/cards/${card.deckId}/${card.cardId}`
    : `/cards/${card.deckId}/${card.cardId}.jpg`;
}

export function cardBackPath(type: PlaymatCardType) {
  return type === "objective" ? "/cards/objective-back.jpg" : "/cards/power-back.jpg";
}
