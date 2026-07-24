// Push notifications for opponent actions. Big "reveal" toasts (card/fighter
// art + caption) for dramatic moments, coalesced ticker pills for small ones,
// plus a short audio ping. Only fresh events from OTHER players trigger
// anything — history replayed on load/reconnect stays silent.

import { useEffect, useRef, useState } from "react";
import { CatalogCard, getCatalogCard } from "../../data/playmat/catalog";
import { getFighter, PlaymatFighterDef } from "../../data/playmat/warbands";
import { useLanguage } from "../../i18n/useLanguage";
import { formatText } from "../../utils/format";
import { describePlaymatEvent } from "../../utils/playmat/eventLog";
import {
  PlaymatCardZone,
  PlaymatEventRecord,
  PlaymatFighterState,
  PlaymatGameState,
  PlaymatPlayerRecord
} from "../../utils/playmat/types";
import CardTile from "./CardTile";
import FighterTile from "./FighterTile";

/** Events older than this never ping — they are reconnect catch-up, not news. */
const FRESH_MS = 20000;
const REVEAL_HOLD_MS = 3200;
/** Shorter hold while more reveals are queued behind the visible one. */
const REVEAL_HOLD_FAST_MS = 1800;
const PILL_HOLD_MS = 3600;
const MAX_PILLS = 3;

// ---------------------------------------------------------------------------
// Sound — tiny synthesized chimes via Web Audio, no asset files.
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function chime(notes: Array<[number, number]>, type: OscillatorType = "sine", peak = 0.22) {
  try {
    audioCtx = audioCtx ?? new AudioContext();
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    const start = audioCtx.currentTime;
    for (const [frequency, at] of notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + at);
      gain.gain.exponentialRampToValueAtTime(peak, start + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.5);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start + at);
      osc.stop(start + at + 0.55);
    }
  } catch {
    // Audio blocked (no user gesture yet) or unavailable — stay silent.
  }
}

const playRevealSound = () => chime([[660, 0], [988, 0.1]]);
const playDownSound = () => chime([[196, 0], [98, 0.06]], "triangle");
/** "Ka-ching" — coin chirp for the player's OWN glory taps (instant feedback,
 *  played at the tap site rather than from the synced event stream). */
export const playGlorySound = () => chime([[988, 0], [1319, 0.08]], "square", 0.08);

// ---------------------------------------------------------------------------

interface Reveal {
  id: number;
  captionKey: string;
  values: Record<string, string | number>;
  tone: "gold" | "danger";
  card: CatalogCard | null;
  /** Glory badge on scored objectives. */
  glory: number;
  fighter: {
    warbandId: string;
    def: PlaymatFighterDef;
    state: PlaymatFighterState;
  } | null;
  onTap: (() => void) | null;
}

interface Pill {
  coalesceKey: string;
  id: number;
  logKey: string;
  values: Record<string, string | number>;
  expiresAt: number;
}

interface EventPingProps {
  events: PlaymatEventRecord[];
  players: PlaymatPlayerRecord[];
  gameState: PlaymatGameState;
  myPlayerId: string;
  soundOn: boolean;
  onCardPress: (ownerId: string, zone: PlaymatCardZone, cardId: string) => void;
  onFighterPress: (ownerId: string, fighterId: string) => void;
}

const REVEAL_ZONES: Partial<Record<string, PlaymatCardZone>> = {
  PLAY_CARD: "played",
  SCORE_OBJECTIVE: "scored",
  ASSIGN_UPGRADE: "played"
};

const TICKER_TYPES = new Set([
  "GAIN_GLORY",
  "SPEND_GLORY",
  "DRAW_CARD",
  "DISCARD_CARD",
  "DISCARD_OBJECTIVE",
  "REMOVE_UPGRADE",
  "ADJUST_WOUNDS",
  "TOGGLE_INSPIRED"
]);

/** Sum numeric burst fields (three "+1 glory" pills become one "+3"). */
function mergePillValues(
  previous: Record<string, string | number>,
  next: Record<string, string | number>
) {
  const merged = { ...next };
  for (const field of ["amount", "count"]) {
    const a = previous[field];
    const b = next[field];
    if (typeof a === "number" && typeof b === "number") {
      merged[field] = a + b;
    }
  }
  return merged;
}

export default function EventPing({
  events,
  players,
  gameState,
  myPlayerId,
  soundOn,
  onCardPress,
  onFighterPress
}: EventPingProps) {
  const { t } = useLanguage();
  const seenIdRef = useRef<number | null>(null);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [pills, setPills] = useState<Pill[]>([]);

  // Route fresh opponent events into reveals / pills.
  useEffect(() => {
    const maxId = events.length ? events[events.length - 1].id : 0;
    if (seenIdRef.current === null) {
      // First render already holds full history — mark it seen, ping nothing.
      seenIdRef.current = maxId;
      return;
    }

    if (maxId <= seenIdRef.current) {
      return;
    }

    const fresh = events.filter((event) => event.id > (seenIdRef.current ?? 0));
    seenIdRef.current = maxId;

    const now = Date.now();
    const newReveals: Reveal[] = [];
    const newPills: PlaymatEventRecord[] = [];

    for (const event of fresh) {
      if (!event.player_id || event.player_id === myPlayerId) {
        continue;
      }
      if (now - new Date(event.created_at).getTime() > FRESH_MS) {
        continue;
      }

      const isFighterOut = event.type === "SET_FIGHTER_OUT" && event.payload?.out === true;
      const isReveal =
        event.type in REVEAL_ZONES || event.type === "END_PHASE" || isFighterOut;

      if (isReveal) {
        const line = describePlaymatEvent(event, players);
        if (!line) {
          continue;
        }

        const playerId = event.player_id;
        const cardId =
          typeof event.payload?.cardId === "string" ? event.payload.cardId : "";
        const card = event.type === "END_PHASE" || isFighterOut ? null : getCatalogCard(cardId);
        const zone = REVEAL_ZONES[event.type];

        let fighter: Reveal["fighter"] = null;
        if (isFighterOut) {
          const owner = players.find((candidate) => candidate.id === playerId);
          const fighterId =
            typeof event.payload?.fighterId === "string" ? event.payload.fighterId : "";
          const def = getFighter(owner?.warband_id ?? null, fighterId);
          const state = gameState.players[playerId]?.fighters[fighterId];
          if (def && state && owner?.warband_id) {
            fighter = { warbandId: owner.warband_id, def, state };
          }
        }

        newReveals.push({
          id: event.id,
          captionKey: line.key,
          values: line.values,
          tone: isFighterOut ? "danger" : "gold",
          card,
          glory: event.type === "SCORE_OBJECTIVE" ? card?.glory ?? 0 : 0,
          fighter,
          onTap: card && zone
            ? () => onCardPress(playerId, zone, card.uid)
            : fighter
              ? () => onFighterPress(playerId, fighter.def.id)
              : null
        });
      } else if (
        TICKER_TYPES.has(event.type) ||
        (event.type === "SET_FIGHTER_OUT" && event.payload?.out !== true)
      ) {
        newPills.push(event);
      }
    }

    if (newReveals.length) {
      setReveals((queue) => [...queue, ...newReveals]);
      if (soundOn) {
        (newReveals.some((reveal) => reveal.tone === "danger")
          ? playDownSound
          : playRevealSound)();
        navigator.vibrate?.(40);
      }
    }

    if (newPills.length) {
      setPills((previous) => {
        let next = [...previous];
        const expiresAt = Date.now() + PILL_HOLD_MS;
        for (const event of newPills) {
          const line = describePlaymatEvent(event, players);
          if (!line) {
            continue;
          }

          const fighterId =
            typeof event.payload?.fighterId === "string" ? event.payload.fighterId : "";
          const coalesceKey = `${event.type}|${event.player_id}|${fighterId}|${line.key}`;
          const existing = next.find((pill) => pill.coalesceKey === coalesceKey);
          if (existing) {
            next = next.map((pill) =>
              pill === existing
                ? {
                    ...pill,
                    id: event.id,
                    values: mergePillValues(pill.values, line.values),
                    expiresAt
                  }
                : pill
            );
          } else {
            next.push({ coalesceKey, id: event.id, logKey: line.key, values: line.values, expiresAt });
          }
        }
        return next.slice(-MAX_PILLS);
      });
    }
  }, [events, players, gameState, myPlayerId, soundOn, onCardPress, onFighterPress]);

  // Advance the reveal queue.
  useEffect(() => {
    if (!reveals.length) {
      return;
    }

    const hold = reveals.length > 1 ? REVEAL_HOLD_FAST_MS : REVEAL_HOLD_MS;
    const timer = window.setTimeout(() => setReveals((queue) => queue.slice(1)), hold);
    return () => window.clearTimeout(timer);
  }, [reveals]);

  // Expire ticker pills.
  useEffect(() => {
    if (!pills.length) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      setPills((previous) => previous.filter((pill) => pill.expiresAt > now));
    }, 500);
    return () => window.clearInterval(timer);
  }, [pills.length]);

  const head = reveals[0] ?? null;
  const dismissHead = () => setReveals((queue) => queue.slice(1));

  return (
    <>
      {pills.length ? (
        <div aria-live="polite" className="ping-ticker">
          {pills.map((pill) => (
            <div className="ping-pill" key={pill.id}>
              {formatText(t(pill.logKey), pill.values)}
            </div>
          ))}
        </div>
      ) : null}

      {head ? (
        <div className="ping-reveal-layer" key={head.id} onClick={dismissHead} role="status">
          <div className={`ping-reveal tone-${head.tone}`}>
            <p className="ping-caption">{formatText(t(head.captionKey), head.values)}</p>

            {head.card ? (
              <button
                className="ping-card"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  head.onTap?.();
                  dismissHead();
                }}
                type="button"
              >
                <CardTile card={head.card} size="lg" />
                {head.glory > 0 ? <span className="ping-glory">+{head.glory}</span> : null}
              </button>
            ) : null}

            {head.fighter ? (
              <div
                className="ping-fighter"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
              >
                <FighterTile
                  fighter={head.fighter.def}
                  onPress={() => {
                    head.onTap?.();
                    dismissHead();
                  }}
                  state={head.fighter.state}
                  warbandId={head.fighter.warbandId}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
