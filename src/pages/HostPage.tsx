import { FormEvent, useCallback, useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useParams } from "react-router-dom";
import HostPlayerRow from "../components/HostPlayerRow";
import LanguageToggle from "../components/LanguageToggle";
import RankingCard from "../components/RankingCard";
import { maxAchievementScore } from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import {
  deletePlayer,
  fetchEventBySlug,
  fetchRankings,
  RankedPlayer,
  resetPlayerAchievements,
  setEventLocked
} from "../utils/eventData";
import { formatText } from "../utils/format";
import { getProgressPercent } from "../utils/levels";
import { EventRecord, subscribeToEventChanges } from "../utils/supabase";

export default function HostPage() {
  const { slug = "" } = useParams();
  const { language, t } = useLanguage();
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const loadHostData = useCallback(async () => {
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
    void loadHostData();
  }, [loadHostData]);

  useEffect(() => {
    if (!eventRecord) {
      return undefined;
    }

    return subscribeToEventChanges(eventRecord.id, () => {
      void loadHostData();
    });
  }, [eventRecord, loadHostData]);

  function handlePinSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (!eventRecord || pin.trim() !== eventRecord.host_pin) {
      setErrorKey("status.hostPinInvalid");
      return;
    }

    setAuthenticated(true);
    setErrorKey(null);
  }

  async function handleLockToggle() {
    if (!eventRecord) {
      return;
    }

    try {
      setActionBusy(true);
      await setEventLocked(eventRecord.id, !eventRecord.is_locked);
      await loadHostData();
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReset(playerId: string) {
    if (!window.confirm(t("host.confirmReset"))) {
      return;
    }

    try {
      setActionBusy(true);
      await resetPlayerAchievements(playerId);
      await loadHostData();
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete(playerId: string) {
    if (!window.confirm(t("host.confirmDelete"))) {
      return;
    }

    try {
      setActionBusy(true);
      await deletePlayer(playerId);
      await loadHostData();
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <main className="app-shell host-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("host.heading")}</p>
        <LanguageToggle />
      </div>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {!authenticated ? (
        <form className="panel form-panel" onSubmit={handlePinSubmit}>
          <h1>{t("host.heading")}</h1>
          <p className="muted">{t("host.pinIntro")}</p>
          {eventRecord ? (
            <div className="event-meta-stack">
              <span>{eventRecord.name}</span>
              <span>{formatEventDate(eventRecord.event_date, language)}</span>
            </div>
          ) : null}
          <label>
            <span>{t("host.pinLabel")}</span>
            <input
              autoComplete="off"
              onChange={(event) => setPin(event.target.value)}
              placeholder={t("host.pinPlaceholder")}
              type="password"
              value={pin}
            />
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            {t("host.unlockButton")}
          </button>
        </form>
      ) : (
        <>
          <section className="panel host-control">
            <div>
              <p className="eyebrow">{t("host.toolsHeading")}</p>
              <h1>{eventRecord?.name}</h1>
              {eventRecord ? (
                <p className="muted">
                  {formatEventDate(eventRecord.event_date, language)}
                </p>
              ) : null}
            </div>
            <div className="status-pill">
              {eventRecord?.is_locked ? (
                <Lock size={16} aria-hidden="true" />
              ) : (
                <Unlock size={16} aria-hidden="true" />
              )}
              <span>
                {eventRecord?.is_locked
                  ? t("common.lockedStatus")
                  : t("common.openStatus")}
              </span>
            </div>
            <button
              className="secondary-button"
              disabled={actionBusy}
              onClick={handleLockToggle}
              type="button"
            >
              {eventRecord?.is_locked
                ? t("host.unlockEventButton")
                : t("host.lockButton")}
            </button>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>{t("host.playersHeading")}</h2>
              <span>
                {eventRecord?.is_locked
                  ? t("common.lockedStatus")
                  : t("common.openStatus")}
              </span>
            </div>
            <div className="host-player-list">
              {rankings.map((player) => (
                <HostPlayerRow
                  deleteLabel={t("host.deleteButton")}
                  displayName={player.display_name}
                  key={player.id}
                  onDelete={() => handleDelete(player.id)}
                  onReset={() => handleReset(player.id)}
                  resetLabel={t("host.resetButton")}
                  scoreText={formatText(t("ranking.scoreTemplate"), {
                    score: player.score
                  })}
                  title={t(player.titleKey)}
                  warband={player.warband}
                />
              ))}
            </div>
            {rankings.length === 0 ? (
              <p className="muted">{t("host.noPlayers")}</p>
            ) : null}
          </section>

          <section className="ranking-poster panel">
            <p className="eyebrow">{t("host.previewHeading")}</p>
            <h1>{t("ranking.heading")}</h1>
            <div className="ranking-list">
              {rankings.map((player, index) => (
                <RankingCard
                  displayName={player.display_name}
                  key={player.id}
                  progressPercent={getProgressPercent(
                    player.score,
                    maxAchievementScore
                  )}
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
            <footer>{t("ranking.footer")}</footer>
          </section>
        </>
      )}
    </main>
  );
}
