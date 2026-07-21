import { DragEvent, useEffect, useMemo, useState } from "react";
import {
  cardBackPath,
  CatalogCard,
  cardImagePathByUid
} from "../../data/playmat/catalog";
import { PlaymatCardType } from "../../data/playmat/rivalsDecks";
import { useLanguage } from "../../i18n/useLanguage";

interface CardTileProps {
  /** null renders a face-down card back. */
  card: CatalogCard | null;
  backType?: PlaymatCardType;
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}

/**
 * One card on the playmat. Tries the manifest image (.jpg, then .png), and
 * falls back to a readable styled text card until real scans are dropped in.
 */
export default function CardTile({
  card,
  backType = "gambit",
  size = "md",
  onPress,
  draggable,
  onDragStart,
  ariaLabel
}: CardTileProps) {
  const { t } = useLanguage();

  const sources = useMemo(() => {
    const primary = card ? cardImagePathByUid(card.uid) : cardBackPath(backType);
    if (!primary) {
      return [] as string[];
    }

    const list = [primary];
    if (primary.endsWith(".jpg")) {
      list.push(primary.replace(/\.jpg$/, ".png"));
    }

    return list;
  }, [card, backType]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
  }, [sources]);

  const typeKey = card ? `playmat.cardType.${card.type}` : "playmat.cardType.back";

  const body = failed || !sources.length ? (
    card ? (
      <span className={`card-tile-fallback type-${card.type}`}>
        <small>{t(typeKey)}</small>
        <strong>{card.name}</strong>
        {card.type === "objective" ? (
          <em>{t("playmat.gloryShort")} {card.glory}</em>
        ) : null}
      </span>
    ) : (
      <span className={`card-tile-fallback card-back type-${backType}`}>
        <strong>{t("playmat.cardBack")}</strong>
      </span>
    )
  ) : (
    <img
      alt={card ? card.name : t("playmat.cardBack")}
      draggable={false}
      loading="lazy"
      onError={() => {
        if (sourceIndex + 1 < sources.length) {
          setSourceIndex(sourceIndex + 1);
        } else {
          setFailed(true);
        }
      }}
      src={sources[sourceIndex]}
    />
  );

  const className = `card-tile card-${size}${card ? "" : " face-down"}`;
  const label = ariaLabel ?? card?.name ?? t("playmat.cardBack");

  // Plain element when inert so card tiles can sit inside other buttons
  // (e.g. the deck piles in the dock) without nesting <button> elements.
  if (!onPress && !draggable) {
    return (
      <span aria-label={label} className={className} role="img">
        {body}
      </span>
    );
  }

  return (
    <button
      aria-label={label}
      className={className}
      draggable={draggable}
      onClick={onPress}
      onDragStart={onDragStart}
      type="button"
    >
      {body}
    </button>
  );
}
