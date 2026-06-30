import { useEffect, useState } from "react";
import { BarChart2, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { achievements } from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import { TranslationKey } from "../i18n/translations";
import {
  fetchAchievementStats,
  fetchCommunityStats,
  fetchWarbandStats
} from "../utils/eventData";

type CommunityStats = {
  totalEvents: number;
  totalPlayers: number;
  totalAchievements: number;
};

export default function StatsPage() {
  const { t } = useLanguage();
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [achievementStats, setAchievementStats] = useState<
    { achievementId: string; count: number }[]
  >([]);
  const [warbandStats, setWarbandStats] = useState<
    { warband: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCommunityStats(), fetchAchievementStats(), fetchWarbandStats()])
      .then(([c, a, w]) => {
        setCommunity(c);
        setAchievementStats(a);
        setWarbandStats(w);
      })
      .catch((e: unknown) =>
        setErrorKey(e instanceof Error ? e.message : "status.saveError")
      )
      .finally(() => setLoading(false));
  }, []);

  const achievementMap = new Map(achievements.map((a) => [a.id, a.titleKey]));

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("app.name")}</p>
        <LanguageToggle />
      </div>

      <section className="panel hero-panel">
        <div className="hero-relic" aria-hidden="true">
          <BarChart2 size={42} />
        </div>
        <h1>{t("stats.heading")}</h1>
        <p className="hero-copy">{t("stats.subtitle")}</p>
      </section>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {community ? (
        <section className="panel">
          <p className="eyebrow">{t("stats.communityHeading")}</p>
          <div className="stats-grid">
            <div className="stat-cell">
              <span className="stat-value">{community.totalEvents}</span>
              <span className="stat-label">{t("stats.totalEvents")}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-value">{community.totalPlayers}</span>
              <span className="stat-label">{t("stats.totalPlayers")}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-value">{community.totalAchievements}</span>
              <span className="stat-label">{t("stats.totalAchievements")}</span>
            </div>
          </div>
        </section>
      ) : null}

      {achievementStats.length > 0 ? (
        <section className="panel">
          <p className="eyebrow">{t("stats.achievementHeading")}</p>
          <div className="stats-list">
            {achievementStats.slice(0, 5).map(({ achievementId, count }) => {
              const titleKey = achievementMap.get(achievementId);
              if (!titleKey) return null;
              return (
                <div className="stat-row" key={achievementId}>
                  <Star size={14} aria-hidden="true" />
                  <span className="stat-row-name">
                    {t(titleKey as TranslationKey)}
                  </span>
                  <span className="stat-row-count">{count}×</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {warbandStats.length > 0 ? (
        <section className="panel">
          <p className="eyebrow">{t("stats.warbandHeading")}</p>
          <div className="stats-list">
            {warbandStats.slice(0, 5).map(({ warband, count }) => (
              <div className="stat-row" key={warband}>
                <Shield size={14} aria-hidden="true" />
                <span className="stat-row-name">{warband}</span>
                <span className="stat-row-count">{count}×</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel centered-panel">
        <Link className="secondary-button" to="/hall-of-fame">
          {t("stats.hofLink")}
        </Link>
      </section>
    </main>
  );
}
