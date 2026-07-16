import { FormEvent, useCallback, useState } from "react";
import { DoorOpen, Layers, Swords } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import SeatSetup from "../components/playmat/SeatSetup";
import { useLanguage } from "../i18n/useLanguage";
import { isSupabaseConfigured } from "../utils/supabase";
import {
  createPlaymatRoom,
  joinPlaymatRoom,
  SeatSpec
} from "../utils/playmat/rooms";
import { setPlaymatSession } from "../utils/playmat/session";

/** Landing page for the digital playmat: host a table or join one by code. */
export default function PlaymatLobbyPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [seat, setSeat] = useState<SeatSpec | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSeatChange = useCallback((next: SeatSpec | null) => setSeat(next), []);

  const enterRoom = (code: string, playerId: string, token: string, name: string) => {
    setPlaymatSession(code, { playerId, token, name });
    navigate(`/playmat/${code}`);
  };

  const handleCreate = async () => {
    if (!seat || busy) {
      return;
    }

    setBusy("create");
    setErrorKey(null);
    try {
      const { room, player } = await createPlaymatRoom(seat);
      enterRoom(room.code, player.id, player.token, player.name);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.createRoom");
      setBusy(null);
    }
  };

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!seat || joinCode.trim().length !== 4 || busy) {
      return;
    }

    setBusy("join");
    setErrorKey(null);
    try {
      const { room, player } = await joinPlaymatRoom(joinCode, seat);
      enterRoom(room.code, player.id, player.token, player.name);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "playmat.error.joinRoom");
      setBusy(null);
    }
  };

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />

      <section className="panel hero-panel playmat-hero">
        <div className="hero-relic">
          <Swords size={34} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">{t("playmat.heroLabel")}</p>
          <h1>{t("playmat.title")}</h1>
          <p className="hero-copy">{t("playmat.heroCopy")}</p>
        </div>
      </section>

      {!isSupabaseConfigured ? (
        <p className="error-line">{t("status.supabaseMissing")}</p>
      ) : null}

      <section className="panel playmat-form-panel">
        <h2>{t("playmat.yourSeatTitle")}</h2>
        <SeatSetup onSeatChange={handleSeatChange} />
      </section>

      <Link className="panel guide-link" to="/playmat/decks">
        <Layers size={24} aria-hidden="true" />
        <span>
          <strong>{t("playmat.deckBuilderTitle")}</strong>
          <small>{t("playmat.deckBuilderSubtitle")}</small>
        </span>
      </Link>

      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      <section className="panel playmat-form-panel">
        <h2>{t("playmat.hostTitle")}</h2>
        <p className="panel-copy">{t("playmat.hostCopy")}</p>
        <button
          className="primary-button"
          disabled={!seat || busy !== null || !isSupabaseConfigured}
          onClick={() => void handleCreate()}
          type="button"
        >
          <Swords size={18} aria-hidden="true" />
          {busy === "create" ? t("common.loading") : t("playmat.createRoomButton")}
        </button>
      </section>

      <section className="panel playmat-form-panel">
        <h2>{t("playmat.joinTitle")}</h2>
        <p className="panel-copy">{t("playmat.joinCopy")}</p>
        <form onSubmit={(event) => void handleJoin(event)}>
          <label className="field-label" htmlFor="playmat-code">
            {t("playmat.roomCodeLabel")}
          </label>
          <input
            autoCapitalize="characters"
            autoComplete="off"
            className="text-input room-code-input"
            id="playmat-code"
            maxLength={4}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
            value={joinCode}
          />
          <button
            className="primary-button"
            disabled={
              !seat || joinCode.trim().length !== 4 || busy !== null || !isSupabaseConfigured
            }
            type="submit"
          >
            <DoorOpen size={18} aria-hidden="true" />
            {busy === "join" ? t("common.loading") : t("playmat.joinRoomButton")}
          </button>
        </form>
      </section>

      <BottomNav />
    </main>
  );
}
