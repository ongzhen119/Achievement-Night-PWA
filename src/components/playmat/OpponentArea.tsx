import { Crown, Layers, ScrollText, Trophy } from "lucide-react";
import { getCatalogCard } from "../../data/playmat/catalog";
import { getWarband } from "../../data/playmat/warbands";
import { useLanguage } from "../../i18n/useLanguage";
import {
  PlaymatCardZone,
  PlaymatPlayerRecord,
  PlaymatPlayerState
} from "../../utils/playmat/types";
import CardTile from "./CardTile";
import FighterTile from "./FighterTile";

interface OpponentAreaProps {
  player: PlaymatPlayerRecord;
  state: PlaymatPlayerState | null;
  onCardPress: (ownerId: string, zone: PlaymatCardZone, cardId: string) => void;
  onOpenPile: (ownerId: string, zone: PlaymatCardZone) => void;
  onFighterPress: (ownerId: string, fighterId: string) => void;
}

/** Compact read-only view of another player's area. */
export default function OpponentArea({
  player,
  state,
  onCardPress,
  onOpenPile,
  onFighterPress
}: OpponentAreaProps) {
  const { t } = useLanguage();
  const warband = getWarband(player.warband_id);

  if (!state || !warband) {
    return (
      <section className="opponent-area panel-flat">
        <header className="opponent-head">
          <strong>{player.name}</strong>
          <span className="playmat-chip">{t("playmat.waitingSetup")}</span>
        </header>
      </section>
    );
  }

  return (
    <section className="opponent-area panel-flat">
      <header className="opponent-head">
        <strong>
          {player.is_host ? <Crown size={14} aria-hidden="true" /> : null} {player.name}
        </strong>
        <span className="opponent-deck-name">{warband.name}</span>
        <span className="playmat-chip glory">
          <Trophy size={12} aria-hidden="true" /> {state.gloryEarned}
          {state.glorySpent > 0 ? ` (−${state.glorySpent})` : ""}
        </span>
      </header>

      <div className="opponent-fighters">
        {warband.fighters.map((fighter) => {
          const fighterState = state.fighters[fighter.id];
          if (!fighterState) {
            return null;
          }

          return (
            <FighterTile
              compact
              warbandId={warband.id}
              fighter={fighter}
              key={fighter.id}
              onPress={() => onFighterPress(player.id, fighter.id)}
              state={fighterState}
            />
          );
        })}
      </div>

      {state.played.length ? (
        <div className="opponent-played">
          {state.played.map((cardId) => {
            const card = getCatalogCard(cardId);
            if (!card) {
              return null;
            }

            return (
              <CardTile
                card={card}
                key={cardId}
                onPress={() => onCardPress(player.id, "played", cardId)}
                size="sm"
              />
            );
          })}
        </div>
      ) : null}

      <div className="opponent-counters">
        <span className="playmat-chip">
          <Layers size={12} aria-hidden="true" /> {t("playmat.handShort")} {state.hand.length}
        </span>
        <span className="playmat-chip">
          {t("playmat.powerDeckShort")} {state.powerDeck.length}
        </span>
        <span className="playmat-chip">
          <ScrollText size={12} aria-hidden="true" /> {t("playmat.objectiveHandShort")}{" "}
          {state.objectiveHand.length}
        </span>
        <button
          className="playmat-chip tappable"
          onClick={() => onOpenPile(player.id, "discard")}
          type="button"
        >
          {t("playmat.discardShort")} {state.discard.length}
        </button>
        <button
          className="playmat-chip tappable"
          onClick={() => onOpenPile(player.id, "scored")}
          type="button"
        >
          {t("playmat.scoredShort")} {state.scored.length}
        </button>
        {state.objectiveDiscard.length ? (
          <button
            className="playmat-chip tappable"
            onClick={() => onOpenPile(player.id, "objectiveDiscard")}
            type="button"
          >
            {t("playmat.objectiveDiscardShort")} {state.objectiveDiscard.length}
          </button>
        ) : null}
      </div>
    </section>
  );
}
