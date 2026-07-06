import { useLocale } from "../hooks/useLocale.ts";
import Reveal from "./Reveal.tsx";

// The trust centrepiece: order online → confirm on WhatsApp → pay on receipt.
// Full band on the homepage; compact strip on the checkout page.
export default function HowItWorks({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`how.s${n}Title`),
    text: t(`how.s${n}Text`),
  }));

  if (compact) {
    return (
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3 border border-charcoal/10 bg-white p-4">
            <span className="font-display text-2xl font-semibold leading-none text-gold">{s.n}</span>
            <span>
              <span className="block text-[13px] font-semibold text-forest">{s.title}</span>
              <span className="mt-1 block text-[12px] leading-relaxed text-charcoal/60">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className="bg-forest py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-semibold text-ivory sm:text-5xl">
            {t("how.title")}
          </h2>
          <div className="mx-auto mt-3 h-px w-16 bg-gold" />
        </Reveal>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 130}>
              <div className="text-center">
                <p className="font-display text-6xl font-semibold text-gold/70">0{s.n}</p>
                <h3 className="mt-4 font-display text-2xl font-semibold text-ivory">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ivory/70">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
