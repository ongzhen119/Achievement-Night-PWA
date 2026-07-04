import { Swords } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { Battle, resultForPlayer } from "../utils/communityData";
import { formatEventDate } from "../utils/date";

export default function BattleCard({
  battle,
  perspectivePlayerId
}: {
  battle: Battle;
  perspectivePlayerId?: string;
}) {
  const { language, t } = useLanguage();
  const result = perspectivePlayerId
    ? resultForPlayer(battle, perspectivePlayerId)
    : battle.result;
  const winner =
    battle.result === "draw"
      ? null
      : battle.result === "win"
        ? battle.playerName
        : battle.opponentName;

  return (
    <article className="battle-card">
      <div className="battle-card-topline">
        <span>{formatEventDate(battle.date, language)}</span>
        <span>{battle.format}</span>
      </div>
      <div className="battle-matchup">
        <div>
          <Link to={`/players/${battle.playerId}`}>{battle.playerName}</Link>
          <small>{battle.playerWarband}</small>
        </div>
        <div className="battle-score" aria-label={t("companion.battle.gloryScore")}>
          <strong>{battle.playerGlory}</strong>
          <Swords size={15} aria-hidden="true" />
          <strong>{battle.opponentGlory}</strong>
        </div>
        <div>
          <Link to={`/players/${battle.opponentId}`}>{battle.opponentName}</Link>
          <small>{battle.opponentWarband}</small>
        </div>
      </div>
      <div className="battle-card-footer">
        <span className={`result-badge ${result}`}>
          {perspectivePlayerId
            ? t(`companion.result.${result}`)
            : winner
              ? `${winner} ${t("companion.battle.won")}`
              : t("companion.result.draw")}
        </span>
        {battle.notes ? <p>{battle.notes}</p> : null}
      </div>
    </article>
  );
}
