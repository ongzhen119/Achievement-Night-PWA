import { Language } from "../i18n/translations";

export function formatEventDate(eventDate: string, language: Language) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium"
  }).format(new Date(`${eventDate}T00:00:00`));
}
