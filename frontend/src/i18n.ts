import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import type { Localized, Lang } from "./types.ts";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    // French is the default language (Montréal-first brand); English via the toggle.
    fallbackLng: "fr",
    supportedLngs: ["en", "fr"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "lfa-lang",
      caches: ["localStorage"],
    },
  });

export function currentLang(language: string | undefined): Lang {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function pickLocalized(l: Localized, lang: Lang): string {
  return l[lang] || l.en;
}

export default i18n;
