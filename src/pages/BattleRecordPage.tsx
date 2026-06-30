import { FormEvent, useState } from "react";
import { Swords } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { epicMoments } from "../data/epicMoments";
import { useLanguage } from "../i18n/useLanguage";
import { getCommunityPlayerId, getCommunityProfile } from "../utils/communityProfile";
import { submitBattleRecord } from "../utils/communityStats";
import { TranslationKey } from "../i18n/translations";

const FORMATS = ["Rivals", "Nemesis", "Relic", "Other"] as const;
const FORMAT_KEYS: Record<string, TranslationKey> = {
  Rivals: "battle.formatRivals",
  Nemesis: "battle.formatNemesis",
  Relic: "battle.formatRelic",
  Other: "battle.formatOther"
};

export default function BattleRecordPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const profile = getCommunityProfile();
  const communityPlayerId = getCommunityPlayerId();

  const [result, setResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [warband, setWarband] = useState(profile?.warband ?? "");
  const [opponent, setOpponent] = useState("");
  const [format, setFormat] = useState("");
  const [glory, setGlory] = useState("");
  const [notes, setNotes] = useState("");
  const [moments, setMoments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function toggleMoment(id: string) {
    setMoments((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!communityPlayerId || !result || !warband.trim()) return;

    setSubmitting(true);
    setErrorKey(null);

    try {
      const gloryScore = glory.trim() ? parseInt(glory, 10) : undefined;
      await submitBattleRecord({
        communityPlayerId,
        displayName: profile?.displayName,
        eventSlug: slug || undefined,
        battleResult: result,
        warband: warband.trim(),
        opponentWarband: opponent.trim() || undefined,
        format: format || undefined,
        epicMoments: moments.length > 0 ? moments : undefined,
        gloryScore: gloryScore !== undefined && !isNaN(gloryScore) ? gloryScore : undefined,
        notes: notes.trim() || undefined
      });
      navigate("/profile");
    } catch (err: unknown) {
      setErrorKey(err instanceof Error ? err.message : "status.saveError");
      setSubmitting(false);
    }
  }

  if (!communityPlayerId) {
    return (
      <main className="app-shell event-shell">
        <div className="top-bar">
          <p className="eyebrow">{t("app.name")}</p>
          <LanguageToggle />
        </div>
        <section className="panel centered-panel">
          <p className="warning-line">{t("battle.noProfileWarning")}</p>
          <Link className="primary-link" to="/profile">
            {t("battle.goToProfile")}
          </Link>
          <Link className="secondary-button" to={`/event/${slug}/result`}>
            {t("battle.skipButton")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell event-shell">
      <div className="top-bar">
        <p className="eyebrow">{t("battle.heading")}</p>
        <LanguageToggle />
      </div>

      <section className="panel hero-panel" style={{ minHeight: 160 }}>
        <div className="hero-relic" aria-hidden="true">
          <Swords size={38} />
        </div>
        <h1>{t("battle.heading")}</h1>
        <p className="hero-copy">{t("battle.subtitle")}</p>
      </section>

      {errorKey ? <p className="error-line">{t(errorKey as TranslationKey)}</p> : null}

      <form onSubmit={handleSubmit}>
        {/* Battle result */}
        <section className="panel battle-form-section">
          <p className="section-label">{t("battle.resultLabel")}</p>
          <div className="battle-result-buttons">
            {(["win", "draw", "loss"] as const).map((r) => (
              <button
                className={`battle-result-btn${result === r ? ` active-${r}` : ""}`}
                key={r}
                onClick={() => setResult(r)}
                type="button"
              >
                {t(`battle.${r}` as TranslationKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Warbands */}
        <section className="panel form-panel">
          <label>
            <span>{t("battle.warbandLabel")}</span>
            <input
              autoComplete="off"
              onChange={(e) => setWarband(e.target.value)}
              placeholder={t("battle.warbandPlaceholder")}
              value={warband}
            />
          </label>
          <label>
            <span>{t("battle.opponentLabel")}</span>
            <input
              autoComplete="off"
              onChange={(e) => setOpponent(e.target.value)}
              placeholder={t("battle.opponentPlaceholder")}
              value={opponent}
            />
          </label>
        </section>

        {/* Format */}
        <section className="panel battle-form-section">
          <p className="section-label">{t("battle.formatLabel")}</p>
          <div className="format-buttons">
            {FORMATS.map((f) => (
              <button
                className={`format-btn${format === f ? " active" : ""}`}
                key={f}
                onClick={() => setFormat(format === f ? "" : f)}
                type="button"
              >
                {t(FORMAT_KEYS[f])}
              </button>
            ))}
          </div>
        </section>

        {/* Glory + Notes */}
        <section className="panel form-panel">
          <label>
            <span>{t("battle.gloryLabel")}</span>
            <input
              className="glory-input"
              inputMode="numeric"
              max={99}
              min={0}
              onChange={(e) => setGlory(e.target.value)}
              placeholder={t("battle.gloryPlaceholder")}
              type="number"
              value={glory}
            />
          </label>
          <label>
            <span>{t("battle.notesLabel")}</span>
            <textarea
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("battle.notesPlaceholder")}
              rows={3}
              value={notes}
            />
          </label>
        </section>

        {/* Battle Highlights */}
        <section className="panel battle-form-section">
          <p className="section-label">{t("battle.highlightsLabel")}</p>
          <p className="highlights-hint">{t("battle.highlightsHint")}</p>
          <div className="epic-moments-grid">
            {epicMoments.map((m) => (
              <button
                className={`epic-moment-btn${moments.includes(m.id) ? " selected" : ""}`}
                key={m.id}
                onClick={() => toggleMoment(m.id)}
                type="button"
              >
                {t(m.labelKey as TranslationKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="panel" style={{ display: "grid", gap: 10 }}>
          <button
            className="primary-button"
            disabled={submitting || !result || !warband.trim()}
            type="submit"
          >
            {t("battle.submitButton")}
          </button>
          <Link className="secondary-button" to={`/event/${slug}/result`}>
            {t("battle.skipButton")}
          </Link>
        </section>
      </form>
    </main>
  );
}
