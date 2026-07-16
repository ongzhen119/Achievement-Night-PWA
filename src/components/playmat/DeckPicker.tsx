import { useState } from "react";
import { Eye } from "lucide-react";
import { catalogCards } from "../../data/playmat/catalog";
import { rivalsDecks, PlaymatRivalsDeckDef } from "../../data/playmat/rivalsDecks";
import { useLanguage } from "../../i18n/useLanguage";
import { formatText } from "../../utils/format";
import CardTile from "./CardTile";
import PlaymatModal from "./PlaymatModal";

interface RivalsDeckPickerProps {
  value: string | null;
  onChange: (deckId: string) => void;
  disabled?: boolean;
}

/** Pick one of the four fixed Rivals decks (used by Rivals format), with preview. */
export default function RivalsDeckPicker({ value, onChange, disabled }: RivalsDeckPickerProps) {
  const { t } = useLanguage();
  const [previewDeck, setPreviewDeck] = useState<PlaymatRivalsDeckDef | null>(null);
  const previewCards = previewDeck
    ? catalogCards.filter((card) => card.deckId === previewDeck.id)
    : [];

  return (
    <div className="deck-picker">
      {rivalsDecks.map((deck) => {
        const selected = deck.id === value;
        return (
          <div className={`deck-option${selected ? " selected" : ""}`} key={deck.id}>
            <button
              className="deck-option-main"
              disabled={disabled}
              onClick={() => onChange(deck.id)}
              type="button"
            >
              <strong>{deck.name}</strong>
              <small>{formatText(t("playmat.cardCount"), { cards: deck.cards.length })}</small>
            </button>
            <button
              aria-label={t("playmat.previewDeck")}
              className="icon-button"
              onClick={() => setPreviewDeck(deck)}
              type="button"
            >
              <Eye size={18} aria-hidden="true" />
            </button>
          </div>
        );
      })}

      {previewDeck ? (
        <PlaymatModal onClose={() => setPreviewDeck(null)} title={previewDeck.name} wide>
          <div className="pile-grid">
            {previewCards.map((card) => (
              <CardTile card={card} key={card.uid} size="md" />
            ))}
          </div>
        </PlaymatModal>
      ) : null}
    </div>
  );
}
