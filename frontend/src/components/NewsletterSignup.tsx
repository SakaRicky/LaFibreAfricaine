import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api.ts";
import { useLocale } from "../hooks/useLocale.ts";

export default function NewsletterSignup() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ok" | string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.subscribe(email);
      setStatus("ok");
      setEmail("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <section className="relative overflow-hidden bg-forest py-20 text-center">
      <img
        src="/brand/pattern4.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
      />
      <div className="relative mx-auto max-w-xl px-6">
        <h2 className="font-display text-4xl font-semibold text-ivory">{t("newsletter.title")}</h2>
        <div className="mx-auto mt-3 h-px w-16 bg-gold" />
        <p className="mt-4 text-sm leading-relaxed text-ivory/70">{t("newsletter.text")}</p>
        {status === "ok" ? (
          <p className="mt-6 text-sm font-medium tracking-wide text-gold">{t("newsletter.success")}</p>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              className="flex-1 border border-ivory/25 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/40 outline-none transition-colors focus:border-gold"
            />
            <button type="submit" className="btn-gold">{t("newsletter.cta")}</button>
          </form>
        )}
        {status && status !== "ok" && <p className="mt-3 text-sm text-terracotta">{status}</p>}
      </div>
    </section>
  );
}
