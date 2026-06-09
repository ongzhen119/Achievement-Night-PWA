import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import LanguageToggle from "../components/LanguageToggle";
import RankingCard from "../components/RankingCard";
import { maxAchievementScore } from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import { fetchEventBySlug, fetchRankings, RankedPlayer } from "../utils/eventData";
import { formatText } from "../utils/format";
import { getProgressPercent } from "../utils/levels";
import { EventRecord, subscribeToEventChanges } from "../utils/supabase";

export default function RankingPage() {
  const { slug = "" } = useParams();
  const { language, t } = useLanguage();
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      const eventData = await fetchEventBySlug(slug);

      if (!eventData) {
        setErrorKey("status.eventNotFound");
        return;
      }

      setEventRecord(eventData);
      setRankings(await fetchRankings(eventData.id));
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.saveError");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  useEffect(() => {
    if (!eventRecord) {
      return undefined;
    }

    return subscribeToEventChanges(eventRecord.id, () => {
      void loadRankings();
    });
  }, [eventRecord, loadRankings]);

  return (
    <main className="app-shell page-with-nav">
      <div className="top-bar">
        <p className="eyebrow">{t("app.name")}</p>
        <LanguageToggle />
      </div>

      <section className="ranking-poster panel">
        <p className="eyebrow">{t("ranking.subtitle")}</p>
        <h1>{t("ranking.heading")}</h1>
        {eventRecord ? (
          <div className="event-meta-stack">
            <span>{eventRecord.name}</span>
            <span>{formatEventDate(eventRecord.event_date, language)}</span>
          </div>
        ) : null}

        {loading ? <p className="status-line">{t("common.loading")}</p> : null}
        {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

        <div className="ranking-list">
          {rankings.map((player, index) => (
            <RankingCard
              displayName={player.display_name}
              key={player.id}
              progressPercent={getProgressPercent(player.score, maxAchievementScore)}
              rankText={formatText(t("ranking.rankTemplate"), {
                rank: index + 1
              })}
              scoreText={formatText(t("ranking.scoreTemplate"), {
                score: player.score
              })}
              title={t(player.titleKey)}
              warband={player.warband}
            />
          ))}
        </div>

        {!loading && rankings.length === 0 ? (
          <p className="muted">{t("ranking.empty")}</p>
        ) : null}

        <footer>{t("ranking.footer")}</footer>
      </section>

      <BottomNav active="ranking" slug={slug} />
    </main>
  );
}
