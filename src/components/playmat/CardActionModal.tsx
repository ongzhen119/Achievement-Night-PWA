import { CatalogCard } from "../../data/playmat/catalog";
import { useLanguage } from "../../i18n/useLanguage";
import CardTile from "./CardTile";
import PlaymatModal from "./PlaymatModal";

export interface CardAction {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger" | "ghost";
}

interface CardActionModalProps {
  card: CatalogCard;
  subtitle?: string;
  actions: CardAction[];
  onClose: () => void;
}

/** Zoomed card view with large touch-target actions underneath. */
export default function CardActionModal({
  card,
  subtitle,
  actions,
  onClose
}: CardActionModalProps) {
  const { t } = useLanguage();

  return (
    <PlaymatModal onClose={onClose} title={card.name}>
      {subtitle ? <p className="playmat-sheet-subtitle">{subtitle}</p> : null}
      <div className="card-zoom">
        <CardTile card={card} size="lg" />
      </div>
      <p className="card-zoom-meta">
        <span>{t(`playmat.cardType.${card.type}`)}</span>
        {card.type === "objective" ? (
          <span>
            {t("playmat.gloryShort")} {card.glory}
          </span>
        ) : null}
        {card.surge ? <span>{t("playmat.surge")}</span> : null}
        {card.ploy ? <span>{t("playmat.ploy")}</span> : null}
      </p>
      {card.rule ? (
        <p className="card-zoom-rule">{card.rule.replace(/\*\*|:[a-zA-Z]+:/g, "")}</p>
      ) : null}
      {actions.length ? (
        <div className="playmat-action-list">
          {actions.map((action) => (
            <button
              className={`playmat-action ${action.tone ?? "primary"}`}
              key={action.label}
              onClick={action.onPress}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </PlaymatModal>
  );
}
