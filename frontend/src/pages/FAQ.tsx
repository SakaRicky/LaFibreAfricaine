import { useState } from "react";
import { useLocale } from "../hooks/useLocale.ts";
import Reveal from "../components/Reveal.tsx";

export default function FAQ() {
  const { t } = useLocale();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const items = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  return (
    <div>
      <section className="bg-white py-16 text-center">
        <Reveal>
          <p className="eyebrow">La Fibre Africaine</p>
          <h1 className="mt-3 font-display text-5xl font-semibold">{t("faq.title")}</h1>
          <p className="mt-4 text-sm text-charcoal/60">{t("faq.subtitle")}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        {items.map((item, i) => (
          <div key={i} className="border-b border-charcoal/10">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex w-full items-baseline justify-between gap-4 py-5 text-left"
            >
              <span className="font-display text-xl font-semibold text-forest">{item.q}</span>
              <span className="shrink-0 text-gold">{openIdx === i ? "−" : "+"}</span>
            </button>
            {openIdx === i && (
              <p className="pb-6 text-[15px] leading-relaxed text-charcoal/75">{item.a}</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
