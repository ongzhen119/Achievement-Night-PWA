// Shared types for the digital playmat: rooms, events, and replayed game state.

export type PlaymatRoomStatus = "lobby" | "active" | "ended";

export interface PlaymatRoomRecord {
  id: string;
  code: string;
  status: PlaymatRoomStatus;
  created_at: string;
}

export type PlaymatFormat = "rivals" | "nemesis";

export interface PlaymatPlayerRecord {
  id: string;
  room_id: string;
  token: string;
  name: string;
  /** Linked community player (nullable for legacy rows). */
  community_player_id: string | null;
  /** Warband providing this seat's fighters. */
  warband_id: string | null;
  /** "rivals" (a fixed deck) or "nemesis" (a custom deck). */
  format: PlaymatFormat | null;
  /** Rivals deck id, or custom deck id when format = nemesis. */
  deck_id: string | null;
  is_host: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Events (event sourcing — the append-only log is the source of truth)
// ---------------------------------------------------------------------------

export type PlaymatEventType =
  | "SETUP_PLAYER"
  | "DRAW_CARD"
  | "PLAY_CARD"
  | "DISCARD_CARD"
  | "MOVE_CARD"
  | "SHUFFLE_DECK"
  | "GAIN_GLORY"
  | "SPEND_GLORY"
  | "SET_GLORY"
  | "SCORE_OBJECTIVE"
  | "DISCARD_OBJECTIVE"
  | "ASSIGN_UPGRADE"
  | "REMOVE_UPGRADE"
  | "ADJUST_WOUNDS"
  | "TOGGLE_INSPIRED"
  | "SET_FIGHTER_OUT"
  | "END_PHASE"
  | "END_GAME";

export interface PlaymatEventRecord {
  id: number;
  room_id: string;
  player_id: string | null;
  type: PlaymatEventType | string;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Which deck a draw/shuffle refers to. */
export type PlaymatDeckKind = "power" | "objective";

/** Card locations inside one player's area. */
export type PlaymatCardZone =
  | "powerDeck"
  | "hand"
  | "played"
  | "discard"
  | "objectiveDeck"
  | "objectiveHand"
  | "scored"
  | "objectiveDiscard";

// ---------------------------------------------------------------------------
// Replayed game state
// ---------------------------------------------------------------------------

export interface PlaymatFighterState {
  fighterId: string;
  damage: number;
  inspired: boolean;
  out: boolean;
  /** Upgrade card ids attached to this fighter. */
  upgrades: string[];
}

export interface PlaymatPlayerState {
  playerId: string;
  /** Warband providing this player's fighters. */
  warbandId: string;
  /** Deck label id (a Rivals deck id or a custom deck id) — for display/record. */
  deckId: string;
  initialized: boolean;
  /** index 0 = top of the pile for the two decks. */
  powerDeck: string[];
  hand: string[];
  played: string[];
  discard: string[];
  objectiveDeck: string[];
  objectiveHand: string[];
  scored: string[];
  objectiveDiscard: string[];
  gloryEarned: number;
  glorySpent: number;
  fighters: Record<string, PlaymatFighterState>;
}

export type PlaymatPhase = "action" | "end";

export interface PlaymatGameState {
  round: number;
  phase: PlaymatPhase;
  finished: boolean;
  players: Record<string, PlaymatPlayerState>;
  /** Highest applied event id, used for realtime catch-up. */
  lastEventId: number;
}

export function createInitialGameState(): PlaymatGameState {
  return {
    round: 1,
    phase: "action",
    finished: false,
    players: {},
    lastEventId: 0
  };
}
