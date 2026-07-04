import { useEffect, useState } from "react";
import { CalendarDays, Shield, Swords, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BattleCard from "../components/BattleCard";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { calculatePlayerStats } from "../utils/communityData";
import { getSelectedPlayerId, setSelectedPlayerId } from "../utils/communityProfile";
import { useCommunityData } from "../utils/useCommunityData";

export default function PlayerProfilePage() {
  const { playerId = "" } = useParams();
  const { t } = useLanguage();
  const { data, loading, errorKey } = useCommunityData();
  const stats = data
    ? calculatePlayerStats(data.players, data.battles).find((item) => item.player.id === playerId)
    : null;
  const battles = data?.battles.filter(
    (battle) => battle.playerId === playerId || battle.opponentId === playerId
  ) ?? [];
  const [selected, setSelected] = useState(() => getSelectedPlayerId() === playerId);

  useEffect(() => {
    setSelected(getSelectedPlayerId() === playerId);
  }, [playerId]);

  function useProfile() {
    setSelectedPlayerId(playerId);
    setSelected(true);
  }

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />
      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {!loading && data && !stats ? (
        <section className="panel empty-state">
          <User size={30} aria-hidden="true" />
          <p>{t("companion.profile.notFound")}</p>
          <Link className="secondary-button" to="/players">{t("companion.nav.players")}</Link>
        </section>
      ) : null}

      {stats ? (
        <>
          <section className="profile-hero-card panel">
            <div className="profile-avatar">{stats.player.nickname.slice(0, 2).toUpperCase()}</div>
            <div>
              <p className="eyebrow">{t("companion.profile.communityPlayer")}</p>
              <h1>{stats.player.nickname}</h1>
              <p className="profile-meta"><Shield size={15} aria-hidden="true" />{stats.player.favouriteWarband || t("companion.players.noWarband")}</p>
              {stats.player.joinedYear ? <p className="profile-meta"><CalendarDays size={15} aria-hidden="true" />{t("companion.profile.joined")} {stats.player.joinedYear}</p> : null}
            </div>
            {!selected ? (
              <button className="secondary-button full-span" onClick={useProfile} type="button">
                {t("companion.profile.useProfile")}
              </button>
            ) : <span className="selected-pill full-span">{t("companion.players.selected")}</span>}
          </section>

          <section className="panel">
            <p className="eyebrow">{t("companion.profile.record")}</p>
            <div className="stats-grid two profile-stats">
              <div className="stat-tile"><strong>{stats.games}</strong><span>{t("companion.stats.games")}</span></div>
              <div className="stat-tile"><strong>{stats.winRate}%</strong><span>{t("companion.stats.winRate")}</span></div>
              <div className="stat-tile"><strong>{stats.wins}-{stats.losses}-{stats.draws}</strong><span>{t("companion.stats.record")}</span></div>
              <div className="stat-tile"><strong>{stats.totalGlory}</strong><span>{t("companion.stats.glory")}</span></div>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t("companion.profile.historyLabel")}</p>
                <h2>{t("companion.profile.battles")}</h2>
              </div>
              <Swords size={21} aria-hidden="true" />
            </div>
            {battles.length ? (
              <div className="card-list">{battles.map((battle) => <BattleCard battle={battle} key={battle.id} perspectivePlayerId={playerId} />)}</div>
            ) : <p className="empty-state">{t("companion.profile.noBattles")}</p>}
          </section>
        </>
      ) : null}
      <BottomNav />
    </main>
  );
}
