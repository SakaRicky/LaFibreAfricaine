import type { Lang } from "../types.ts";

export function money(cents: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
