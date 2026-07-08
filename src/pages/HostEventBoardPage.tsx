import { FormEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  ClipboardCopy,
  KeyRound,
  MapPin,
  Plus,
  Share2,
  User,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { formatText } from "../utils/format";
import {
  addEventInterest,
  buildCancellationMessage,
  buildInviteMessage,
  buildReminderMessage,
  buildUpdateMessage,
  fetchHostEvents,
  formatEventDay,
  formatEventTimeRange,
  HOST_EVENT_DEFAULTS,
  HOST_PIN_STORAGE_KEY,
  HostEventRecord,
  HostEventStatus,
  saveHostEvent,
  toZonedInputValues,
  verifyHostPin,
  whatsAppShareUrl,
  zonedInputToIso
} from "../utils/hostEvents";
const INTEREST_IDS_KEY = "aexern-interested-events";
const INTEREST_NAME_KEY = "aexern-interest-name";

function readInterestedIds(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(INTEREST_IDS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

type EventPayload = Partial<Omit<HostEventRecord, "interested_count">>;

function eventPayload(event: HostEventRecord): EventPayload {
  const { interested_count: _interested, ...payload } = event;
  return payload;
}

type EventDraft = {
  title: string;
  event_type: string;
  format: string;
  date: string;
  startTime: string;
  endTime: string;
  venue_name: string;
  venue_note: string;
  host_name: string;
  board_count: string;
  player_capacity: string;
  beginner_friendly: boolean;
  demo_available: boolean;
  description: string;
  what_to_bring: string;
  prize_note: string;
  whatsapp_note: string;
  status: HostEventStatus;
};

function todayForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function draftFromEvent(event: HostEventRecord | null): EventDraft {
  if (!event) {
    return {
      title: HOST_EVENT_DEFAULTS.title,
      event_type: HOST_EVENT_DEFAULTS.event_type,
      format: HOST_EVENT_DEFAULTS.format,
      date: todayForInput(),
      startTime: "14:00",
      endTime: "18:00",
      venue_name: HOST_EVENT_DEFAULTS.venue_name,
      venue_note: "",
      host_name: HOST_EVENT_DEFAULTS.host_name,
      board_count: String(HOST_EVENT_DEFAULTS.board_count),
      player_capacity: "",
      beginner_friendly: HOST_EVENT_DEFAULTS.beginner_friendly,
      demo_available: HOST_EVENT_DEFAULTS.demo_available,
      description: "",
      what_to_bring: "",
      prize_note: "",
      whatsapp_note: "",
      status: "scheduled"
    };
  }

  const start = toZonedInputValues(event.start_at, event.timezone);
  const end = toZonedInputValues(event.end_at, event.timezone);
  return {
    title: event.title,
    event_type: event.event_type,
    format: event.format,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    venue_name: event.venue_name,
    venue_note: event.venue_note ?? "",
    host_name: event.host_name,
    board_count: String(event.board_count),
    player_capacity: event.player_capacity ? String(event.player_capacity) : "",
    beginner_friendly: event.beginner_friendly,
    demo_available: event.demo_available,
    description: event.description ?? "",
    what_to_bring: event.what_to_bring ?? "",
    prize_note: event.prize_note ?? "",
    whatsapp_note: event.whatsapp_note ?? "",
    status: event.status
  };
}

type EventCardProps = {
  event: HostEventRecord;
  hero?: boolean;
  hostMode: boolean;
  busy: boolean;
  interested: boolean;
  interestFormOpen: boolean;
  interestName: string;
  onInterestNameChange: (value: string) => void;
  onOpenInterest: () => void;
  onSubmitInterest: (formEvent: FormEvent) => void;
  onCopy: (text: string) => void;
  onEdit: () => void;
  onCancelEvent: () => void;
  onCompleteEvent: () => void;
};

function EventCard({
  event,
  hero = false,
  hostMode,
  busy,
  interested,
  interestFormOpen,
  interestName,
  onInterestNameChange,
  onOpenInterest,
  onSubmitInterest,
  onCopy,
  onEdit,
  onCancelEvent,
  onCompleteEvent
}: EventCardProps) {
  const { language, t } = useLanguage();
  const scheduled = event.status === "scheduled";

  return (
    <article
      className={`panel event-card${hero ? " next-event-hero" : ""} status-${event.status}`}
      id={`event-${event.id}`}
    >
      {hero ? <p className="eyebrow">{t("events.nextLabel")}</p> : null}
      <div className="event-card-top">
        <span className={`event-status-tag ${event.status}`}>
          {t(`events.status.${event.status}`)}
        </span>
        <span className="muted event-type-line">
          {event.event_type} · {event.format}
        </span>
      </div>
      <h3 className="event-title">{event.title}</h3>
      <div className="event-meta">
        <span className="event-date-line">
          <CalendarDays size={hero ? 20 : 16} aria-hidden="true" />
          {formatEventDay(event, language)}
        </span>
        <span>
          <Clock size={16} aria-hidden="true" />
          {formatEventTimeRange(event, language)}
        </span>
        <span>
          <MapPin size={16} aria-hidden="true" />
          {event.venue_name}
          {event.venue_note ? ` · ${event.venue_note}` : ""}
        </span>
        <span>
          <User size={16} aria-hidden="true" />
          {formatText(t("events.hostedBy"), { name: event.host_name })}
        </span>
      </div>
      <div className="event-badge-row">
        {event.beginner_friendly ? (
          <span className="event-badge moss">{t("events.beginnerFriendly")}</span>
        ) : null}
        {event.demo_available ? (
          <span className="event-badge gold">{t("events.demoAvailable")}</span>
        ) : null}
        <span className="event-badge">
          {formatText(t("events.boardsBadge"), { count: event.board_count })}
        </span>
        {event.player_capacity ? (
          <span className="event-badge">
            {formatText(t("events.capacityBadge"), { count: event.player_capacity })}
          </span>
        ) : null}
      </div>
      {event.description ? <p className="muted">{event.description}</p> : null}
      {event.what_to_bring ? (
        <p className="muted">
          🎒 {t("events.whatToBring")}: {event.what_to_bring}
        </p>
      ) : null}
      {event.prize_note ? <p className="muted">🎁 {event.prize_note}</p> : null}
      {event.status === "cancelled" && event.cancelled_reason ? (
        <p className="warning-line">
          {t("events.cancelReasonLabel")}: {event.cancelled_reason}
        </p>
      ) : null}
      {event.status === "completed" && event.completed_summary ? (
        <p className="muted">{event.completed_summary}</p>
      ) : null}

      {scheduled ? (
        <div className="event-interest">
          <span className="count-pill">
            <Users size={14} aria-hidden="true" />
            {formatText(t("events.interestedCount"), { count: event.interested_count })}
          </span>
          {interested ? (
            <span className="muted">{t("events.interestedDone")}</span>
          ) : interestFormOpen ? (
            <form className="interest-form" onSubmit={onSubmitInterest}>
              <input
                maxLength={60}
                onChange={(e) => onInterestNameChange(e.target.value)}
                placeholder={t("events.interestNameLabel")}
                required
                value={interestName}
              />
              <button className="secondary-button" disabled={busy} type="submit">
                {t("events.interestSave")}
              </button>
            </form>
          ) : (
            <button className="secondary-button" onClick={onOpenInterest} type="button">
              {t("events.interestedButton")}
            </button>
          )}
        </div>
      ) : null}

      {scheduled ? (
        <div className="event-actions">
          <button
            className={hero ? "primary-button" : "secondary-button"}
            onClick={() => onCopy(buildInviteMessage(event))}
            type="button"
          >
            <ClipboardCopy size={16} aria-hidden="true" />
            {t("events.copyInvite")}
          </button>
          <a
            className={hero ? "primary-button" : "secondary-button"}
            href={whatsAppShareUrl(buildInviteMessage(event))}
            rel="noreferrer"
            target="_blank"
          >
            <Share2 size={16} aria-hidden="true" />
            {t("events.shareWhatsApp")}
          </a>
        </div>
      ) : null}

      {hostMode ? (
        <div className="event-actions host-actions">
          <button className="secondary-button" disabled={busy} onClick={onEdit} type="button">
            {t("events.editButton")}
          </button>
          {scheduled ? (
            <>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={onCancelEvent}
                type="button"
              >
                {t("events.cancelEventButton")}
              </button>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={onCompleteEvent}
                type="button"
              >
                {t("events.completeEventButton")}
              </button>
              <button
                className="secondary-button"
                onClick={() => onCopy(buildReminderMessage(event))}
                type="button"
              >
                {t("events.copyReminder")}
              </button>
              <button
                className="secondary-button"
                onClick={() => onCopy(buildUpdateMessage(event))}
                type="button"
              >
                {t("events.copyUpdateMsg")}
              </button>
            </>
          ) : null}
          {event.status === "cancelled" ? (
            <button
              className="secondary-button"
              onClick={() => onCopy(buildCancellationMessage(event))}
              type="button"
            >
              {t("events.copyCancelMsg")}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

type EventFormProps = {
  initial: EventDraft;
  isNew: boolean;
  busy: boolean;
  onSubmit: (draft: EventDraft) => void;
  onClose: () => void;
};

function EventForm({ initial, isNew, busy, onSubmit, onClose }: EventFormProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(initial);
  const set = (patch: Partial<EventDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const statusOptions = Array.from(
    new Set<HostEventStatus>(["draft", "scheduled", draft.status])
  );

  return (
    <form
      className="event-form"
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        onSubmit(draft);
      }}
    >
      <section className="panel form-panel">
        <h2>{t(isNew ? "events.formCreateHeading" : "events.formEditHeading")}</h2>
        <label>
          <span>{t("events.formTitle")}</span>
          <input
            maxLength={120}
            onChange={(e) => set({ title: e.target.value })}
            required
            value={draft.title}
          />
        </label>
        <label>
          <span>{t("events.formEventType")}</span>
          <input
            maxLength={60}
            onChange={(e) => set({ event_type: e.target.value })}
            required
            value={draft.event_type}
          />
        </label>
        <label>
          <span>{t("events.formFormat")}</span>
          <input
            maxLength={80}
            onChange={(e) => set({ format: e.target.value })}
            required
            value={draft.format}
          />
        </label>
        <label>
          <span>{t("events.formDate")}</span>
          <input
            onChange={(e) => set({ date: e.target.value })}
            required
            type="date"
            value={draft.date}
          />
        </label>
      </section>

      <section className="panel form-panel two-column-fields">
        <label>
          <span>{t("events.formStart")}</span>
          <input
            onChange={(e) => set({ startTime: e.target.value })}
            required
            type="time"
            value={draft.startTime}
          />
        </label>
        <label>
          <span>{t("events.formEnd")}</span>
          <input
            onChange={(e) => set({ endTime: e.target.value })}
            required
            type="time"
            value={draft.endTime}
          />
        </label>
        <label>
          <span>{t("events.formVenue")}</span>
          <input
            maxLength={120}
            onChange={(e) => set({ venue_name: e.target.value })}
            required
            value={draft.venue_name}
          />
        </label>
        <label>
          <span>{t("events.formVenueNote")}</span>
          <input
            maxLength={160}
            onChange={(e) => set({ venue_note: e.target.value })}
            value={draft.venue_note}
          />
        </label>
        <label>
          <span>{t("events.formHostName")}</span>
          <input
            maxLength={60}
            onChange={(e) => set({ host_name: e.target.value })}
            required
            value={draft.host_name}
          />
        </label>
        <label>
          <span>{t("events.formBoardCount")}</span>
          <input
            inputMode="numeric"
            min={0}
            onChange={(e) => set({ board_count: e.target.value })}
            required
            type="number"
            value={draft.board_count}
          />
        </label>
        <label>
          <span>{t("events.formCapacity")}</span>
          <input
            inputMode="numeric"
            min={1}
            onChange={(e) => set({ player_capacity: e.target.value })}
            type="number"
            value={draft.player_capacity}
          />
        </label>
      </section>

      <section className="panel form-section">
        <span className="field-label">{t("events.formStatus")}</span>
        <div className={`choice-grid ${statusOptions.length === 3 ? "three" : "two"}`}>
          {statusOptions.map((status) => (
            <button
              className={draft.status === status ? "choice-button active" : "choice-button"}
              key={status}
              onClick={() => set({ status })}
              type="button"
            >
              {t(`events.status.${status}`)}
            </button>
          ))}
        </div>
        <div className="choice-grid two">
          <button
            className={draft.beginner_friendly ? "choice-button active" : "choice-button"}
            onClick={() => set({ beginner_friendly: !draft.beginner_friendly })}
            type="button"
          >
            {t("events.beginnerFriendly")}
          </button>
          <button
            className={draft.demo_available ? "choice-button active" : "choice-button"}
            onClick={() => set({ demo_available: !draft.demo_available })}
            type="button"
          >
            {t("events.demoAvailable")}
          </button>
        </div>
      </section>

      <section className="panel form-panel">
        <label>
          <span>{t("events.formDescription")}</span>
          <textarea
            maxLength={600}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            value={draft.description}
          />
        </label>
        <label>
          <span>{t("events.formWhatToBring")}</span>
          <input
            maxLength={200}
            onChange={(e) => set({ what_to_bring: e.target.value })}
            value={draft.what_to_bring}
          />
        </label>
        <label>
          <span>{t("events.formPrizeNote")}</span>
          <input
            maxLength={200}
            onChange={(e) => set({ prize_note: e.target.value })}
            value={draft.prize_note}
          />
        </label>
        <label>
          <span>{t("events.formWhatsappNote")}</span>
          <input
            maxLength={300}
            onChange={(e) => set({ whatsapp_note: e.target.value })}
            value={draft.whatsapp_note}
          />
        </label>
      </section>

      <div className="event-actions">
        <button className="primary-button" disabled={busy} type="submit">
          {t("events.formSave")}
        </button>
        <button className="secondary-button" onClick={onClose} type="button">
          {t("events.formBack")}
        </button>
      </div>
    </form>
  );
}

export default function HostEventBoardPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<HostEventRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hostPin, setHostPin] = useState(
    () => window.sessionStorage.getItem(HOST_PIN_STORAGE_KEY) ?? ""
  );
  const [pinDraft, setPinDraft] = useState("");
  const [editing, setEditing] = useState<HostEventRecord | "new" | null>(null);
  const [createdEvent, setCreatedEvent] = useState<HostEventRecord | null>(null);
  const [interestFormId, setInterestFormId] = useState<string | null>(null);
  const [interestName, setInterestName] = useState(
    () => window.localStorage.getItem(INTEREST_NAME_KEY) ?? ""
  );
  const [interestedIds, setInterestedIds] = useState<string[]>(readInterestedIds);
  const hostMode = Boolean(hostPin);

  async function load() {
    try {
      setLoading(true);
      setEvents(await fetchHostEvents(hostPin || undefined));
      setErrorKey(null);
    } catch (error) {
      const key = error instanceof Error ? error.message : "companion.error.load";
      if (key === "status.hostPinInvalid" && hostPin) {
        // Stale PIN from an earlier session; drop to public view and re-run.
        window.sessionStorage.removeItem(HOST_PIN_STORAGE_KEY);
        setHostPin("");
        return;
      }
      setErrorKey(key);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [hostPin]);

  const list = events ?? [];
  const now = Date.now();
  const scheduled = list.filter((event) => event.status === "scheduled");
  const nextEvent = scheduled.find((event) => new Date(event.end_at).getTime() >= now) ?? null;
  const groups = {
    nextEvent,
    upcoming: scheduled.filter((event) => event !== nextEvent),
    past: list
      .filter((event) => event.status === "completed")
      .sort((a, b) => b.start_at.localeCompare(a.start_at)),
    cancelled: list
      .filter((event) => event.status === "cancelled")
      .sort((a, b) => b.start_at.localeCompare(a.start_at)),
    drafts: list.filter((event) => event.status === "draft")
  };

  function flashStatus(key: string) {
    setStatusKey(key);
    window.setTimeout(() => setStatusKey((current) => (current === key ? null : current)), 3000);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flashStatus("events.copied");
    } catch {
      flashStatus("status.copyFailed");
    }
  }

  async function handlePinSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const pin = pinDraft.trim();
    if (!pin) return;

    try {
      setBusy(true);
      if (!(await verifyHostPin(pin))) {
        setErrorKey("status.hostPinInvalid");
        return;
      }
      window.sessionStorage.setItem(HOST_PIN_STORAGE_KEY, pin);
      setHostPin(pin);
      setPinDraft("");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setBusy(false);
    }
  }

  function exitHostMode() {
    window.sessionStorage.removeItem(HOST_PIN_STORAGE_KEY);
    setHostPin("");
    setEditing(null);
    setCreatedEvent(null);
  }

  async function hostSave(payload: EventPayload) {
    try {
      setBusy(true);
      const saved = await saveHostEvent(hostPin, payload);
      await load();
      return saved;
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleFormSubmit(draft: EventDraft) {
    if (draft.endTime <= draft.startTime) {
      setErrorKey("events.timeError");
      return;
    }

    const isNew = editing === "new";
    const timezone = isNew || editing === null ? HOST_EVENT_DEFAULTS.timezone : editing.timezone;
    const payload: EventPayload = {
      ...(isNew || editing === null ? {} : eventPayload(editing)),
      title: draft.title.trim(),
      event_type: draft.event_type.trim(),
      format: draft.format.trim(),
      venue_name: draft.venue_name.trim(),
      venue_note: draft.venue_note.trim() || null,
      host_name: draft.host_name.trim(),
      start_at: zonedInputToIso(draft.date, draft.startTime, timezone),
      end_at: zonedInputToIso(draft.date, draft.endTime, timezone),
      timezone,
      status: draft.status,
      beginner_friendly: draft.beginner_friendly,
      demo_available: draft.demo_available,
      board_count: Number(draft.board_count) || 0,
      player_capacity: draft.player_capacity ? Number(draft.player_capacity) : null,
      description: draft.description.trim() || null,
      what_to_bring: draft.what_to_bring.trim() || null,
      prize_note: draft.prize_note.trim() || null,
      whatsapp_note: draft.whatsapp_note.trim() || null
    };

    const saved = await hostSave(payload);
    if (!saved) return;

    setEditing(null);
    setErrorKey(null);
    if (isNew) {
      setCreatedEvent(saved);
    } else {
      flashStatus("events.updatedStatus");
    }
  }

  async function handleCancelEvent(event: HostEventRecord) {
    const reason = window.prompt(t("events.cancelReasonPrompt"))?.trim();
    if (reason === undefined) return;
    if (!reason) {
      setErrorKey("events.cancelReasonRequired");
      return;
    }
    await hostSave({ ...eventPayload(event), status: "cancelled", cancelled_reason: reason });
  }

  async function handleCompleteEvent(event: HostEventRecord) {
    const summary = window.prompt(t("events.completeSummaryPrompt"), "");
    if (summary === null) return;
    await hostSave({
      ...eventPayload(event),
      status: "completed",
      completed_summary: summary.trim() || null
    });
  }

  async function handleInterestSubmit(formEvent: FormEvent, event: HostEventRecord) {
    formEvent.preventDefault();
    const name = interestName.trim();
    if (!name) return;

    try {
      setBusy(true);
      await addEventInterest(event.id, name);
      window.localStorage.setItem(INTEREST_NAME_KEY, name);
      const ids = [...interestedIds, event.id];
      setInterestedIds(ids);
      window.localStorage.setItem(INTEREST_IDS_KEY, JSON.stringify(ids));
      setEvents(
        (current) =>
          current?.map((item) =>
            item.id === event.id
              ? { ...item, interested_count: item.interested_count + 1 }
              : item
          ) ?? current
      );
      setInterestFormId(null);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "companion.error.save");
    } finally {
      setBusy(false);
    }
  }

  function viewPublicEvent() {
    const id = createdEvent?.id;
    setCreatedEvent(null);
    window.setTimeout(() => {
      document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function renderCard(event: HostEventRecord, hero = false) {
    return (
      <EventCard
        busy={busy}
        event={event}
        hero={hero}
        hostMode={hostMode}
        interested={interestedIds.includes(event.id)}
        interestFormOpen={interestFormId === event.id}
        interestName={interestName}
        key={event.id}
        onCancelEvent={() => void handleCancelEvent(event)}
        onCompleteEvent={() => void handleCompleteEvent(event)}
        onCopy={(text) => void copyText(text)}
        onEdit={() => setEditing(event)}
        onInterestNameChange={setInterestName}
        onOpenInterest={() => setInterestFormId(event.id)}
        onSubmitInterest={(e) => void handleInterestSubmit(e, event)}
      />
    );
  }

  function renderGroup(headingKey: string, list: HostEventRecord[]) {
    if (list.length === 0) return null;
    return (
      <section className="event-group">
        <div className="section-heading">
          <h2>{t(headingKey)}</h2>
        </div>
        <div className="card-list">{list.map((event) => renderCard(event))}</div>
      </section>
    );
  }

  return (
    <main className="app-shell page-with-nav event-board">
      <AppHeader />

      <section className="page-intro panel">
        <CalendarDays size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("events.boardLabel")}</p>
          <h1>{t("events.heading")}</h1>
          <p className="muted">{t("events.subtitle")}</p>
        </div>
      </section>

      {!hostMode ? (
        <details className="panel host-gate">
          <summary>
            <KeyRound size={16} aria-hidden="true" />
            {t("events.hostModeHeading")}
          </summary>
          <form className="form-panel host-gate-form" onSubmit={handlePinSubmit}>
            <p className="muted">{t("events.hostModeIntro")}</p>
            <label>
              <span>{t("host.pinLabel")}</span>
              <input
                autoComplete="off"
                onChange={(e) => setPinDraft(e.target.value)}
                placeholder={t("host.pinPlaceholder")}
                type="password"
                value={pinDraft}
              />
            </label>
            <button className="secondary-button" disabled={busy} type="submit">
              {t("events.hostUnlock")}
            </button>
          </form>
        </details>
      ) : (
        <section className="panel host-gate open">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("events.hostModeHeading")}</p>
              <h2>{t("events.hostToolsHeading")}</h2>
            </div>
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <div className="event-actions">
            <button
              className="primary-button"
              onClick={() => {
                setCreatedEvent(null);
                setEditing("new");
              }}
              type="button"
            >
              <Plus size={16} aria-hidden="true" />
              {t("events.newEvent")}
            </button>
            <button className="secondary-button" onClick={exitHostMode} type="button">
              {t("events.hostExit")}
            </button>
            <Link className="secondary-button" to="/host/card-help">
              {t("cardHelp.hostHeading")}
            </Link>
          </div>
        </section>
      )}

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
      {statusKey ? <p className="status-line">{t(statusKey)}</p> : null}

      {createdEvent ? (
        <section className="panel form-panel created-panel">
          <h2>{t("events.createdHeading")}</h2>
          <p className="muted">{t("events.createdBody")}</p>
          <pre className="msg-preview">{buildInviteMessage(createdEvent)}</pre>
          <div className="event-actions">
            <button
              className="primary-button"
              onClick={() => void copyText(buildInviteMessage(createdEvent))}
              type="button"
            >
              <ClipboardCopy size={16} aria-hidden="true" />
              {t("events.copyInvite")}
            </button>
            <a
              className="primary-button"
              href={whatsAppShareUrl(buildInviteMessage(createdEvent))}
              rel="noreferrer"
              target="_blank"
            >
              <Share2 size={16} aria-hidden="true" />
              {t("events.shareWhatsApp")}
            </a>
          </div>
          <div className="event-actions">
            <button className="secondary-button" onClick={viewPublicEvent} type="button">
              {t("events.viewPublic")}
            </button>
            <button
              className="secondary-button"
              onClick={() => setCreatedEvent(null)}
              type="button"
            >
              {t("events.backToBoard")}
            </button>
          </div>
        </section>
      ) : editing ? (
        <EventForm
          busy={busy}
          initial={draftFromEvent(editing === "new" ? null : editing)}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
          onSubmit={(draft) => void handleFormSubmit(draft)}
        />
      ) : (
        <>
          {groups.nextEvent ? (
            renderCard(groups.nextEvent, true)
          ) : !loading && !errorKey ? (
            <section className="panel empty-state">
              <CalendarDays size={28} aria-hidden="true" />
              <p>{t("events.noUpcoming")}</p>
            </section>
          ) : null}

          {hostMode ? renderGroup("events.draftsHeading", groups.drafts) : null}
          {renderGroup("events.upcomingHeading", groups.upcoming)}
          {renderGroup("events.pastHeading", groups.past)}
          {renderGroup("events.cancelledHeading", groups.cancelled)}
        </>
      )}

      <BottomNav />
    </main>
  );
}
