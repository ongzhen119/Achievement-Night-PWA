// Turns raw playmat events into i18n-ready log lines.
// The UI translates `key` with useLanguage().t and formats with formatText.

import { getCatalogCard } from "../../data/playmat/catalog";
import { getFighter } from "../../data/playmat/warbands";
import { PlaymatEventRecord, PlaymatPlayerRecord } from "./types";

export interface PlaymatLogLine {
  id: number;
  key: string;
  values: Record<string, string | number>;
  createdAt: string;
}

function payloadString(payload: Record<string, unknown>, field: string) {
  const value = payload[field];
  return typeof value === "string" ? value : "";
}

function payloadNumber(payload: Record<string, unknown>, field: string, fallback: number) {
  const value = payload[field];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function describePlaymatEvent(
  event: PlaymatEventRecord,
  players: PlaymatPlayerRecord[]
): PlaymatLogLine | null {
  const player = players.find((candidate) => candidate.id === event.player_id);
  const playerName = player?.name ?? "?";
  const warbandId = player?.warband_id ?? null;
  const payload = event.payload ?? {};

  const cardName = (field: string) => {
    const uid = payloadString(payload, field);
    return getCatalogCard(uid)?.name ?? uid;
  };

  const fighterName = () => {
    const fighterId = payloadString(payload, "fighterId");
    return getFighter(warbandId, fighterId)?.name ?? fighterId;
  };

  const base = { player: playerName };

  const line = (key: string, values: Record<string, string | number> = {}) => ({
    id: event.id,
    key,
    values: { ...base, ...values },
    createdAt: event.created_at
  });

  switch (event.type) {
    case "SETUP_PLAYER":
      return line("playmat.log.setup");
    case "DRAW_CARD": {
      const count = payloadNumber(payload, "count", 1);
      return payload.deck === "objective"
        ? line("playmat.log.drawObjective", { count })
        : line("playmat.log.drawPower", { count });
    }
    case "PLAY_CARD":
      return line("playmat.log.playCard", { card: cardName("cardId") });
    case "DISCARD_CARD":
      return line("playmat.log.discardCard", { card: cardName("cardId") });
    case "MOVE_CARD":
      return line("playmat.log.moveCard", { card: cardName("cardId") });
    case "SHUFFLE_DECK":
      return payload.deck === "objective"
        ? line("playmat.log.shuffleObjective")
        : line("playmat.log.shufflePower");
    case "GAIN_GLORY":
      return line("playmat.log.gainGlory", { amount: payloadNumber(payload, "amount", 1) });
    case "SPEND_GLORY":
      return line("playmat.log.spendGlory", { amount: payloadNumber(payload, "amount", 1) });
    case "SCORE_OBJECTIVE":
      return line("playmat.log.scoreObjective", { card: cardName("cardId") });
    case "DISCARD_OBJECTIVE":
      return line("playmat.log.discardObjective", { card: cardName("cardId") });
    case "ASSIGN_UPGRADE":
      return line("playmat.log.assignUpgrade", {
        card: cardName("cardId"),
        fighter: fighterName()
      });
    case "REMOVE_UPGRADE":
      return line("playmat.log.removeUpgrade", {
        card: cardName("cardId"),
        fighter: fighterName()
      });
    case "ADJUST_WOUNDS": {
      const amount = payloadNumber(payload, "amount", 0);
      return amount >= 0
        ? line("playmat.log.woundAdded", { fighter: fighterName(), amount })
        : line("playmat.log.woundHealed", { fighter: fighterName(), amount: Math.abs(amount) });
    }
    case "TOGGLE_INSPIRED":
      return line("playmat.log.toggleInspired", { fighter: fighterName() });
    case "SET_FIGHTER_OUT":
      return payload.out === true
        ? line("playmat.log.fighterOut", { fighter: fighterName() })
        : line("playmat.log.fighterBack", { fighter: fighterName() });
    case "END_PHASE":
      return line("playmat.log.endPhase");
    case "END_GAME":
      return line("playmat.log.endGame");
    default:
      return null;
  }
}
