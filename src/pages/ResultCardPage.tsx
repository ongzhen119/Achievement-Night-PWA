import { Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import LanguageToggle from "../components/LanguageToggle";
import { achievements, maxAchievementScore } from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import {
  fetchEventBySlug,
  fetchPlayer,
  fetchPlayerAchievementIds
} from "../utils/eventData";
import { formatText } from "../utils/format";
import { getLevelTitleKey, getProgressPercent } from "../utils/levels";
import { getCurrentPlayerCache } from "../utils/storage";
import { EventRecord, PlayerRecord, subscribeToEventChanges } from "../utils/supabase";

export default function ResultCardPage() {
  const { slug = "" } = useParams();
  const { language, t } = useLanguage();
  const [cachedPlayer] = useState(() => getCurrentPlayerCache(slug));
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(cachedPlayer));
  const [copyStatusKey, setCopyStatusKey] = useState<string | null>(null);

  const loadResult = useCallback(async () => {
    if (!cachedPlayer) {
      return;
    }

    try {
      setLoading(true);
      const eventData = await fetchEventBySlug(slug);

      if (!eventData) {
        setErrorKey("status.eventNotFound");
        return;
      }

      const [playerRecord, achievementIds] = await Promise.all([
        fetchPlayer(cachedPlayer.playerId),
        fetchPlayerAchievementIds(eventData.id, cachedPlayer.playerId)
      ]);

      if (!playerRecord || playerRecord.event_id !== eventData.id) {
        setErrorKey("status.playerMissing");
        return;
      }

      setEventRecord(eventData);
      setPlayer(playerRecord);
      setCompletedIds(achievementIds);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.saveError");
    } finally {
      setLoading(false);
    }
  }, [cachedPlayer, slug]);

  useEffect(() => {
    void loadResult();
  }, [loadResult]);

  useEffect(() => {
    if (!eventRecord) {
      return undefined;
    }

    return subscribeToEventChanges(eventRecord.id, () => {
      void loadResult();
    });
  }, [eventRecord, loadResult]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const score = achievements.reduce(
    (total, achievement) =>
      total + (completedSet.has(achievement.id) ? achievement.points : 0),
    0
  );
  const title = t(getLevelTitleKey(score));
  const progressPercent = getProgressPercent(score, maxAchievementScore);
  const summaryText =
    player && eventRecord
      ? formatText(t("result.summaryTemplate"), {
          name: player.display_name,
          warband: player.warband,
          score,
          maxScore: maxAchievementScore,
          title,
          completed: completedIds.length
        })
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyStatusKey("status.copied");
    } catch {
      setCopyStatusKey("status.copyFailed");
    }
  }

  if (!cachedPlayer) {
    return (
      <main className="app-shell event-shell">
        <LanguageToggle />
        <section className="panel centered-panel">
          <h1>{t("checklist.noPlayerTitle")}</h1>
          <p className="muted">{t("checklist.noPlayerBody")}</p>
          <Link className="primary-link" to={`/event/${slug}`}>
            {t("checklist.noPlayerButton")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell page-with-nav">
      <div className="top-bar">
        <p className="eyebrow">{t("result.heading")}</p>
        <LanguageToggle />
      </div>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {player ? (
        <section className="result-card panel">
          <p className="eyebrow">{t("result.subtitle")}</p>
          <h1>{player.display_name}</h1>
          <p className="muted">{player.warband}</p>
          {eventRecord ? (
            <div className="event-meta-stack">
              <span>{eventRecord.name}</span>
              <span>{formatEventDate(eventRecord.event_date, language)}</span>
            </div>
          ) : null}
          <div className="result-score">
            <strong>
              {formatText(t("result.scoreTemplate"), {
                score,
                maxScore: maxAchievementScore
              })}
            </strong>
            <span>{title}</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="muted">
            {formatText(t("result.completedTemplate"), {
              completed: completedIds.length
            })}
          </p>
          <p className="result-slogan">{t("result.slogan")}</p>
          <button
            className="primary-button"
            disabled={!summaryText}
            onClick={handleCopy}
            type="button"
          >
            <Copy size={18} aria-hidden="true" />
            <span>{t("result.copyButton")}</span>
          </button>
          {copyStatusKey ? (
            <p className="status-line">{t(copyStatusKey)}</p>
          ) : null}
        </section>
      ) : null}

      <BottomNav active="result" slug={slug} />
    </main>
  );
}
