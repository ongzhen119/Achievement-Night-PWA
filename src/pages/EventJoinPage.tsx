import { FormEvent, useEffect, useState } from "react";
import { BookOpenCheck, CalendarDays, Flame, Shield } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import { getCommunityProfile, getOrCreateCommunityPlayerId } from "../utils/communityProfile";
import { joinPlayer, fetchEventBySlug } from "../utils/eventData";
import { setCurrentPlayerCache } from "../utils/storage";
import { EventRecord } from "../utils/supabase";

export default function EventJoinPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [eventRecord, setEventRecord] = useState<EventRecord | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState(() => getCommunityProfile()?.displayName ?? "");
  const [warband, setWarband] = useState(() => getCommunityProfile()?.warband ?? "");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadEvent() {
      try {
        setLoading(true);
        setErrorKey(null);
        const eventData = await fetchEventBySlug(slug);

        if (!isCurrent) {
          return;
        }

        setEventRecord(eventData);
        if (!eventData) {
          setErrorKey("status.eventNotFound");
        }
      } catch (error) {
        if (isCurrent) {
          setErrorKey(error instanceof Error ? error.message : "status.eventNotFound");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    void loadEvent();

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (!joinCode.trim() || !displayName.trim() || !warband.trim()) {
      setErrorKey("status.formRequired");
      return;
    }

    setSubmitting(true);
    setErrorKey(null);

    const result = await joinPlayer(slug, joinCode, displayName, warband, getOrCreateCommunityPlayerId());

    if ("player" in result && result.player) {
      setCurrentPlayerCache(slug, {
        playerId: result.player.id,
        displayName: result.player.display_name,
        warband: result.player.warband
      });
      navigate(`/event/${slug}/checklist`);
      return;
    }

    setErrorKey(result.errorKey);
    if (result.event) {
      setEventRecord(result.event);
    }
    setSubmitting(false);
  }

  const eventDate = eventRecord
    ? formatEventDate(eventRecord.event_date, language)
    : "";
  const isLocked = Boolean(eventRecord?.is_locked);

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("app.tagline")}</p>
        <LanguageToggle />
      </div>

      <section className="panel hero-panel">
        <div className="hero-relic" aria-hidden="true">
          <Shield size={42} />
        </div>
        <p className="eyebrow">{t("join.communityLabel")}</p>
        <h1>{eventRecord?.name ?? t("app.name")}</h1>
        {eventRecord ? (
          <p className="date-line">
            <CalendarDays size={18} aria-hidden="true" />
            <span>{eventDate}</span>
          </p>
        ) : null}
        <p className="hero-copy">{t("join.description")}</p>
      </section>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        {loading ? <p className="status-line">{t("common.loading")}</p> : null}
        {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

        <label>
          <span>{t("join.joinCodeLabel")}</span>
          <input
            autoComplete="off"
            inputMode="text"
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder={t("join.joinCodePlaceholder")}
            value={joinCode}
          />
        </label>
        <label>
          <span>{t("join.playerNameLabel")}</span>
          <input
            autoComplete="name"
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t("join.playerNamePlaceholder")}
            value={displayName}
          />
        </label>
        <label>
          <span>{t("join.warbandLabel")}</span>
          <input
            autoComplete="off"
            onChange={(event) => setWarband(event.target.value)}
            placeholder={t("join.warbandPlaceholder")}
            value={warband}
          />
        </label>

        <div className="honour-note">
          <Flame size={18} aria-hidden="true" />
          <div>
            <strong>{t("join.honourTitle")}</strong>
            <p>{t("join.honourBody")}</p>
          </div>
        </div>

        <button
          className="primary-button"
          disabled={submitting || loading || isLocked}
          type="submit"
        >
          {isLocked ? t("join.lockedButton") : t("join.enterButton")}
        </button>
        <Link className="secondary-button" to={`/event/${slug}/quick-start`}>
          <BookOpenCheck size={18} aria-hidden="true" />
          <span>{t("join.guideLink")}</span>
        </Link>
      </form>
    </main>
  );
}
