import { getCatalogCard } from "../../data/playmat/catalog";
import { useLanguage } from "../../i18n/useLanguage";
import CardTile from "./CardTile";
import PlaymatModal from "./PlaymatModal";

interface PileViewerModalProps {
  title: string;
  /** Global card uids. */
  cardIds: string[];
  onClose: () => void;
  onCardPress?: (cardId: string) => void;
  emptyText?: string;
}

/** Grid browser for any pile of cards (discard, scored, played, full deck…). */
export default function PileViewerModal({
  title,
  cardIds,
  onClose,
  onCardPress,
  emptyText
}: PileViewerModalProps) {
  const { t } = useLanguage();

  return (
    <PlaymatModal onClose={onClose} title={title} wide>
      {cardIds.length ? (
        <div className="pile-grid">
          {cardIds.map((cardId, index) => {
            const card = getCatalogCard(cardId);
            if (!card) {
              return null;
            }

            return (
              <CardTile
                card={card}
                key={`${cardId}-${index}`}
                onPress={onCardPress ? () => onCardPress(cardId) : undefined}
                size="md"
              />
            );
          })}
        </div>
      ) : (
        <p className="pile-empty">{emptyText ?? t("playmat.pileEmpty")}</p>
      )}
    </PlaymatModal>
  );
}
