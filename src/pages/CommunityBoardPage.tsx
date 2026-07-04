import { Activity, Crown, Flame, Gamepad2, Target, Trophy, UserCheck } from "lucide-react";
import AppHeader from "../components/AppHeader";
import PlayerCard from "../components/PlayerCard";
import { useLanguage } from "../i18n/useLanguage";
import { calculatePlayerStats, getCommunityTotals, getHallOfFame } from "../utils/communityData";
import { useCommunityData } from "../utils/useCommunityData";

export default function CommunityBoardPage() {
  const { t } = useLanguage();
  const { data, loading, errorKey } = useCommunityData();
  const totals = data ? getCommunityTotals(data.players, data.battles) : null;
  const playerStats = data
    ? calculatePlayerStats(data.players, data.battles).sort((a, b) => b.games - a.games || a.player.nickname.localeCompare(b.player.nickname))
    : [];
  const hall = data ? getHallOfFame(data.players, data.battles) : null;

  const awards = hall
    ? [
        { icon: Gamepad2, label: t("companion.hall.mostGames"), name: hall.mostGames?.player.nickname, value: hall.mostGames ? `${hall.mostGames.games} ${t("companion.stats.games")}` : null },
        { icon: Target, label: t("companion.hall.topWinRate"), name: hall.topWinRate?.player.nickname, value: hall.topWinRate ? `${hall.topWinRate.winRate}%` : null },
        { icon: Flame, label: t("companion.hall.mostGlory"), name: hall.mostGlory?.player.nickname, value: hall.mostGlory ? String(hall.mostGlory.totalGlory) : null },
        { icon: Crown, label: t("companion.hall.recentWinner"), name: hall.mostRecentWinner?.nickname, value: t("companion.hall.latestBattle") },
        { icon: Activity, label: t("companion.hall.mostActive"), name: hall.mostActive?.player.nickname, value: t("companion.hall.lastThirtyDays") }
      ]
    : [];

  return (
    <main className="app-shell event-shell">
      <AppHeader />
      <section className="community-board share-board panel">
        <div className="board-heading">
          <div className="brand-mark large">A</div>
          <div>
            <p className="eyebrow">{t("companion.board.storeLabel")}</p>
            <h1>{t("companion.board.heading")}</h1>
            <p>{t("companion.board.subtitle")}</p>
          </div>
        </div>

        {loading ? <p className="status-line">{t("common.loading")}</p> : null}
        {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

        {totals ? (
          <div className="stats-grid three board-totals">
            <div className="stat-tile"><strong>{totals.players}</strong><span>{t("companion.stats.players")}</span></div>
            <div className="stat-tile"><strong>{totals.battles}</strong><span>{t("companion.stats.battles")}</span></div>
            <div className="stat-tile"><strong>{totals.glory}</strong><span>{t("companion.stats.glory")}</span></div>
          </div>
        ) : null}

        {hall ? (
          <section className="board-section">
            <div className="section-heading">
              <div><p className="eyebrow">{t("companion.hall.label")}</p><h2>{t("companion.hall.heading")}</h2></div>
              <Trophy size={22} aria-hidden="true" />
            </div>
            {awards.some((award) => award.name) ? (
              <div className="award-grid">
                {awards.map((award) => {
                  const Icon = award.icon;
                  return award.name ? (
                    <article className="award-card" key={award.label}>
                      <Icon size={20} aria-hidden="true" />
                      <span>{award.label}</span>
                      <strong>{award.name}</strong>
                      <small>{award.value}</small>
                    </article>
                  ) : null;
                })}
              </div>
            ) : <p className="empty-state">{t("companion.hall.empty")}</p>}
          </section>
        ) : null}

        {data ? (
          <section className="board-section">
            <div className="section-heading">
              <div><p className="eyebrow">{t("companion.board.playersLabel")}</p><h2>{t("companion.board.players")}</h2></div>
              <UserCheck size={22} aria-hidden="true" />
            </div>
            <div className="card-list">{playerStats.map((stats) => <PlayerCard key={stats.player.id} stats={stats} />)}</div>
          </section>
        ) : null}
        <footer>{t("companion.board.footer")}</footer>
      </section>
    </main>
  );
}
