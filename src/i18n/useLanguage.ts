import {
  createContext,
  createElement,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";
import { Language, translations, TranslationKey } from "./translations";

const LANGUAGE_STORAGE_KEY = "achievement-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const cachedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return cachedLanguage === "zh" ? "zh" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    };

    const t = (key: TranslationKey | string) => {
      return (
        translations[language][key as TranslationKey] ??
        translations.en[key as TranslationKey] ??
        key
      );
    };

    return {
      language,
      setLanguage,
      t
    };
  }, [language]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
