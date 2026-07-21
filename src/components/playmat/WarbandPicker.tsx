import { useState } from "react";
import { Eye } from "lucide-react";
import { playmatWarbands, PlaymatWarbandDef } from "../../data/playmat/warbands";
import { useLanguage } from "../../i18n/useLanguage";
import { formatText } from "../../utils/format";
import FighterTile from "./FighterTile";
import PlaymatModal from "./PlaymatModal";

interface WarbandPickerProps {
  value: string | null;
  onChange: (warbandId: string) => void;
  disabled?: boolean;
}

/** Pick one of the warbands (fighters), with a fighter preview. */
export default function WarbandPicker({ value, onChange, disabled }: WarbandPickerProps) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<PlaymatWarbandDef | null>(null);

  return (
    <div className="deck-picker">
      {playmatWarbands.map((warband) => {
        const selected = warband.id === value;
        return (
          <div className={`deck-option${selected ? " selected" : ""}`} key={warband.id}>
            <button
              className="deck-option-main"
              disabled={disabled}
              onClick={() => onChange(warband.id)}
              type="button"
            >
              <strong>{warband.name}</strong>
              <small>
                {formatText(t("playmat.fighterCount"), { fighters: warband.fighters.length })}
              </small>
            </button>
            <button
              aria-label={t("playmat.previewWarband")}
              className="icon-button"
              onClick={() => setPreview(warband)}
              type="button"
            >
              <Eye size={18} aria-hidden="true" />
            </button>
          </div>
        );
      })}

      {preview ? (
        <PlaymatModal onClose={() => setPreview(null)} title={preview.name} wide>
          <div className="pile-grid fighters">
            {preview.fighters.map((fighter) => (
              <FighterTile
                compact
                fighter={fighter}
                key={fighter.id}
                state={{
                  fighterId: fighter.id,
                  damage: 0,
                  inspired: false,
                  out: false,
                  upgrades: []
                }}
                warbandId={preview.id}
              />
            ))}
          </div>
        </PlaymatModal>
      ) : null}
    </div>
  );
}
