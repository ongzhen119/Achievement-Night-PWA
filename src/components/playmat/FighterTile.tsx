import { useEffect, useMemo, useState } from "react";
import { Flame, Skull } from "lucide-react";
import {
  fighterImagePath,
  PlaymatFighterDef
} from "../../data/playmat/warbands";
import { useLanguage } from "../../i18n/useLanguage";
import { PlaymatFighterState } from "../../utils/playmat/types";

interface FighterTileProps {
  warbandId: string;
  fighter: PlaymatFighterDef;
  state: PlaymatFighterState;
  compact?: boolean;
  /**
   * Large, unobstructed card art with no ribbon/badges — for the fighter
   * detail view, where the printed weapon/ability text needs to stay legible.
   * The wounds/damage/inspired info is shown as text next to it instead.
   */
  zoom?: boolean;
  onPress?: () => void;
  /** Marks this tile as an upgrade drop target for useCardDrag hit-testing. */
  dropTarget?: boolean;
}

/** A fighter card with a health bar, damage, inspired and out-of-action markers. */
export default function FighterTile({
  warbandId,
  fighter,
  state,
  compact,
  zoom,
  onPress,
  dropTarget
}: FighterTileProps) {
  const { t } = useLanguage();

  const source = useMemo(
    () => fighterImagePath(warbandId, fighter, state.inspired),
    [warbandId, fighter, state.inspired]
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [source]);

  const woundedOut = state.out;
  const remaining = Math.max(0, fighter.wounds - state.damage);
  const healthPct = fighter.wounds > 0 ? (remaining / fighter.wounds) * 100 : 0;
  // Green when healthy, amber when bloodied, oxblood-red when near death.
  const healthTone =
    healthPct > 66 ? "healthy" : healthPct > 33 ? "hurt" : "critical";

  return (
    <button
      aria-label={`${fighter.name} — ${remaining}/${fighter.wounds}`}
      className={[
        "fighter-tile",
        compact ? "compact" : "",
        zoom ? "zoom" : "",
        state.inspired ? "inspired" : "",
        woundedOut ? "out" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onPress}
      type="button"
      {...(dropTarget ? { "data-drop": "fighter", "data-fighter-id": fighter.id } : {})}
    >
      {failed ? (
        <span className="fighter-fallback">
          <strong>{fighter.name}</strong>
          <small>
            {t("playmat.woundsShort")} {fighter.wounds}
          </small>
        </span>
      ) : (
        <img
          alt={fighter.name}
          draggable={false}
          loading="lazy"
          onError={() => setFailed(true)}
          src={source}
        />
      )}

      {!zoom && state.damage > 0 ? (
        <span className="fighter-damage" aria-label={t("playmat.damageLabel")}>
          {state.damage}
        </span>
      ) : null}

      {!zoom && state.inspired ? (
        <span className="fighter-inspired-mark" aria-hidden="true">
          <Flame size={12} />
        </span>
      ) : null}

      {!zoom && state.upgrades.length ? (
        <span className="fighter-upgrade-count">+{state.upgrades.length}</span>
      ) : null}

      {!zoom && woundedOut ? (
        <span className="fighter-out-overlay">
          <Skull size={compact ? 18 : 26} aria-hidden="true" />
        </span>
      ) : null}

      {/* Name ribbon + health bar: fighter status readable at a glance.
          Skipped in zoom mode — the modal shows this as text instead, so
          the ribbon doesn't cover the card's printed weapon/ability text. */}
      {!zoom ? (
        <span className="fighter-ribbon">
          <span className="fighter-name">{fighter.name}</span>
          <span
            aria-hidden="true"
            className={`fighter-wounds ${healthTone}`}
            title={`${remaining}/${fighter.wounds}`}
          >
            <span className="wound-fill" style={{ width: `${healthPct}%` }} />
          </span>
        </span>
      ) : null}
    </button>
  );
}
