import { BookOpenCheck, Search } from "lucide-react";
import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import {
  CARD_HELP_TAGS,
  CardHelpEntry,
  fetchCardHelpEntries,
  filterCardHelpEntries
} from "../utils/cardHelp";

function CardHelpCard({ entry }: { entry: CardHelpEntry }) {
  const { t } = useLanguage();

  return (
    <article className="card-help-card">
      <div className="card-help-title">
        <h2>{entry.card_name}</h2>
        <span className="event-status-tag">{entry.format}</span>
      </div>
      <div className="event-badge-row">
        {entry.tags.map((tag) => (
          <span className="event-badge gold" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <section>
        <h3>{t("cardHelp.summary")}</h3>
        <p>{entry.chinese_summary}</p>
      </section>
      <section>
        <h3>{t("cardHelp.timing")}</h3>
        <p>{entry.timing}</p>
      </section>
      {entry.beginner_tip ? (
        <section>
          <h3>{t("cardHelp.beginnerTip")}</h3>
          <p>{entry.beginner_tip}</p>
        </section>
      ) : null}
      <p className="muted card-help-meta">
        {entry.warband_name ? `${t("cardHelp.warband")}: ${entry.warband_name}` : null}
        {entry.warband_name && entry.deck_name ? " · " : null}
        {entry.deck_name ? `${t("cardHelp.deck")}: ${entry.deck_name}` : null}
      </p>
    </article>
  );
}

export default function CardHelpPage() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<CardHelpEntry[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setEntries(await fetchCardHelpEntries());
        setErrorKey(null);
      } catch (error) {
        setErrorKey(error instanceof Error ? error.message : "companion.error.load");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = filterCardHelpEntries(entries, query, tag);

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />
      <section className="page-intro panel">
        <BookOpenCheck size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("cardHelp.label")}</p>
          <h1>{t("cardHelp.heading")}</h1>
          <p className="muted">{t("cardHelp.subtitle")}</p>
        </div>
      </section>

      <section className="panel form-panel">
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

      <section className="card-list">
        {filtered.map((entry) => (
          <CardHelpCard entry={entry} key={entry.id} />
        ))}
      </section>

      {!loading && entries.length === 0 ? (
        <p className="empty-state">{t("cardHelp.empty")}</p>
      ) : null}
      {!loading && entries.length > 0 && filtered.length === 0 ? (
        <p className="empty-state">{t("cardHelp.noResults")}</p>
      ) : null}

      <p className="warning-line">{t("cardHelp.disclaimer")}</p>
      <BottomNav />
    </main>
  );
}
