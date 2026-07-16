import { useCallback, useEffect, useState } from "react";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import PlayerSelect from "../components/playmat/PlayerSelect";
import { getRivalsDeck } from "../data/playmat/rivalsDecks";
import { useLanguage } from "../i18n/useLanguage";
import { CommunityPlayer, fetchCommunityData } from "../utils/communityData";
import { getSelectedPlayerId } from "../utils/communityProfile";
import { formatText } from "../utils/format";
import {
  CustomDeckRecord,
  deleteCustomDeck,
  draftFromRecord,
  duplicateCustomDeck,
  fetchCustomDecks
} from "../utils/playmat/customDecks";
import { validateNemesisDeck } from "../utils/playmat/deckRules";
import { isSupabaseConfigured } from "../utils/supabase";

export default function PlaymatDecksPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(getSelectedPlayerId());
  const [decks, setDecks] = useState<CustomDeckRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reloadPlayers = useCallback(async () => {
    const data = await fetchCommunityData();
    setPlayers(data.players);
  }, []);

  const reloadDecks = useCallback(async (owner: string) => {
    setLoading(true);
    setErrorKey(null);
    try {
      setDecks(await fetchCustomDecks(owner));
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.loadDecks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    void reloadPlayers().catch(() => setErrorKey("playmat.error.loadDecks"));
  }, [reloadPlayers]);

  useEffect(() => {
    if (playerId) {
      void reloadDecks(playerId);
    } else {
      setDecks([]);
    }
  }, [playerId, reloadDecks]);

  const handleDuplicate = async (deck: CustomDeckRecord) => {
    if (!playerId) {
      return;
    }

    try {
      await duplicateCustomDeck(deck, t("playmat.copySuffix"));
      await reloadDecks(playerId);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.saveDeck");
    }
  };

  const handleDelete = async (deck: CustomDeckRecord) => {
    if (!playerId || !window.confirm(t("playmat.confirmDeleteDeck"))) {
      return;
    }

    try {
      await deleteCustomDeck(deck.id);
      await reloadDecks(playerId);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.deleteDeck");
    }
  };

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />

      <section className="panel playmat-form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("playmat.deckBuilderLabel")}</p>
            <h1>{t("playmat.myDecksTitle")}</h1>
          </div>
          <Layers size={22} aria-hidden="true" />
        </div>
        <p className="panel-copy">{t("playmat.myDecksIntro")}</p>

        {!isSupabaseConfigured ? (
          <p className="error-line">{t("status.supabaseMissing")}</p>
        ) : null}

        <label className="field-label">{t("playmat.playerLabel")}</label>
        <PlayerSelect
          onChange={setPlayerId}
          onCreated={() => void reloadPlayers()}
          players={players}
          value={playerId}
        />
      </section>

      {playerId ? (
        <>
          <button
            className="primary-button"
            onClick={() => navigate("/playmat/decks/new")}
            type="button"
          >
            <Plus size={18} aria-hidden="true" /> {t("playmat.newDeck")}
          </button>

          {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
          {loading ? <p className="status-line">{t("common.loading")}</p> : null}

          {!loading && decks.length === 0 ? (
            <div className="empty-state">
              <Layers size={28} aria-hidden="true" />
              <p>{t("playmat.noDecks")}</p>
            </div>
          ) : null}

          <div className="card-list">
            {decks.map((deck) => {
              const validation = validateNemesisDeck(draftFromRecord(deck));
              const sources = (deck.source_deck_ids ?? [])
                .map((id) => getRivalsDeck(id)?.name ?? id)
                .join(" + ");

              return (
                <article className="panel deck-summary-card" key={deck.id}>
                  <div className="deck-summary-head">
                    <div>
                      <h2>{deck.name}</h2>
                      <small>{sources || t("playmat.noSources")}</small>
                    </div>
                    <span
                      className={`deck-legal-badge ${validation.legal ? "legal" : "illegal"}`}
                    >
                      {validation.legal ? t("playmat.legal") : t("playmat.illegal")}
                    </span>
                  </div>
                  <p className="deck-summary-counts">
                    {formatText(t("playmat.deckCounts"), {
                      objectives: validation.objectiveCount,
                      power: validation.powerCount
                    })}
                  </p>
                  <div className="deck-summary-actions">
                    <button
                      className="ghost-button"
                      onClick={() => navigate(`/playmat/decks/${deck.id}`)}
                      type="button"
                    >
                      {t("playmat.editDeck")}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t("playmat.duplicateDeck")}
                      onClick={() => void handleDuplicate(deck)}
                      type="button"
                    >
                      <Copy size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={t("playmat.deleteDeck")}
                      onClick={() => void handleDelete(deck)}
                      type="button"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <p className="status-line">{t("playmat.selectPlayerForDecks")}</p>
      )}

      <Link className="ghost-button" to="/playmat">
        {t("playmat.backToLobby")}
      </Link>

      <BottomNav />
    </main>
  );
}
