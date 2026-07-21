import { useState } from "react";
import { UserPlus } from "lucide-react";
import { CommunityPlayer, createCommunityPlayer } from "../../utils/communityData";
import { setSelectedPlayerId } from "../../utils/communityProfile";
import { useLanguage } from "../../i18n/useLanguage";

interface PlayerSelectProps {
  players: CommunityPlayer[];
  value: string | null;
  onChange: (playerId: string) => void;
  /** Called after a new player is created so the parent can reload the list. */
  onCreated?: (player: CommunityPlayer) => void;
}

/**
 * Pick an existing community player from a dropdown (no typing needed), with an
 * inline "new player" affordance. The choice is remembered as the device's
 * selected player.
 */
export default function PlayerSelect({
  players,
  value,
  onChange,
  onCreated
}: PlayerSelectProps) {
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSelect = (playerId: string) => {
    if (playerId) {
      setSelectedPlayerId(playerId);
    }
    onChange(playerId);
  };

  const handleCreate = async () => {
    if (!newName.trim() || busy) {
      return;
    }

    setBusy(true);
    setErrorKey(null);
    try {
      const player = await createCommunityPlayer({ nickname: newName.trim() });
      setSelectedPlayerId(player.id);
      onChange(player.id);
      onCreated?.(player);
      setNewName("");
      setAdding(false);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "companion.error.save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="player-select">
      <div className="player-select-row">
        <select
          className="text-input"
          onChange={(event) => handleSelect(event.target.value)}
          value={value ?? ""}
        >
          <option value="">{t("playmat.choosePlayerPlaceholder")}</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.nickname}
            </option>
          ))}
        </select>
        <button
          aria-label={t("playmat.newPlayer")}
          className="icon-button"
          onClick={() => setAdding((current) => !current)}
          type="button"
        >
          <UserPlus size={18} aria-hidden="true" />
        </button>
      </div>

      {adding ? (
        <div className="player-select-add">
          <input
            className="text-input"
            maxLength={24}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t("playmat.newPlayerPlaceholder")}
            value={newName}
          />
          <button
            className="primary-button compact"
            disabled={!newName.trim() || busy}
            onClick={() => void handleCreate()}
            type="button"
          >
            {busy ? t("common.loading") : t("playmat.addPlayer")}
          </button>
        </div>
      ) : null}

      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}
    </div>
  );
}
