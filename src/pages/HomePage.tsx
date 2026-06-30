import { useEffect, useState } from "react";
import { Crown, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import { fetchCommunityStats, fetchLatestChampion } from "../utils/eventData";
import { HallOfFameRecord } from "../utils/supabase";

type CommunityStats = Awaited<ReturnType<typeof fetchCommunityStats>>;

export default function HomePage() {
  const { t, language } = useLanguage();
  const [champion, setChampion] = useState<HallOfFameRecord | null>(null);
  const [stats, setStats] = useState<CommunityStats | null>(null);

  useEffect(() => {
    Promise.all([fetchLatestChampion(), fetchCommunityStats()])
      .then(([c, s]) => {
        setChampion(c);
        setStats(s);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">Aexern Underworlds</p>
        <LanguageToggle />
      </div>

      <section className="panel hero-panel">
        <p className="eyebrow">{t("home.communityLabel")}</p>
        <h1 className="home-wordmark">
          Aexern
          <br />
          Underworlds
        </h1>
        <p className="hero-copy">{t("home.tagline")}</p>
        <div className="home-cta-row">
          <Link className="primary-button" to="/hall-of-fame">
            {t("home.hofCTA")}
          </Link>
          <Link className="secondary-button" to="/profile">
            {t("home.profileCTA")}
          </Link>
        </div>
      </section>

      {champion ? (
        <section className="panel">
          <p className="eyebrow">
            <Crown
              size={13}
              style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}
              aria-hidden="true"
            />
            {t("home.reigningChampion")}
          </p>
          <div className="home-champion-card">
            <span className="home-champion-name">{champion.champion_name}</span>
            <div className="home-champion-warband">
              <Shield size={14} aria-hidden="true" />
              {champion.warband}
            </div>
            <div className="home-champion-meta">
              <span>{champion.season_label}</span>
              <span>{champion.event_name}</span>
              <span>{champion.score} pts</span>
              <span>{formatEventDate(champion.event_date, language)}</span>
            </div>
          </div>
        </section>
      ) : null}

      {stats ? (
        <section className="panel">
          <p className="eyebrow">{t("home.communityStats")}</p>
          <div className="home-stats-row">
            <div className="home-stat">
              <span className="home-stat-num">{stats.totalEvents}</span>
              <span className="home-stat-label">{t("stats.totalEvents")}</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-num">{stats.totalPlayers}</span>
              <span className="home-stat-label">{t("stats.totalPlayers")}</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-num">{stats.totalAchievements}</span>
              <span className="home-stat-label">{t("stats.totalAchievements")}</span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <p className="eyebrow">{t("home.exploreLabel")}</p>
        <div className="global-links" style={{ marginTop: 12 }}>
          <Link className="secondary-button" to="/profile">
            {t("nav.profile")}
          </Link>
          <Link className="secondary-button" to="/hall-of-fame">
            {t("nav.hallOfFame")}
          </Link>
          <Link className="secondary-button" to="/stats">
            {t("nav.stats")}
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">{t("home.joinHeading")}</p>
        <p className="hero-copy" style={{ marginTop: 8 }}>
          {t("home.joinBody")}
        </p>
      </section>
    </main>
  );
}
