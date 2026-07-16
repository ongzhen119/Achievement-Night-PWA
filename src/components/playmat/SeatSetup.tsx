import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/useLanguage";
import { CommunityPlayer, fetchCommunityData } from "../../utils/communityData";
import { getSelectedPlayerId } from "../../utils/communityProfile";
import {
  CustomDeckRecord,
  draftFromRecord,
  fetchCustomDecks
} from "../../utils/playmat/customDecks";
import { validateNemesisDeck } from "../../utils/playmat/deckRules";
import { SeatSpec } from "../../utils/playmat/rooms";
import { PlaymatFormat } from "../../utils/playmat/types";
import DeckPicker from "./DeckPicker";
import PlayerSelect from "./PlayerSelect";
import WarbandPicker from "./WarbandPicker";

interface SeatSetupProps {
  /** Reports a complete seat, or null while incomplete. */
  onSeatChange: (seat: SeatSpec | null) => void;
}

/** Pre-join setup: choose player → warband → format → deck. */
export default function SeatSetup({ onSeatChange }: SeatSetupProps) {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(getSelectedPlayerId());
  const [warbandId, setWarbandId] = useState<string | null>(null);
  const [format, setFormat] = useState<PlaymatFormat>("rivals");
  const [rivalsDeckId, setRivalsDeckId] = useState<string | null>(null);
  const [nemesisDeckId, setNemesisDeckId] = useState<string | null>(null);
  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([]);

  const reloadPlayers = useCallback(async () => {
    const data = await fetchCommunityData();
    setPlayers(data.players);
  }, []);

  useEffect(() => {
    void reloadPlayers().catch(() => undefined);
  }, [reloadPlayers]);

  // Load the selected player's saved Nemesis decks.
  useEffect(() => {
    if (!playerId) {
      setCustomDecks([]);
      return;
    }

    let active = true;
    void fetchCustomDecks(playerId)
      .then((decks) => active && setCustomDecks(decks))
      .catch(() => active && setCustomDecks([]));

    return () => {
      active = false;
    };
  }, [playerId]);

  const deckId = format === "rivals" ? rivalsDeckId : nemesisDeckId;
  const playerName = players.find((player) => player.id === playerId)?.nickname ?? "";

  const seat = useMemo<SeatSpec | null>(() => {
    if (!playerId || !playerName || !warbandId || !deckId) {
      return null;
    }

    return {
      communityPlayerId: playerId,
      name: playerName,
      warbandId,
      format,
      deckId
    };
  }, [playerId, playerName, warbandId, deckId, format]);

  useEffect(() => {
    onSeatChange(seat);
  }, [seat, onSeatChange]);

  return (
    <div className="seat-setup">
      <div className="seat-step">
        <p className="field-label">{t("playmat.playerLabel")}</p>
        <PlayerSelect
          onChange={setPlayerId}
          onCreated={() => void reloadPlayers()}
          players={players}
          value={playerId}
        />
      </div>

      <div className="seat-step">
        <p className="field-label">{t("playmat.warbandLabel")}</p>
        <WarbandPicker onChange={setWarbandId} value={warbandId} />
      </div>

      <div className="seat-step">
        <p className="field-label">{t("playmat.formatLabel")}</p>
        <div className="format-toggle">
          <button
            className={format === "rivals" ? "active" : ""}
            onClick={() => setFormat("rivals")}
            type="button"
          >
            {t("playmat.formatRivals")}
          </button>
          <button
            className={format === "nemesis" ? "active" : ""}
            onClick={() => setFormat("nemesis")}
            type="button"
          >
            {t("playmat.formatNemesis")}
          </button>
        </div>

        {format === "rivals" ? (
          <DeckPicker onChange={setRivalsDeckId} value={rivalsDeckId} />
        ) : (
          <div className="nemesis-deck-list">
            {customDecks.length === 0 ? (
              <p className="panel-copy">{t("playmat.noNemesisDecks")}</p>
            ) : (
              customDecks.map((deck) => {
                const legal = validateNemesisDeck(draftFromRecord(deck)).legal;
                const selected = deck.id === nemesisDeckId;
                return (
                  <button
                    className={`deck-option-main nemesis-deck-option${selected ? " selected" : ""}`}
                    key={deck.id}
                    onClick={() => setNemesisDeckId(deck.id)}
                    type="button"
                  >
                    <strong>{deck.name}</strong>
                    <span className={`deck-legal-badge ${legal ? "legal" : "illegal"}`}>
                      {legal ? t("playmat.legal") : t("playmat.illegal")}
                    </span>
                  </button>
                );
              })
            )}
            <Link className="ghost-button" to="/playmat/decks">
              {t("playmat.manageDecks")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
