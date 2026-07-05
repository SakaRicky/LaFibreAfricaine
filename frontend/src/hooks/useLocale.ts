import { useTranslation } from "react-i18next";
import { currentLang, pickLocalized } from "../i18n.ts";
import { money } from "../lib/format.ts";
import type { Localized } from "../types.ts";

export function useLocale() {
  const { t, i18n } = useTranslation();
  const lang = currentLang(i18n.language);
  const pick = (l: Localized) => pickLocalized(l, lang);
  const price = (cents: number) => money(cents, lang);
  const toggle = () => i18n.changeLanguage(lang === "en" ? "fr" : "en");
  return { t, lang, pick, price, toggle };
}
