import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { PlayerStats } from "../utils/communityData";

export default function PlayerCard({
  stats,
  selected,
  onSelect
}: {
  stats: PlayerStats;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <article className={`player-card${selected ? " selected" : ""}`}>
      <div className="player-card-heading">
        <div>
          <Link to={`/players/${stats.player.id}`}>{stats.player.nickname}</Link>
          <span>
            <Shield size={13} aria-hidden="true" />
            {stats.player.favouriteWarband || t("companion.players.noWarband")}
          </span>
        </div>
        {selected ? <span className="selected-pill">{t("companion.players.selected")}</span> : null}
      </div>
      <div className="player-card-stats">
        <span><strong>{stats.games}</strong>{t("companion.stats.games")}</span>
        <span><strong>{stats.wins}-{stats.losses}-{stats.draws}</strong>{t("companion.stats.record")}</span>
        <span><strong>{stats.winRate}%</strong>{t("companion.stats.winRate")}</span>
        <span><strong>{stats.totalGlory}</strong>{t("companion.stats.glory")}</span>
      </div>
      {onSelect && !selected ? (
        <button className="secondary-button" onClick={onSelect} type="button">
          {t("companion.players.select")}
        </button>
      ) : null}
    </article>
  );
}
