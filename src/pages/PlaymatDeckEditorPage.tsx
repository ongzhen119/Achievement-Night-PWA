import { useEffect, useMemo, useState } from "react";
import { Check, Info, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import CardActionModal from "../components/playmat/CardActionModal";
import CardTile from "../components/playmat/CardTile";
import PlaymatModal from "../components/playmat/PlaymatModal";
import { CatalogCard } from "../data/playmat/catalog";
import { rivalsDecks } from "../data/playmat/rivalsDecks";
import { useLanguage } from "../i18n/useLanguage";
import { getSelectedPlayerId } from "../utils/communityProfile";
import { formatText } from "../utils/format";
import {
  createCustomDeck,
  fetchCustomDeck,
  updateCustomDeck
} from "../utils/playmat/customDecks";
import {
  CustomDeckDraft,
  exportDeckCode,
  importDeckCode,
  NEMESIS_MAX_SURGE,
  NEMESIS_MIN_OBJECTIVES,
  NEMESIS_MIN_POWER,
  NEMESIS_SOURCE_DECKS,
  poolForSources,
  resolveCards,
  validateNemesisDeck
} from "../utils/playmat/deckRules";

type TypeFilter = "all" | "objective" | "gambit" | "upgrade";

export default function PlaymatDeckEditorPage() {
  const { deckId = "new" } = useParams();
  const isNew = deckId === "new";
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [ownerId, setOwnerId] = useState<string | null>(getSelectedPlayerId());
  const [name, setName] = useState("");
  const [sourceDeckIds, setSourceDeckIds] = useState<string[]>([]);
  const [objectiveUids, setObjectiveUids] = useState<string[]>([]);
  const [powerUids, setPowerUids] = useState<string[]>([]);

  const [tab, setTab] = useState<"pool" | "objectives" | "power">("pool");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [surgeOnly, setSurgeOnly] = useState(false);
  const [ployOnly, setPloyOnly] = useState(false);
  const [detail, setDetail] = useState<CatalogCard | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      return;
    }

    let active = true;
    setLoading(true);
    void fetchCustomDeck(deckId)
      .then((record) => {
        if (!active) {
          return;
        }
        if (!record) {
          setErrorKey("playmat.error.loadDecks");
          return;
        }

        setOwnerId(record.community_player_id);
        setName(record.name);
        setSourceDeckIds(record.source_deck_ids ?? []);
        setObjectiveUids(record.objective_uids ?? []);
        setPowerUids(record.power_uids ?? []);
      })
      .catch(() => active && setErrorKey("playmat.error.loadDecks"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [deckId, isNew]);

  const draft: CustomDeckDraft = useMemo(
    () => ({ name, sourceDeckIds, objectiveUids, powerUids }),
    [name, sourceDeckIds, objectiveUids, powerUids]
  );
  const validation = useMemo(() => validateNemesisDeck(draft), [draft]);
  const included = useMemo(
    () => new Set([...objectiveUids, ...powerUids]),
    [objectiveUids, powerUids]
  );

  const pool = useMemo(() => {
    const base = poolForSources(sourceDeckIds);
    const query = search.trim().toLowerCase();
    return base.filter((card) => {
      if (typeFilter !== "all" && card.type !== typeFilter) return false;
      if (surgeOnly && !card.surge) return false;
      if (ployOnly && !card.ploy) return false;
      if (query && !card.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [sourceDeckIds, search, typeFilter, surgeOnly, ployOnly]);

  const listCards = useMemo(
    () => resolveCards(tab === "objectives" ? objectiveUids : powerUids),
    [tab, objectiveUids, powerUids]
  );

  const toggleSource = (id: string) => {
    setSourceDeckIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= NEMESIS_SOURCE_DECKS) return current;
      return [...current, id];
    });
  };

  const toggleCard = (card: CatalogCard) => {
    if (card.type === "objective") {
      setObjectiveUids((current) =>
        current.includes(card.uid)
          ? current.filter((uid) => uid !== card.uid)
          : [...current, card.uid]
      );
    } else {
      setPowerUids((current) =>
        current.includes(card.uid)
          ? current.filter((uid) => uid !== card.uid)
          : [...current, card.uid]
      );
    }
  };

  const handleSave = async () => {
    if (!ownerId) {
      setErrorKey("playmat.selectPlayerForDecks");
      return;
    }
    if (busy) {
      return;
    }

    setBusy(true);
    setErrorKey(null);
    setStatusKey(null);
    try {
      if (isNew) {
        const record = await createCustomDeck(ownerId, draft);
        navigate(`/playmat/decks/${record.id}`, { replace: true });
      } else {
        await updateCustomDeck(deckId, draft);
      }
      setStatusKey("playmat.deckSaved");
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.saveDeck");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(exportDeckCode(draft));
      setStatusKey("playmat.codeCopied");
    } catch {
      setStatusKey("playmat.codeCopyFailed");
    }
  };

  const handleImport = () => {
    const imported = importDeckCode(codeInput);
    if (!imported) {
      setErrorKey("playmat.error.badCode");
      return;
    }

    setName(imported.name);
    setSourceDeckIds(imported.sourceDeckIds);
    setObjectiveUids(imported.objectiveUids);
    setPowerUids(imported.powerUids);
    setCodeInput("");
    setCodeOpen(false);
    setStatusKey("playmat.codeImported");
  };

  if (loading) {
    return (
      <main className="app-shell centered-shell">
        <p className="status-line">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="app-shell deck-editor-shell">
      <AppHeader />

      <section className="panel playmat-form-panel">
        <label className="field-label" htmlFor="deck-name">
          {t("playmat.deckNameLabel")}
        </label>
        <input
          className="text-input"
          id="deck-name"
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("playmat.deckNamePlaceholder")}
          value={name}
        />

        <p className="field-label">
          {formatText(t("playmat.sourceDecksLabel"), { max: NEMESIS_SOURCE_DECKS })}
        </p>
        <div className="source-deck-grid">
          {rivalsDecks.map((deck) => {
            const selected = sourceDeckIds.includes(deck.id);
            const disabled = !selected && sourceDeckIds.length >= NEMESIS_SOURCE_DECKS;
            return (
              <button
                className={`source-deck-chip${selected ? " selected" : ""}`}
                disabled={disabled}
                key={deck.id}
                onClick={() => toggleSource(deck.id)}
                type="button"
              >
                {selected ? <Check size={14} aria-hidden="true" /> : null}
                {deck.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`panel deck-validation ${validation.legal ? "legal" : "illegal"}`}>
        <div className="deck-validation-head">
          <span className={`deck-legal-badge ${validation.legal ? "legal" : "illegal"}`}>
            {validation.legal ? t("playmat.legal") : t("playmat.illegal")}
          </span>
          <span className="deck-validation-counts">
            {formatText(t("playmat.objectivesProgress"), {
              count: validation.objectiveCount,
              min: NEMESIS_MIN_OBJECTIVES
            })}
            {" · "}
            {formatText(t("playmat.surgeProgress"), {
              count: validation.surgeCount,
              max: NEMESIS_MAX_SURGE
            })}
          </span>
          <span className="deck-validation-counts">
            {formatText(t("playmat.powerProgress"), {
              count: validation.powerCount,
              min: NEMESIS_MIN_POWER
            })}
            {" · "}
            {formatText(t("playmat.ployProgress"), {
              count: validation.ployCount,
              max: validation.maxPloys
            })}
          </span>
        </div>
        {validation.errorKeys.length ? (
          <ul className="deck-validation-errors">
            {validation.errorKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="deck-editor-tabs">
        <button className={tab === "pool" ? "active" : ""} onClick={() => setTab("pool")} type="button">
          {t("playmat.poolTab")}
        </button>
        <button
          className={tab === "objectives" ? "active" : ""}
          onClick={() => setTab("objectives")}
          type="button"
        >
          {t("playmat.zone.objectiveDeck")} ({objectiveUids.length})
        </button>
        <button
          className={tab === "power" ? "active" : ""}
          onClick={() => setTab("power")}
          type="button"
        >
          {t("playmat.zone.powerDeck")} ({powerUids.length})
        </button>
      </div>

      {tab === "pool" ? (
        sourceDeckIds.length === 0 ? (
          <p className="status-line">{t("playmat.pickSourcesFirst")}</p>
        ) : (
          <>
            <section className="panel deck-filters">
              <input
                className="text-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("playmat.searchCards")}
                value={search}
              />
              <div className="filter-chip-row">
                {(["all", "objective", "gambit", "upgrade"] as TypeFilter[]).map((value) => (
                  <button
                    className={`filter-chip${typeFilter === value ? " active" : ""}`}
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    type="button"
                  >
                    {t(`playmat.filter.${value}`)}
                  </button>
                ))}
                <button
                  className={`filter-chip${surgeOnly ? " active" : ""}`}
                  onClick={() => setSurgeOnly((value) => !value)}
                  type="button"
                >
                  {t("playmat.surge")}
                </button>
                <button
                  className={`filter-chip${ployOnly ? " active" : ""}`}
                  onClick={() => setPloyOnly((value) => !value)}
                  type="button"
                >
                  {t("playmat.ploy")}
                </button>
              </div>
            </section>

            <div className="pile-grid deck-pool-grid">
              {pool.map((card) => (
                <div className="pool-cell" key={card.uid}>
                  <CardTile card={card} onPress={() => toggleCard(card)} size="md" />
                  {included.has(card.uid) ? (
                    <span className="pool-included">
                      <Check size={14} aria-hidden="true" />
                    </span>
                  ) : null}
                  <button
                    aria-label={t("playmat.viewCard")}
                    className="pool-info"
                    onClick={() => setDetail(card)}
                    type="button"
                  >
                    <Info size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {pool.length === 0 ? <p className="pile-empty">{t("playmat.noCardsMatch")}</p> : null}
            </div>
          </>
        )
      ) : (
        <div className="pile-grid deck-pool-grid">
          {listCards.length ? (
            listCards.map((card, index) => (
              <CardTile
                card={card}
                key={`${card.uid}-${index}`}
                onPress={() => setDetail(card)}
                size="md"
              />
            ))
          ) : (
            <p className="pile-empty">{t("playmat.deckListEmpty")}</p>
          )}
        </div>
      )}

      <footer className="deck-editor-footer">
        {statusKey ? <p className="status-line">{t(statusKey)}</p> : null}
        {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
        <div className="deck-editor-footer-actions">
          <button className="primary-button" disabled={busy} onClick={() => void handleSave()} type="button">
            <Save size={18} aria-hidden="true" /> {busy ? t("common.loading") : t("playmat.saveDeck")}
          </button>
          <button className="ghost-button" onClick={() => void handleExport()} type="button">
            {t("playmat.exportCode")}
          </button>
          <button className="ghost-button" onClick={() => setCodeOpen(true)} type="button">
            {t("playmat.importCode")}
          </button>
          <button className="ghost-button" onClick={() => navigate("/playmat/decks")} type="button">
            {t("playmat.doneEditing")}
          </button>
        </div>
      </footer>

      {detail ? (
        <CardActionModal
          actions={[
            {
              label: included.has(detail.uid)
                ? t("playmat.removeFromDeck")
                : t("playmat.addToDeck"),
              tone: included.has(detail.uid) ? "danger" : "primary",
              onPress: () => {
                toggleCard(detail);
                setDetail(null);
              }
            }
          ]}
          card={detail}
          onClose={() => setDetail(null)}
        />
      ) : null}

      {codeOpen ? (
        <PlaymatModal onClose={() => setCodeOpen(false)} title={t("playmat.importCode")}>
          <p className="playmat-sheet-subtitle">{t("playmat.importCodeHint")}</p>
          <textarea
            className="text-input code-input"
            onChange={(event) => setCodeInput(event.target.value)}
            rows={4}
            value={codeInput}
          />
          <div className="playmat-action-list">
            <button className="playmat-action primary" onClick={handleImport} type="button">
              {t("playmat.importCode")}
            </button>
          </div>
        </PlaymatModal>
      ) : null}
    </main>
  );
}
