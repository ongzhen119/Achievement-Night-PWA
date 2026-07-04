import { FormEvent, useEffect, useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { BattleResult, createBattle } from "../utils/communityData";
import { getSelectedPlayerId, setSelectedPlayerId } from "../utils/communityProfile";
import { useCommunityData } from "../utils/useCommunityData";

function todayForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function LogBattlePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, loading, errorKey } = useCommunityData();
  const [date, setDate] = useState(todayForInput);
  const [playerId, setPlayerId] = useState(getSelectedPlayerId() ?? "");
  const [opponentId, setOpponentId] = useState("");
  const [playerWarband, setPlayerWarband] = useState("");
  const [opponentWarband, setOpponentWarband] = useState("");
  const [format, setFormat] = useState<"Rivals" | "Nemesis">("Rivals");
  const [result, setResult] = useState<BattleResult | "">("");
  const [playerGlory, setPlayerGlory] = useState("");
  const [opponentGlory, setOpponentGlory] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErrorKey, setFormErrorKey] = useState<string | null>(null);
  const selectedPlayer = data?.players.find((player) => player.id === playerId);
  const selectedOpponent = data?.players.find((player) => player.id === opponentId);
  const opponents = useMemo(
    () => data?.players.filter((player) => player.id !== playerId) ?? [],
    [data, playerId]
  );

  useEffect(() => {
    if (selectedPlayer && !playerWarband) {
      setPlayerWarband(selectedPlayer.favouriteWarband ?? "");
    }
  }, [selectedPlayer, playerWarband]);

  useEffect(() => {
    if (selectedOpponent) {
      setOpponentWarband(selectedOpponent.favouriteWarband ?? "");
    }
  }, [selectedOpponent]);

  function changePlayer(nextPlayerId: string) {
    const player = data?.players.find((item) => item.id === nextPlayerId);
    setPlayerId(nextPlayerId);
    setPlayerWarband(player?.favouriteWarband ?? "");
    if (nextPlayerId === opponentId) {
      setOpponentId("");
      setOpponentWarband("");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedPlayer || !selectedOpponent || !result) {
      setFormErrorKey("companion.error.invalidBattle");
      return;
    }

    try {
      setSaving(true);
      setFormErrorKey(null);
      await createBattle(
        {
          date,
          playerId,
          opponentId,
          playerWarband,
          opponentWarband,
          format,
          result,
          playerGlory: Number(playerGlory),
          opponentGlory: Number(opponentGlory),
          notes
        },
        selectedPlayer.nickname
      );
      setSelectedPlayerId(playerId);
      navigate("/battles");
    } catch (error) {
      setFormErrorKey(error instanceof Error ? error.message : "companion.error.save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />
      <section className="page-intro panel">
        <Swords size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("companion.log.memoryLabel")}</p>
          <h1>{t("companion.log.heading")}</h1>
          <p className="muted">{t("companion.log.subtitle")}</p>
        </div>
      </section>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {data && data.players.length < 2 ? (
        <section className="panel empty-state">
          <p>{t("companion.log.needPlayers")}</p>
          <Link className="primary-button" to="/players">{t("companion.log.addPlayers")}</Link>
        </section>
      ) : null}

      {data && data.players.length >= 2 ? (
        <form className="battle-form" onSubmit={handleSubmit}>
          {formErrorKey ? <p className="error-line">{t(formErrorKey)}</p> : null}

          <section className="panel form-panel">
            <label>
              <span>{t("companion.log.date")}</span>
              <input onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
            </label>
            <label>
              <span>{t("companion.log.player")}</span>
              <select className="app-select" onChange={(event) => changePlayer(event.target.value)} required value={playerId}>
                <option value="">{t("companion.log.choosePlayer")}</option>
                {data.players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}
              </select>
            </label>
            <label>
              <span>{t("companion.log.opponent")}</span>
              <select className="app-select" onChange={(event) => setOpponentId(event.target.value)} required value={opponentId}>
                <option value="">{t("companion.log.chooseOpponent")}</option>
                {opponents.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}
              </select>
            </label>
          </section>

          <section className="panel form-panel two-column-fields">
            <label>
              <span>{t("companion.log.playerWarband")}</span>
              <input maxLength={80} onChange={(event) => setPlayerWarband(event.target.value)} required value={playerWarband} />
            </label>
            <label>
              <span>{t("companion.log.opponentWarband")}</span>
              <input maxLength={80} onChange={(event) => setOpponentWarband(event.target.value)} required value={opponentWarband} />
            </label>
          </section>

          <section className="panel form-section">
            <span className="field-label">{t("companion.log.format")}</span>
            <div className="choice-grid two">
              {(["Rivals", "Nemesis"] as const).map((item) => (
                <button className={format === item ? "choice-button active" : "choice-button"} key={item} onClick={() => setFormat(item)} type="button">{item}</button>
              ))}
            </div>
          </section>

          <section className="panel form-section">
            <span className="field-label">{t("companion.log.result")}</span>
            <div className="choice-grid three">
              {(["win", "draw", "loss"] as const).map((item) => (
                <button className={result === item ? `choice-button active ${item}` : "choice-button"} key={item} onClick={() => setResult(item)} type="button">{t(`companion.result.${item}`)}</button>
              ))}
            </div>
          </section>

          <section className="panel form-panel glory-fields">
            <label>
              <span>{t("companion.log.playerGlory")}</span>
              <input inputMode="numeric" min={0} onChange={(event) => setPlayerGlory(event.target.value)} required type="number" value={playerGlory} />
            </label>
            <label>
              <span>{t("companion.log.opponentGlory")}</span>
              <input inputMode="numeric" min={0} onChange={(event) => setOpponentGlory(event.target.value)} required type="number" value={opponentGlory} />
            </label>
            <label className="full-width">
              <span>{t("companion.log.notes")}</span>
              <textarea maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder={t("companion.log.notesPlaceholder")} rows={4} value={notes} />
            </label>
          </section>

          <button className="primary-button main-cta" disabled={saving} type="submit">
            {saving ? t("common.loading") : t("companion.log.save")}
          </button>
        </form>
      ) : null}
      <BottomNav />
    </main>
  );
}
