import { FormEvent, useCallback, useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useParams } from "react-router-dom";
import HostPlayerRow from "../components/HostPlayerRow";
import LanguageToggle from "../components/LanguageToggle";
import RankingCard from "../components/RankingCard";
import { SEASON_OPTIONS } from "../data/seasons";
import { maxAchievementScore } from "../data/achievements";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import {
  deletePlayer,
  fetchEventBySlug,
  fetchRankings,
  isChampionRecorded,
  RankedPlayer,
  recordChampion,
  resetPlayerAchievements,
  setEventLocked,
  setEventSeason
} from "../utils/eventData";
import { formatText } from "../utils/format";
import { getProgressPercent } from "../utils/levels";
import { EventRecord, subscribeToEventChanges } from "../utils/supabase";

export default function HostPage() {
  const { slug = "" } = useParams();
  const { language, t } = useLanguage();
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [championRecorded, setChampionRecorded] = useState(false);
  const [seasonDraft, setSeasonDraft] = useState("");
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

      const [rankingsData, recorded] = await Promise.all([
        fetchRankings(eventData.id),
        isChampionRecorded(eventData.id)
      ]);

      setEventRecord(eventData);
      setRankings(rankingsData);
      setChampionRecorded(recorded);
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
    if (!eventRecord) return;

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

  async function handleSetSeason() {
    if (!eventRecord || !seasonDraft) return;

    try {
      setActionBusy(true);
      await setEventSeason(eventRecord.id, seasonDraft);
      await loadHostData();
      setSeasonDraft("");
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRecordChampion() {
    if (!eventRecord || !rankings[0] || !eventRecord.season_label) return;

    const champion = rankings[0];
    const confirmed = window.confirm(
      formatText(t("host.confirmChampion"), {
        name: champion.display_name,
        warband: champion.warband,
        score: champion.score
      })
    );
    if (!confirmed) return;

    try {
      setActionBusy(true);
      await recordChampion(
        eventRecord.id,
        eventRecord.season_label,
        eventRecord.name,
        eventRecord.event_date,
        champion.display_name,
        champion.warband,
        champion.score,
        champion.community_player_id ?? undefined
      );
      setChampionRecorded(true);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReset(playerId: string) {
    if (!window.confirm(t("host.confirmReset"))) return;

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
    if (!window.confirm(t("host.confirmDelete"))) return;

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

            <div className="host-season-row">
              <span>{t("host.seasonLabel")}</span>
              {eventRecord?.season_label ? (
                <span className="season-tag">{eventRecord.season_label}</span>
              ) : (
                <div className="host-season-select">
                  <select
                    className="app-select"
                    onChange={(e) => setSeasonDraft(e.target.value)}
                    value={seasonDraft}
                  >
                    <option value="">{t("host.seasonPlaceholder")}</option>
                    {SEASON_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    className="secondary-button"
                    disabled={!seasonDraft || actionBusy}
                    onClick={handleSetSeason}
                    type="button"
                  >
                    {t("host.seasonSaveButton")}
                  </button>
                </div>
              )}
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

          {eventRecord?.is_locked && rankings.length > 0 ? (
            <section className="panel host-champion-section">
              <p className="eyebrow">{t("host.recordChampionHeading")}</p>
              {championRecorded ? (
                <p className="status-line">{t("host.championRecordedStatus")}</p>
              ) : (
                <>
                  <p className="muted">{t("host.recordChampionBody")}</p>
                  <div className="champion-preview">
                    <strong>{rankings[0].display_name}</strong>
                    <span>
                      {rankings[0].warband} · {rankings[0].score} pts
                    </span>
                  </div>
                  {!eventRecord.season_label ? (
                    <p className="warning-line">{t("host.noSeasonWarning")}</p>
                  ) : null}
                  <button
                    className="primary-button"
                    disabled={actionBusy || !eventRecord.season_label}
                    onClick={handleRecordChampion}
                    type="button"
                  >
                    {t("host.recordChampionButton")}
                  </button>
                </>
              )}
            </section>
          ) : null}

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
