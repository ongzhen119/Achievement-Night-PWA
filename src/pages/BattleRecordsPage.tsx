import { useMemo, useState } from "react";
import { ScrollText, Swords } from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BattleCard from "../components/BattleCard";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { useCommunityData } from "../utils/useCommunityData";

export default function BattleRecordsPage() {
  const { t } = useLanguage();
  const { data, loading, errorKey } = useCommunityData();
  const [playerFilter, setPlayerFilter] = useState("");
  const battles = useMemo(
    () =>
      data?.battles.filter(
        (battle) =>
          !playerFilter || battle.playerId === playerFilter || battle.opponentId === playerFilter
      ) ?? [],
    [data, playerFilter]
  );

  return (
    <main className="app-shell page-with-nav">
      <AppHeader />
      <section className="page-intro panel">
        <ScrollText size={34} aria-hidden="true" />
        <div>
          <p className="eyebrow">{t("companion.records.historyLabel")}</p>
          <h1>{t("companion.records.heading")}</h1>
          <p className="muted">{t("companion.records.subtitle")}</p>
        </div>
      </section>
      <Link className="primary-button" to="/battles/new"><Swords size={19} aria-hidden="true" />{t("companion.home.logBattle")}</Link>

      {loading ? <p className="status-line">{t("common.loading")}</p> : null}
      {errorKey ? <p className="error-line">{t(errorKey)}</p> : null}

      {data ? (
        <section className="panel">
          <label className="filter-label">
            <span>{t("companion.records.filter")}</span>
            <select className="app-select" onChange={(event) => setPlayerFilter(event.target.value)} value={playerFilter}>
              <option value="">{t("companion.records.allPlayers")}</option>
              {data.players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}
            </select>
          </label>
          {battles.length ? (
            <div className="card-list records-list">
              {battles.map((battle) => <BattleCard battle={battle} key={battle.id} perspectivePlayerId={playerFilter || undefined} />)}
            </div>
          ) : (
            <p className="empty-state">{t("companion.records.empty")}</p>
          )}
        </section>
      ) : null}
      <BottomNav />
    </main>
  );
}
