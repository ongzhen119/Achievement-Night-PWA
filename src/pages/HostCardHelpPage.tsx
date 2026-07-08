import { BookOpenCheck, KeyRound, Plus, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import {
  CARD_HELP_FORMATS,
  CARD_HELP_TAGS,
  CardHelpEntry,
  CardHelpPayload,
  deleteCardHelpEntry,
  fetchCardHelpEntries,
  filterCardHelpEntries,
  saveCardHelpEntry
} from "../utils/cardHelp";
import { HOST_PIN_STORAGE_KEY, verifyHostPin } from "../utils/hostEvents";

type Draft = CardHelpPayload;

const emptyDraft: Draft = {
  card_name: "",
  chinese_summary: "",
  timing: "",
  beginner_tip: null,
  tags: [],
  warband_name: null,
  deck_name: null,
  format: "Unknown",
  is_public: false
};

function draftFromEntry(entry: CardHelpEntry): Draft {
  const { created_at: _created, updated_at: _updated, ...draft } = entry;
  return draft;
}

function CardHelpForm({
  busy,
  initial,
  onClose,
  onSubmit
}: {
  busy: boolean;
  initial: Draft;
  onClose: () => void;
  onSubmit: (draft: Draft) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(initial);
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  function toggleTag(tag: (typeof CARD_HELP_TAGS)[number]) {
    set({
      tags: draft.tags.includes(tag)
        ? draft.tags.filter((item) => item !== tag)
        : [...draft.tags, tag]
    });
  }

  return (
    <form
      className="panel form-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <h2>{draft.id ? t("cardHelp.editHeading") : t("cardHelp.addHeading")}</h2>
      <label>
        <span>{t("cardHelp.cardName")}</span>
        <input
          maxLength={120}
          onChange={(event) => set({ card_name: event.target.value })}
          required
          value={draft.card_name}
        />
      </label>
      <label>
        <span>{t("cardHelp.summary")}</span>
        <textarea
          maxLength={500}
          onChange={(event) => set({ chinese_summary: event.target.value })}
          required
          rows={4}
          value={draft.chinese_summary}
        />
      </label>
      <label>
        <span>{t("cardHelp.timing")}</span>
        <textarea
          onChange={(event) => set({ timing: event.target.value })}
          required
          rows={3}
          value={draft.timing}
        />
      </label>
      <label>
        <span>{t("cardHelp.beginnerTipOptional")}</span>
        <textarea
          maxLength={300}
          onChange={(event) => set({ beginner_tip: event.target.value })}
          rows={3}
          value={draft.beginner_tip ?? ""}
        />
      </label>
      <div className="form-section">
        <span className="field-label">{t("cardHelp.tags")}</span>
        <div className="tag-filter">
          {CARD_HELP_TAGS.map((tag) => (
            <button
              className={draft.tags.includes(tag) ? "choice-button active" : "choice-button"}
              key={tag}
              onClick={() => toggleTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="two-column-fields">
        <label>
          <span>{t("cardHelp.warbandOptional")}</span>
          <input
            maxLength={120}
            onChange={(event) => set({ warband_name: event.target.value })}
            value={draft.warband_name ?? ""}
          />
        </label>
        <label>
          <span>{t("cardHelp.deckOptional")}</span>
          <input
            maxLength={120}
            onChange={(event) => set({ deck_name: event.target.value })}
            value={draft.deck_name ?? ""}
          />
        </label>
      </div>
      <div className="two-column-fields">
        <label>
          <span>{t("cardHelp.format")}</span>
          <select
            className="app-select"
            onChange={(event) => set({ format: event.target.value as Draft["format"] })}
            value={draft.format}
          >
            {CARD_HELP_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-line">
          <input
            checked={draft.is_public}
            onChange={(event) => set({ is_public: event.target.checked })}
            type="checkbox"
          />
          <span>{t("cardHelp.publicField")}</span>
        </label>
      </div>
      <div className="event-actions">
        <button className="primary-button" disabled={busy} type="submit">
          {t("cardHelp.save")}
        </button>
        <button className="secondary-button" onClick={onClose} type="button">
          {t("events.formBack")}
        </button>
      </div>
    </form>
  );
}

export default function HostCardHelpPage() {
  const { t } = useLanguage();
  const [hostPin, setHostPin] = useState(
    () => window.sessionStorage.getItem(HOST_PIN_STORAGE_KEY) ?? ""
  );
  const [pinDraft, setPinDraft] = useState("");
  const [entries, setEntries] = useState<CardHelpEntry[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const hostMode = Boolean(hostPin);

  async function load(pin = hostPin) {
    if (!pin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setEntries(await fetchCardHelpEntries(pin));
      setErrorKey(null);
    } catch (error) {
      const key = error instanceof Error ? error.message : "companion.error.load";
      if (key === "status.hostPinInvalid") {
        window.sessionStorage.removeItem(HOST_PIN_STORAGE_KEY);
        setHostPin("");
      }
      setErrorKey(key);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [hostPin]);

  async function handlePinSubmit(event: FormEvent) {
    event.preventDefault();
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

  async function handleSave(draft: Draft) {
    if (draft.tags.length === 0) {
      setErrorKey("cardHelp.tagsRequired");
      return;
    }

    try {
      setBusy(true);
      await saveCardHelpEntry(hostPin, {
        ...draft,
        card_name: draft.card_name.trim(),
        chinese_summary: draft.chinese_summary.trim(),
        timing: draft.timing.trim(),
        beginner_tip: draft.beginner_tip?.trim() || null,
        warband_name: draft.warband_name?.trim() || null,
        deck_name: draft.deck_name?.trim() || null
      });
      await load();
      setEditing(null);
      setStatusKey("cardHelp.saved");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "companion.error.save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(entry: CardHelpEntry) {
    if (!window.confirm(t("cardHelp.confirmDelete"))) return;

    try {
      setBusy(true);
      await deleteCardHelpEntry(hostPin, entry.id);
      await load();
      setStatusKey("cardHelp.deleted");
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "status.hostActionError");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic(entry: CardHelpEntry) {
    await handleSave({ ...draftFromEntry(entry), is_public: !entry.is_public });
  }

  const visible = filterCardHelpEntries(entries, query, tag).filter((entry) => {
    if (filter === "public") return entry.is_public;
    if (filter === "hidden") return !entry.is_public;
    return true;
  });

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />
      <section className="page-intro panel">
        <BookOpenCheck size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("cardHelp.hostLabel")}</p>
          <h1>{t("cardHelp.hostHeading")}</h1>
          <p className="muted">{t("cardHelp.hostSubtitle")}</p>
        </div>
      </section>

      {!hostMode ? (
        <form className="panel form-panel" onSubmit={handlePinSubmit}>
          <h2>{t("events.hostModeHeading")}</h2>
          <p className="muted">{t("events.hostModeIntro")}</p>
          <label>
            <span>{t("host.pinLabel")}</span>
            <input
              autoComplete="off"
              onChange={(event) => setPinDraft(event.target.value)}
              placeholder={t("host.pinPlaceholder")}
              type="password"
              value={pinDraft}
            />
          </label>
          <button className="primary-button" disabled={busy} type="submit">
            <KeyRound size={16} aria-hidden="true" />
            {t("events.hostUnlock")}
          </button>
          {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
        </form>
      ) : editing ? (
        <>
          <CardHelpForm
            busy={busy}
            initial={editing}
            onClose={() => setEditing(null)}
            onSubmit={(draft) => void handleSave(draft)}
          />
          {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
        </>
      ) : (
        <>
          <section className="panel form-panel">
            <div className="event-actions">
              <button
                className="primary-button"
                onClick={() => setEditing({ ...emptyDraft })}
                type="button"
              >
                <Plus size={16} aria-hidden="true" />
                {t("cardHelp.addButton")}
              </button>
              <Link className="secondary-button" to="/card-help">
                {t("cardHelp.viewPublic")}
              </Link>
            </div>
            <label>
              <span>{t("cardHelp.search")}</span>
              <span className="card-help-search">
                <Search size={18} aria-hidden="true" />
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("cardHelp.searchPlaceholder")}
                  value={query}
                />
              </span>
            </label>
            <select
              className="app-select"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              <option value="all">{t("cardHelp.allEntries")}</option>
              <option value="public">{t("cardHelp.publicOnly")}</option>
              <option value="hidden">{t("cardHelp.hiddenOnly")}</option>
            </select>
            <div className="tag-filter">
              <button
                className={!tag ? "choice-button active" : "choice-button"}
                onClick={() => setTag("")}
                type="button"
              >
                {t("cardHelp.allTags")}
              </button>
              {CARD_HELP_TAGS.map((item) => (
                <button
                  className={tag === item ? "choice-button active" : "choice-button"}
                  key={item}
                  onClick={() => setTag(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {loading ? <p className="status-line">{t("common.loading")}</p> : null}
          {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
          {statusKey ? <p className="status-line">{t(statusKey)}</p> : null}

          <section className="card-list">
            {visible.map((entry) => (
              <article className="card-help-card" key={entry.id}>
                <div className="card-help-title">
                  <div>
                    <h2>{entry.card_name}</h2>
                    <p className="muted">
                      {entry.warband_name || "-"} · {entry.format}
                    </p>
                  </div>
                  <span className={`event-status-tag ${entry.is_public ? "draft" : "completed"}`}>
                    {entry.is_public ? t("cardHelp.publicStatus") : t("cardHelp.hiddenStatus")}
                  </span>
                </div>
                <div className="event-badge-row">
                  {entry.tags.map((item) => (
                    <span className="event-badge gold" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <p>{entry.chinese_summary}</p>
                <div className="event-actions">
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => setEditing(draftFromEntry(entry))}
                    type="button"
                  >
                    {t("events.editButton")}
                  </button>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => void togglePublic(entry)}
                    type="button"
                  >
                    {entry.is_public ? t("cardHelp.hide") : t("cardHelp.publish")}
                  </button>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => void handleDelete(entry)}
                    type="button"
                  >
                    {t("host.deleteButton")}
                  </button>
                </div>
              </article>
            ))}
          </section>

          {!loading && visible.length === 0 ? (
            <p className="empty-state">{t("cardHelp.hostEmpty")}</p>
          ) : null}
        </>
      )}
      <BottomNav />
    </main>
  );
}
