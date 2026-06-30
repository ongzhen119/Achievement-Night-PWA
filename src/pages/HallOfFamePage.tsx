import { useEffect, useState } from "react";
import { Crown, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import { fetchHallOfFame } from "../utils/eventData";
import { CommunityRecords, fetchCommunityRecords } from "../utils/communityStats";
import { HallOfFameRecord } from "../utils/supabase";

export default function HallOfFamePage() {
  const { language, t } = useLanguage();
  const [entries, setEntries] = useState<HallOfFameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [communityRecords, setCommunityRecords] = useState<CommunityRecords | null>(null);

  useEffect(() => {
    fetchHallOfFame()
      .then(setEntries)
      .catch((e: unknown) =>
        setErrorKey(e instanceof Error ? e.message : "status.saveError")
      )
      .finally(() => setLoading(false));
    fetchCommunityRecords().then(setCommunityRecords).catch(() => {});
  }, []);

  const seasons = Array.from(new Set(entries.map((e) => e.season_label)));

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("app.name")}</p>
        <LanguageToggle />
      </div>

      <section className="panel hero-panel">
        <div className="hero-relic" aria-hidden="true">
          <Crown size={42} />
        </div>
        <h1>{t("hof.heading")}</h1>
        <p className="hero-copy">{t("hof.subtitle")}</p>
      </section>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {!loading && entries.length === 0 ? (
        <section className="panel">
          <p className="muted">{t("hof.empty")}</p>
        </section>
      ) : null}

      {seasons.map((season) => (
        <section className="panel" key={season}>
          <p className="eyebrow">{season}</p>
          <div className="hof-list">
            {entries
              .filter((e) => e.season_label === season)
              .map((entry) => (
                <div className="hof-entry" key={entry.id}>
                  <div className="hof-entry-header">
                    <Crown className="hof-crown" size={18} aria-hidden="true" />
                    <span className="hof-event-date">
                      {formatEventDate(entry.event_date, language)}
                    </span>
                  </div>
                  <p className="hof-name">{entry.champion_name}</p>
                  <p className="hof-warband">
                    <Shield size={13} aria-hidden="true" />
                    {entry.warband}
                  </p>
                  <div className="hof-footer">
                    <span>{entry.event_name}</span>
                    <span className="hof-score">{entry.score} pts</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <p className="eyebrow">{t("hof.communityRecords")}</p>
        <div className="contribution-list">
          {communityRecords?.mostGlory ? (
            <div className="contribution-row">
              <span>{t("hof.mostGlory")}</span>
              <span className="contribution-value">
                {communityRecords.mostGlory.name} · {communityRecords.mostGlory.total}
              </span>
            </div>
          ) : null}
          {communityRecords?.mostGames ? (
            <div className="contribution-row">
              <span>{t("hof.mostGames")}</span>
              <span className="contribution-value">
                {communityRecords.mostGames.name} · {communityRecords.mostGames.count}
              </span>
            </div>
          ) : null}
          <div className="contribution-row">
            <span>{t("hof.perfectVictories")}</span>
            <span className="contribution-value">{communityRecords?.perfectVictories ?? 0}</span>
          </div>
          <div className="contribution-row">
            <span>{t("hof.doubleCrits")}</span>
            <span className="contribution-value">{communityRecords?.doubleCrits ?? 0}</span>
          </div>
          <div className="contribution-row">
            <span>{t("hof.communityContrib")}</span>
            <span className="contribution-placeholder">coming soon</span>
          </div>
        </div>
      </section>

      <section className="panel centered-panel">
        <Link className="secondary-button" to="/stats">
          {t("hof.statsLink")}
        </Link>
      </section>
    </main>
  );
}
