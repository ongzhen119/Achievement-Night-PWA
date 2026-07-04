import { FormEvent, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import PlayerCard from "../components/PlayerCard";
import { useLanguage } from "../i18n/useLanguage";
import { calculatePlayerStats, createCommunityPlayer } from "../utils/communityData";
import { getSelectedPlayerId, setSelectedPlayerId } from "../utils/communityProfile";
import { useCommunityData } from "../utils/useCommunityData";

export default function PlayersPage() {
  const { t } = useLanguage();
  const { data, loading, errorKey, reload } = useCommunityData();
  const [selectedPlayerId, setSelectedId] = useState(getSelectedPlayerId);
  const [nickname, setNickname] = useState("");
  const [warband, setWarband] = useState("");
  const [joinedYear, setJoinedYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErrorKey, setFormErrorKey] = useState<string | null>(null);
  const stats = data ? calculatePlayerStats(data.players, data.battles) : [];

  function selectPlayer(playerId: string) {
    setSelectedPlayerId(playerId);
    setSelectedId(playerId);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!nickname.trim()) return;

    try {
      setSaving(true);
      setFormErrorKey(null);
      const player = await createCommunityPlayer({
        nickname,
        favouriteWarband: warband,
        joinedYear: joinedYear ? Number(joinedYear) : undefined
      });
      selectPlayer(player.id);
      setNickname("");
      setWarband("");
      setJoinedYear("");
      await reload();
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
        <Users size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("companion.players.communityLabel")}</p>
          <h1>{t("companion.players.heading")}</h1>
          <p className="muted">{t("companion.players.subtitle")}</p>
        </div>
      </section>

      <form className="panel form-panel" onSubmit={handleCreate}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("companion.players.newLabel")}</p>
            <h2>{t("companion.players.createHeading")}</h2>
          </div>
          <UserPlus size={22} aria-hidden="true" />
        </div>
        {formErrorKey ? <p className="error-line">{t(formErrorKey)}</p> : null}
        <label>
          <span>{t("companion.players.nickname")}</span>
          <input required maxLength={40} onChange={(event) => setNickname(event.target.value)} value={nickname} />
        </label>
        <label>
          <span>{t("companion.players.favouriteWarband")}</span>
          <input maxLength={80} onChange={(event) => setWarband(event.target.value)} value={warband} />
        </label>
        <label>
          <span>{t("companion.players.joinedYear")}</span>
          <input inputMode="numeric" max={2200} min={1900} onChange={(event) => setJoinedYear(event.target.value)} step={1} type="number" value={joinedYear} />
        </label>
        <button className="primary-button" disabled={saving || !nickname.trim()} type="submit">
          {saving ? t("common.loading") : t("companion.players.create")}
        </button>
      </form>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {data ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("companion.players.rosterLabel")}</p>
              <h2>{t("companion.players.roster")}</h2>
            </div>
            <span className="count-pill">{data.players.length}</span>
          </div>
          {stats.length ? (
            <div className="card-list">
              {stats.map((item) => (
                <PlayerCard key={item.player.id} onSelect={() => selectPlayer(item.player.id)} selected={item.player.id === selectedPlayerId} stats={item} />
              ))}
            </div>
          ) : (
            <p className="empty-state">{t("companion.players.empty")}</p>
          )}
        </section>
      ) : null}
      <BottomNav />
    </main>
  );
}
