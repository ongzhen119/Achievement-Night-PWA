import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AchievementCard from "../components/AchievementCard";
import BottomNav from "../components/BottomNav";
import LanguageToggle from "../components/LanguageToggle";
import PlayerHeader from "../components/PlayerHeader";
import SectionPanel from "../components/SectionPanel";
import {
  achievements,
  achievementSections,
  maxAchievementScore
} from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import {
  fetchEventBySlug,
  fetchPlayer,
  fetchPlayerAchievementIds,
  setAchievementCompleted
} from "../utils/eventData";
import { formatText } from "../utils/format";
import { getLevelTitleKey, getProgressPercent } from "../utils/levels";
import { getCurrentPlayerCache } from "../utils/storage";
import { EventRecord, PlayerRecord, subscribeToEventChanges } from "../utils/supabase";

export default function ChecklistPage() {
  const { slug = "" } = useParams();
  const { t } = useLanguage();
  const [cachedPlayer] = useState(() => getCurrentPlayerCache(slug));
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(cachedPlayer));
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
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
    void loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    if (!eventRecord) {
      return undefined;
    }

    return subscribeToEventChanges(eventRecord.id, () => {
      void loadChecklist();
    });
  }, [eventRecord, loadChecklist]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const score = achievements.reduce(
    (total, achievement) =>
      total + (completedSet.has(achievement.id) ? achievement.points : 0),
    0
  );
  const title = t(getLevelTitleKey(score));
  const progressPercent = getProgressPercent(score, maxAchievementScore);

  async function handleToggle(achievementId: string) {
    if (!eventRecord || !player || eventRecord.is_locked) {
      return;
    }

    const nextCompleted = !completedSet.has(achievementId);
    setSavingId(achievementId);
    setErrorKey(null);

    try {
      await setAchievementCompleted(
        eventRecord.id,
        player.id,
        achievementId,
        nextCompleted
      );
      setCompletedIds((currentIds) =>
        nextCompleted
          ? Array.from(new Set([...currentIds, achievementId]))
          : currentIds.filter((id) => id !== achievementId)
      );
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.saveError");
    } finally {
      setSavingId(null);
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
        <p className="eyebrow">{t("checklist.heading")}</p>
        <LanguageToggle />
      </div>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
      {eventRecord?.is_locked ? (
        <p className="warning-line">{t("checklist.lockedNote")}</p>
      ) : null}

      {player ? (
        <PlayerHeader
          displayName={player.display_name}
          progressPercent={progressPercent}
          scoreLabel={t("common.scoreLabel")}
          scoreText={formatText(t("result.scoreTemplate"), {
            score,
            maxScore: maxAchievementScore
          })}
          title={title}
          titleLabel={t("common.titleLabel")}
          warband={player.warband}
          warbandLabel={t("common.warbandLabel")}
        />
      ) : null}

      {achievementSections.map((section) => {
        const sectionAchievements = achievements.filter(
          (achievement) => achievement.sectionKey === section.titleKey
        );
        const completedCount = sectionAchievements.filter((achievement) =>
          completedSet.has(achievement.id)
        ).length;

        return (
          <SectionPanel
            key={section.id}
            meta={formatText(t("checklist.sectionProgress"), {
              completed: completedCount,
              total: sectionAchievements.length
            })}
            title={t(section.titleKey)}
          >
            {sectionAchievements.map((achievement) => {
              const completed = completedSet.has(achievement.id);
              const pointLabel =
                achievement.points === 1
                  ? t("checklist.pointSingular")
                  : t("checklist.pointPlural");

              return (
                <AchievementCard
                  completed={completed}
                  disabled={
                    Boolean(savingId) ||
                    Boolean(eventRecord?.is_locked) ||
                    !eventRecord ||
                    !player
                  }
                  key={achievement.id}
                  onToggle={() => handleToggle(achievement.id)}
                  pointsText={`${achievement.points} ${pointLabel}`}
                  title={t(achievement.titleKey)}
                />
              );
            })}
          </SectionPanel>
        );
      })}

      <BottomNav active="checklist" slug={slug} />
    </main>
  );
}
