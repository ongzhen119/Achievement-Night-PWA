import { useLanguage } from "../i18n/useLanguage";
import { Language } from "../i18n/translations";

const languageOptions: Language[] = ["en", "zh"];

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-toggle" aria-label={t("language.toggleLabel")}>
      {languageOptions.map((option) => (
        <button
          className={language === option ? "active" : ""}
          key={option}
          onClick={() => setLanguage(option)}
          type="button"
        >
          {t(option === "en" ? "language.en" : "language.zh")}
        </button>
      ))}
    </div>
  );
}
