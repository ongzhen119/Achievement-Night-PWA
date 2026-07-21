import { BookOpenCheck, Swords, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BattleCard from "../components/BattleCard";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { getCommunityTotals } from "../utils/communityData";
import { getSelectedPlayerId } from "../utils/communityProfile";
import { useCommunityData } from "../utils/useCommunityData";

export default function HomePage() {
  const { t } = useLanguage();
  const { data, loading, errorKey } = useCommunityData();
  const selectedPlayerId = getSelectedPlayerId();
  const selectedPlayer = data?.players.find((player) => player.id === selectedPlayerId);
  const totals = data ? getCommunityTotals(data.players, data.battles) : null;

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />

      <section className="community-hero panel">
        <div className="shop-logo-placeholder" aria-label="Aexern board game shop logo placeholder">
          <img src="/icons/logo.png" alt="Aexern" width='100'/>
          {/* <small>{t("companion.home.logoPlaceholder")}</small> */}
        </div>
        <div>
          <p className="eyebrow">{t("companion.home.communityLabel")}</p>
          <h1>{t("companion.home.heading")}</h1>
          <p className="hero-copy">{t("companion.home.subtitle")}</p>
        </div>
        <Link className="primary-button main-cta" to="/battles/new">
          <Swords size={22} aria-hidden="true" />
          {t("companion.home.logBattle")}
        </Link>
        <div className="current-player-line">
          <span>{t("companion.home.playingAs")}</span>
          {selectedPlayer ? (
            <Link to={`/players/${selectedPlayer.id}`}>{selectedPlayer.nickname}</Link>
          ) : (
            <Link to="/players">{t("companion.home.selectPlayer")}</Link>
          )}
        </div>
      </section>

      <Link className="panel guide-link playmat-entry" to="/playmat">
        <Swords size={24} aria-hidden="true" />
        <span>
          <strong>{t("playmat.homeEntryTitle")}</strong>
          <small>{t("playmat.homeEntrySubtitle")}</small>
        </span>
      </Link>

      <Link className="panel guide-link" to="/guide">
        <BookOpenCheck size={24} aria-hidden="true" />
        <span>
          <strong>{t("companion.home.guide")}</strong>
          <small>{t("companion.home.guideHelper")}</small>
        </span>
      </Link>

      <Link className="panel guide-link" to="/card-help">
        <BookOpenCheck size={24} aria-hidden="true" />
        <span>
          <strong>{t("cardHelp.heading")}</strong>
          <small>{t("cardHelp.subtitle")}</small>
        </span>
      </Link>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {totals ? (
        <section className="panel share-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("companion.home.snapshot")}</p>
              <h2>{t("companion.home.communityStats")}</h2>
            </div>
            <Users size={22} aria-hidden="true" />
          </div>
          <div className="stats-grid three">
            <div className="stat-tile"><strong>{totals.players}</strong><span>{t("companion.stats.players")}</span></div>
            <div className="stat-tile"><strong>{totals.battles}</strong><span>{t("companion.stats.battles")}</span></div>
            <div className="stat-tile"><strong>{totals.glory}</strong><span>{t("companion.stats.glory")}</span></div>
          </div>
        </section>
      ) : null}

      {data ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("companion.home.recentLabel")}</p>
              <h2>{t("companion.home.recentBattles")}</h2>
            </div>
            <Link to="/battles">{t("companion.home.viewAll")}</Link>
          </div>
          {data.battles.length ? (
            <div className="card-list">
              {data.battles.slice(0, 5).map((battle) => (
                <BattleCard battle={battle} key={battle.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Swords size={28} aria-hidden="true" />
              <p>{t("companion.home.noBattles")}</p>
            </div>
          )}
        </section>
      ) : null}

      <Link className="panel guide-link playmat-entry" to="/playmat">
        <Swords size={24} aria-hidden="true" />
        <span>
          <strong>{t("playmat.homeEntryTitle")}</strong>
          <small>{t("playmat.homeEntrySubtitle")}</small>
        </span>
      </Link>

      <Link className="panel guide-link" to="/guide">
        <BookOpenCheck size={24} aria-hidden="true" />
        <span>
          <strong>{t("companion.home.guide")}</strong>
          <small>{t("companion.home.guideHelper")}</small>
        </span>
      </Link>

      <Link className="panel guide-link" to="/card-help">
        <BookOpenCheck size={24} aria-hidden="true" />
        <span>
          <strong>{t("cardHelp.heading")}</strong>
          <small>{t("cardHelp.subtitle")}</small>
        </span>
      </Link>

      <BottomNav />
    </main>
  );
}
