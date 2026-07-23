// Pure event-sourcing engine for the digital playmat.
//
// The append-only `playmat_events` table is the source of truth. Every client
// replays the ordered event list through `applyPlaymatEvent` to rebuild the
// same game state. Handlers are defensive: an event that no longer makes
// sense (duplicate, stale, malformed) is ignored instead of corrupting state,
// so simultaneous actions from two devices can never desync a room.

import { getCatalogCard } from "../../data/playmat/catalog";
import { getWarband } from "../../data/playmat/warbands";
import {
  createInitialGameState,
  PlaymatCardZone,
  PlaymatDeckKind,
  PlaymatEventRecord,
  PlaymatGameState,
  PlaymatPlayerState
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.every((item) => typeof item === "string") ? (value as string[]) : null;
}

function sameCardSet(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  const counts = new Map<string, number>();
  for (const card of a) {
    counts.set(card, (counts.get(card) ?? 0) + 1);
  }

  for (const card of b) {
    const remaining = counts.get(card);
    if (!remaining) {
      return false;
    }
    counts.set(card, remaining - 1);
  }

  return true;
}

function removeCard(zone: string[], cardId: string) {
  const index = zone.indexOf(cardId);
  if (index === -1) {
    return false;
  }

  zone.splice(index, 1);
  return true;
}

const CARD_ZONES: PlaymatCardZone[] = [
  "powerDeck",
  "hand",
  "played",
  "discard",
  "objectiveDeck",
  "objectiveHand",
  "scored",
  "objectiveDiscard"
];

function isCardZone(value: unknown): value is PlaymatCardZone {
  return typeof value === "string" && (CARD_ZONES as string[]).includes(value);
}

function getPlayerState(state: PlaymatGameState, playerId: string | null) {
  if (!playerId) {
    return null;
  }

  return state.players[playerId] ?? null;
}

export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }

  return shuffled;
}

// ---------------------------------------------------------------------------
// Event application
// ---------------------------------------------------------------------------

/**
 * Applies one event to the state (mutating it). Returns true when the event
 * changed the state. Callers that need immutability clone before applying.
 */
export function applyPlaymatEvent(
  state: PlaymatGameState,
  event: PlaymatEventRecord
): boolean {
  if (event.id <= state.lastEventId) {
    return false;
  }

  state.lastEventId = event.id;
  const payload = event.payload ?? {};
  const player = getPlayerState(state, event.player_id);

  switch (event.type) {
    case "SETUP_PLAYER": {
      if (!event.player_id || state.players[event.player_id]?.initialized) {
        return false;
      }

      const deckId = asString(payload.deckId);
      const warbandId = asString(payload.warbandId);
      const power = asStringArray(payload.power);
      const objectives = asStringArray(payload.objectives);
      const warband = getWarband(warbandId);
      if (!deckId || !warbandId || !warband || !power || !objectives) {
        return false;
      }

      const powerHand = Math.max(0, asNumber(payload.powerHand, 0));
      const objectiveHand = Math.max(0, asNumber(payload.objectiveHand, 0));

      const playerState: PlaymatPlayerState = {
        playerId: event.player_id,
        warbandId,
        deckId,
        initialized: true,
        hand: power.slice(0, powerHand),
        powerDeck: power.slice(powerHand),
        played: [],
        discard: [],
        objectiveHand: objectives.slice(0, objectiveHand),
        objectiveDeck: objectives.slice(objectiveHand),
        scored: [],
        objectiveDiscard: [],
        gloryEarned: 0,
        glorySpent: 0,
        fighters: {}
      };

      for (const fighter of warband.fighters) {
        playerState.fighters[fighter.id] = {
          fighterId: fighter.id,
          damage: 0,
          inspired: false,
          out: false,
          upgrades: []
        };
      }

      state.players[event.player_id] = playerState;
      return true;
    }

    case "DRAW_CARD": {
      if (!player) {
        return false;
      }

      const deckKind = payload.deck === "objective" ? "objective" : "power";
      const count = Math.max(1, Math.min(12, asNumber(payload.count, 1)));
      const source = deckKind === "objective" ? player.objectiveDeck : player.powerDeck;
      const target = deckKind === "objective" ? player.objectiveHand : player.hand;
      const drawn = source.splice(0, count);
      if (!drawn.length) {
        return false;
      }

      target.push(...drawn);
      return true;
    }

    case "PLAY_CARD": {
      const cardId = asString(payload.cardId);
      if (!player || !cardId || !removeCard(player.hand, cardId)) {
        return false;
      }

      player.played.push(cardId);
      return true;
    }

    case "DISCARD_CARD": {
      const cardId = asString(payload.cardId);
      if (!player || !cardId) {
        return false;
      }

      if (removeCard(player.hand, cardId) || removeCard(player.played, cardId)) {
        player.discard.push(cardId);
        return true;
      }

      return false;
    }

    case "MOVE_CARD": {
      const cardId = asString(payload.cardId);
      if (!player || !cardId || !isCardZone(payload.from) || !isCardZone(payload.to)) {
        return false;
      }

      const from = player[payload.from];
      const to = player[payload.to];
      if (payload.from === payload.to) {
        // Reorder within a zone.
        if (!removeCard(from, cardId)) {
          return false;
        }

        const position = Math.max(0, Math.min(to.length, asNumber(payload.position, to.length)));
        to.splice(position, 0, cardId);
        return true;
      }

      if (!removeCard(from, cardId)) {
        return false;
      }

      const isDeck = payload.to === "powerDeck" || payload.to === "objectiveDeck";
      const fallback = isDeck ? 0 : to.length;
      const rawPosition = asNumber(payload.position, fallback);
      const position = rawPosition === -1 ? to.length : Math.max(0, Math.min(to.length, rawPosition));
      to.splice(position, 0, cardId);
      return true;
    }

    case "SHUFFLE_DECK": {
      const order = asStringArray(payload.order);
      if (!player || !order) {
        return false;
      }

      const deckKind: PlaymatDeckKind = payload.deck === "objective" ? "objective" : "power";
      const includeDiscard = payload.includeDiscard === true;
      const deckZone = deckKind === "objective" ? player.objectiveDeck : player.powerDeck;
      const discardZone = deckKind === "objective" ? player.objectiveDiscard : player.discard;
      const pool = includeDiscard ? [...deckZone, ...discardZone] : deckZone;

      if (!sameCardSet(pool, order)) {
        return false;
      }

      if (deckKind === "objective") {
        player.objectiveDeck = [...order];
        if (includeDiscard) {
          player.objectiveDiscard = [];
        }
      } else {
        player.powerDeck = [...order];
        if (includeDiscard) {
          player.discard = [];
        }
      }

      return true;
    }

    case "GAIN_GLORY": {
      if (!player) {
        return false;
      }

      player.gloryEarned += Math.max(1, asNumber(payload.amount, 1));
      return true;
    }

    case "SPEND_GLORY": {
      if (!player) {
        return false;
      }

      const amount = Math.max(1, asNumber(payload.amount, 1));
      if (player.glorySpent + amount > player.gloryEarned) {
        return false;
      }

      player.glorySpent += amount;
      return true;
    }

    // Corrects a misclicked +/- (gloryEarned only ever increases otherwise).
    // A direct "set to N" is simplest and safest under event sourcing — no
    // ordering assumptions about which past event to "undo".
    case "SET_GLORY": {
      if (!player) {
        return false;
      }

      const value = Math.max(0, Math.round(asNumber(payload.value, player.gloryEarned)));
      player.gloryEarned = value;
      if (player.glorySpent > value) {
        player.glorySpent = value;
      }
      return true;
    }

    case "SCORE_OBJECTIVE": {
      const cardId = asString(payload.cardId);
      if (!player || !cardId) {
        return false;
      }

      if (!removeCard(player.objectiveHand, cardId) && !removeCard(player.objectiveDeck, cardId)) {
        return false;
      }

      player.scored.push(cardId);
      const glory = getCatalogCard(cardId)?.glory ?? 1;
      player.gloryEarned += Math.max(0, glory);
      return true;
    }

    case "DISCARD_OBJECTIVE": {
      const cardId = asString(payload.cardId);
      if (!player || !cardId || !removeCard(player.objectiveHand, cardId)) {
        return false;
      }

      player.objectiveDiscard.push(cardId);
      return true;
    }

    case "ASSIGN_UPGRADE": {
      const cardId = asString(payload.cardId);
      const fighterId = asString(payload.fighterId);
      if (!player || !cardId || !fighterId) {
        return false;
      }

      const fighter = player.fighters[fighterId];
      const card = getCatalogCard(cardId);
      if (!fighter || card?.type !== "upgrade") {
        return false;
      }

      if (
        !removeCard(player.hand, cardId) &&
        !removeCard(player.played, cardId) &&
        !removeCard(player.discard, cardId)
      ) {
        return false;
      }

      fighter.upgrades.push(cardId);
      return true;
    }

    case "REMOVE_UPGRADE": {
      const cardId = asString(payload.cardId);
      const fighterId = asString(payload.fighterId);
      if (!player || !cardId || !fighterId) {
        return false;
      }

      const fighter = player.fighters[fighterId];
      if (!fighter || !removeCard(fighter.upgrades, cardId)) {
        return false;
      }

      player.discard.push(cardId);
      return true;
    }

    case "ADJUST_WOUNDS": {
      const fighterId = asString(payload.fighterId);
      const fighter = fighterId ? player?.fighters[fighterId] : null;
      if (!player || !fighter) {
        return false;
      }

      const amount = asNumber(payload.amount, 0);
      if (!amount) {
        return false;
      }

      fighter.damage = Math.max(0, fighter.damage + amount);
      return true;
    }

    case "TOGGLE_INSPIRED": {
      const fighterId = asString(payload.fighterId);
      const fighter = fighterId ? player?.fighters[fighterId] : null;
      if (!fighter) {
        return false;
      }

      fighter.inspired = !fighter.inspired;
      return true;
    }

    case "SET_FIGHTER_OUT": {
      const fighterId = asString(payload.fighterId);
      const fighter = fighterId ? player?.fighters[fighterId] : null;
      if (!fighter) {
        return false;
      }

      fighter.out = payload.out === true;
      return true;
    }

    case "END_PHASE": {
      if (state.finished) {
        return false;
      }

      if (state.phase === "action") {
        state.phase = "end";
      } else {
        state.phase = "action";
        state.round += 1;
      }

      return true;
    }

    case "END_GAME": {
      state.finished = true;
      return true;
    }

    default:
      // Unknown event types are ignored so old clients survive new features.
      return false;
  }
}

export function clonePlaymatState(state: PlaymatGameState): PlaymatGameState {
  return structuredClone(state);
}

export function buildPlaymatState(events: PlaymatEventRecord[]): PlaymatGameState {
  const state = createInitialGameState();
  const ordered = [...events].sort((a, b) => a.id - b.id);
  for (const event of ordered) {
    applyPlaymatEvent(state, event);
  }

  return state;
}
