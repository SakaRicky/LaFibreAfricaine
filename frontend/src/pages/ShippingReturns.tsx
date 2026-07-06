import { useLocale } from "../hooks/useLocale.ts";
import Reveal from "../components/Reveal.tsx";
import HowItWorks from "../components/HowItWorks.tsx";

export default function ShippingReturns() {
  const { t } = useLocale();
  const sections = [1, 2, 3, 4, 5].map((n) => ({
    title: t(`ship.s${n}t`),
    text: t(`ship.s${n}p`),
  }));

  return (
    <div>
      <section className="bg-white py-16 text-center">
        <Reveal>
          <p className="eyebrow">La Fibre Africaine</p>
          <h1 className="mt-3 font-display text-5xl font-semibold">{t("ship.title")}</h1>
          <p className="mt-4 text-sm text-charcoal/60">{t("ship.subtitle")}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="space-y-10">
          {sections.map((s, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="border-l-2 border-gold pl-6">
                <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-charcoal/75">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <HowItWorks compact />
      </section>
    </div>
  );
}
