import { FormEvent, useEffect, useState } from "react";
import { Crown, Shield, Swords, Trophy, User } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/useLanguage";
import { formatEventDate } from "../utils/date";
import {
  CommunityProfile,
  createCommunityProfile,
  getCommunityProfile,
  updateCommunityProfile
} from "../utils/communityProfile";
import {
  CommunityRank,
  fetchProfileStats,
  getCommunityRank,
  getNextMilestone,
  ProfileStats
} from "../utils/communityStats";
import { formatText } from "../utils/format";
import { TranslationKey } from "../i18n/translations";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function rankClass(rank: CommunityRank): string {
  if (rank === "Champion" || rank === "Host" || rank === "Founder") return "champion";
  if (rank === "Veteran") return "veteran";
  return "recruit";
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<CommunityProfile | null>(() =>
    getCommunityProfile()
  );
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [warbandInput, setWarbandInput] = useState("");

  useEffect(() => {
    if (!profile) return;
    setStatsLoading(true);
    fetchProfileStats(profile.playerId)
      .then(setStats)
      .catch((e: unknown) =>
        setStatsError(e instanceof Error ? e.message : "status.saveError")
      )
      .finally(() => setStatsLoading(false));
  }, [profile]);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || !warbandInput.trim()) return;
    const created = createCommunityProfile(nameInput, warbandInput);
    setProfile(created);
  }

  function handleEditSave(e: FormEvent) {
    e.preventDefault();
    updateCommunityProfile({
      displayName: nameInput.trim() || profile!.displayName,
      warband: warbandInput.trim() || profile!.warband
    });
    setProfile(getCommunityProfile());
    setEditing(false);
  }

  function startEdit() {
    setNameInput(profile?.displayName ?? "");
    setWarbandInput(profile?.warband ?? "");
    setEditing(true);
  }

  const rank = stats ? getCommunityRank(stats) : "Recruit";
  const milestone = stats ? getNextMilestone(stats) : null;

  if (!profile) {
    return (
      <main className="app-shell event-shell">
        <div className="top-bar">
          <p className="eyebrow">{t("app.name")}</p>
          <LanguageToggle />
        </div>
        <section className="panel hero-panel">
          <div className="hero-relic" aria-hidden="true">
            <User size={42} />
          </div>
          <h1>{t("profile.createTitle")}</h1>
          <p className="hero-copy">{t("profile.createBody")}</p>
        </section>
        <form className="panel form-panel" onSubmit={handleCreate}>
          <label>
            <span>{t("profile.nameLabel")}</span>
            <input
              autoComplete="name"
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              value={nameInput}
            />
          </label>
          <label>
            <span>{t("profile.warbandLabel")}</span>
            <input
              autoComplete="off"
              onChange={(e) => setWarbandInput(e.target.value)}
              placeholder={t("profile.warbandPlaceholder")}
              value={warbandInput}
            />
          </label>
          <button
            className="primary-button"
            disabled={!nameInput.trim() || !warbandInput.trim()}
            type="submit"
          >
            {t("profile.createButton")}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("app.name")}</p>
        <LanguageToggle />
      </div>

      {/* Hero / identity */}
      {editing ? (
        <form className="panel form-panel" onSubmit={handleEditSave}>
          <label>
            <span>{t("profile.nameLabel")}</span>
            <input
              autoComplete="name"
              onChange={(e) => setNameInput(e.target.value)}
              value={nameInput}
            />
          </label>
          <label>
            <span>{t("profile.warbandLabel")}</span>
            <input
              autoComplete="off"
              onChange={(e) => setWarbandInput(e.target.value)}
              value={warbandInput}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button className="secondary-button" onClick={() => setEditing(false)} type="button">
              {t("profile.cancelButton")}
            </button>
            <button className="primary-button" type="submit">
              {t("profile.saveButton")}
            </button>
          </div>
        </form>
      ) : (
        <section className="panel">
          <div className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              {getInitials(profile.displayName)}
            </div>
            <div>
              <h1 className="profile-name">{profile.displayName}</h1>
              <div className={`rank-pill ${rankClass(rank as CommunityRank)}`}>
                <Crown size={12} aria-hidden="true" />
                {t(`profile.rank.${rank}` as TranslationKey)}
              </div>
              <span className="profile-joined">
                {t("profile.joinedLabel")} {formatEventDate(profile.joinedDate.slice(0, 10), language)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: "14px" }}>
            <button className="secondary-button" onClick={startEdit} type="button">
              {t("profile.editButton")}
            </button>
          </div>
        </section>
      )}

      {statsLoading ? <p className="status-line">{t("common.loading")}</p> : null}
      {statsError ? <p className="error-line">{t(statsError as TranslationKey)}</p> : null}

      {/* Battle stats */}
      {stats ? (
        <section className="panel">
          <p className="eyebrow">{t("profile.statsHeading")}</p>
          <div className="profile-stats-grid">
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.gamesPlayed}</span>
              <span className="profile-stat-label">{t("profile.gamesPlayedLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.winRate}%</span>
              <span className="profile-stat-label">{t("profile.winRateLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.totalGlory}</span>
              <span className="profile-stat-label">{t("profile.totalGloryLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.wins}</span>
              <span className="profile-stat-label">{t("profile.winsLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.losses}</span>
              <span className="profile-stat-label">{t("profile.lossesLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.draws}</span>
              <span className="profile-stat-label">{t("profile.drawsLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.highlightsCount}</span>
              <span className="profile-stat-label">{t("profile.highlightsLabel")}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.championCount}</span>
              <span className="profile-stat-label">{t("profile.championCountLabel")}</span>
            </div>
            {stats.favouriteWarband ? (
              <div className="profile-stat wide">
                <span className="profile-stat-value" style={{ fontSize: "1rem" }}>
                  <Shield size={14} style={{ display: "inline", marginRight: 5 }} aria-hidden="true" />
                  {stats.favouriteWarband}
                </span>
                <span className="profile-stat-label">{t("profile.favouriteWarbandLabel")}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Community contribution */}
      {stats ? (
        <section className="panel">
          <p className="eyebrow">{t("profile.contributionHeading")}</p>
          <div className="contribution-list">
            <div className="contribution-row">
              <span>{t("profile.championshipsLabel")}</span>
              <span className="contribution-value">{stats.championCount}</span>
            </div>
            <div className="contribution-row">
              <span>{t("profile.gamesLoggedLabel")}</span>
              <span className="contribution-value">{stats.gamesPlayed}</span>
            </div>
            <div className="contribution-row">
              <span>{t("profile.achievementsEarnedLabel")}</span>
              <span className="contribution-value">{stats.achievementsCompleted}</span>
            </div>
            <div className="contribution-row">
              <span>{t("profile.eventsHostedLabel")}</span>
              <span className="contribution-placeholder">coming soon</span>
            </div>
            <div className="contribution-row">
              <span>{t("profile.invitedLabel")}</span>
              <span className="contribution-placeholder">coming soon</span>
            </div>
          </div>
        </section>
      ) : null}

      {/* Next milestone */}
      {milestone ? (
        <section className="panel">
          <p className="eyebrow">
            <Trophy size={14} style={{ display: "inline", marginRight: 5 }} aria-hidden="true" />
            {t("profile.milestoneHeading")}
          </p>
          <p className="milestone-text">
            {formatText(t(milestone.key as TranslationKey), milestone.values ?? {})}
          </p>
        </section>
      ) : null}

      {/* Recent battles */}
      {stats ? (
        <section className="panel">
          <p className="eyebrow">
            <Swords size={14} style={{ display: "inline", marginRight: 5 }} aria-hidden="true" />
            {t("profile.battleHistoryHeading")}
          </p>
          {stats.recentBattles.length === 0 ? (
            <p className="muted" style={{ marginTop: 10 }}>{t("profile.noBattles")}</p>
          ) : (
            <div className="battle-log">
              {stats.recentBattles.map((b) => (
                <div className="battle-log-row" key={b.id}>
                  <div className={`result-dot ${b.battle_result}`} aria-hidden="true" />
                  <div className="battle-log-main">
                    <span>{b.warband}{b.opponent_warband ? ` vs ${b.opponent_warband}` : ""}</span>
                    <small>{formatEventDate(b.created_at.slice(0, 10), language)}</small>
                  </div>
                  <span className={`battle-log-result ${b.battle_result}`}>
                    {t(`battle.${b.battle_result}` as TranslationKey)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Global links */}
      <section className="panel centered-panel">
        <div className="global-links">
          <Link className="secondary-button" to="/hall-of-fame">
            {t("profile.warbandLink")}
          </Link>
          <Link className="secondary-button" to="/stats">
            {t("nav.stats")}
          </Link>
        </div>
      </section>
    </main>
  );
}
