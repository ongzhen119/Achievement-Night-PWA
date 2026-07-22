import { CSSProperties } from "react";
import { Crown, Layers, ScrollText, Swords, Trophy } from "lucide-react";
import { getCatalogCard } from "../../data/playmat/catalog";
import { getWarband, warbandAccent } from "../../data/playmat/warbands";
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

/** The enemy territory: a read-only battle line for another player's warband. */
export default function OpponentArea({
  player,
  state,
  onCardPress,
  onOpenPile,
  onFighterPress
}: OpponentAreaProps) {
  const { t } = useLanguage();
  const warband = getWarband(player.warband_id);
  const accentStyle = {
    "--wb": warbandAccent(player.warband_id)
  } as CSSProperties;

  if (!state || !warband) {
    return (
      <section className="warband-field enemy" style={accentStyle}>
        <header className="field-banner">
          <span className="field-side">{t("playmat.enemyLabel")}</span>
          <strong className="field-name">{player.name}</strong>
          <span className="playmat-chip">{t("playmat.waitingSetup")}</span>
        </header>
      </section>
    );
  }

  const fightersLeft = warband.fighters.filter(
    (fighter) => !state.fighters[fighter.id]?.out
  ).length;

  return (
    <section className="warband-field enemy" style={accentStyle}>
      <header className="field-banner">
        <span className="field-side">{t("playmat.enemyLabel")}</span>
        <strong className="field-name">
          {player.is_host ? <Crown size={13} aria-hidden="true" /> : null}
          {player.name}
        </strong>
        <span className="field-warband">{warband.name}</span>
        <span className="field-glory">
          <Trophy size={14} aria-hidden="true" />
          <b>{state.gloryEarned}</b>
          {state.glorySpent > 0 ? <small>−{state.glorySpent}</small> : null}
        </span>
      </header>

      <div className="field-fighters">
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

      <div className="field-played" aria-label={t("playmat.zone.played")}>
        {state.played.length ? (
          state.played.map((cardId) => {
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
          })
        ) : (
          <span className="field-played-empty">{t("playmat.noBoardYet")}</span>
        )}
      </div>

      <div className="field-counters">
        <span className="field-stat">
          <Swords size={12} aria-hidden="true" />
          {fightersLeft}/{warband.fighters.length}
        </span>
        <span className="field-stat">
          <Layers size={12} aria-hidden="true" />
          {t("playmat.handShort")} {state.hand.length}
        </span>
        <span className="field-stat">
          {t("playmat.powerDeckShort")} {state.powerDeck.length}
        </span>
        <span className="field-stat">
          <ScrollText size={12} aria-hidden="true" />
          {t("playmat.objectiveHandShort")} {state.objectiveHand.length}
        </span>
        <button
          className="field-stat tappable"
          onClick={() => onOpenPile(player.id, "discard")}
          type="button"
        >
          {t("playmat.discardShort")} {state.discard.length}
        </button>
        <button
          className="field-stat tappable gold"
          onClick={() => onOpenPile(player.id, "scored")}
          type="button"
        >
          <Trophy size={12} aria-hidden="true" />
          {t("playmat.scoredShort")} {state.scored.length}
        </button>
        {state.objectiveDiscard.length ? (
          <button
            className="field-stat tappable"
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
