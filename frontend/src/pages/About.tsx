import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale.ts";
import Reveal from "../components/Reveal.tsx";

export default function About() {
  const { t } = useLocale();

  const values = [
    { title: t("about.v1Title"), text: t("about.v1Text") },
    { title: t("about.v2Title"), text: t("about.v2Text") },
    { title: t("about.v3Title"), text: t("about.v3Text") },
    { title: t("about.v4Title"), text: t("about.v4Text") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest">
        <img src="/brand/homepage_hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest/40 to-forest/85" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Reveal>
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ivory sm:text-6xl">
              {t("about.title")}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-[16px] leading-relaxed text-charcoal/80">
        <Reveal><p>{t("about.p1")}</p></Reveal>
        <Reveal><p className="mt-6">{t("about.p2")}</p></Reveal>
        <Reveal><p className="mt-6">{t("about.p3")}</p></Reveal>
        <Reveal>
          <blockquote className="mt-12 border-l-2 border-gold pl-6 font-display text-2xl font-medium italic leading-snug text-forest sm:text-3xl">
            {t("about.quote")}
          </blockquote>
        </Reveal>
      </section>

      {/* Values */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="text-center font-display text-4xl font-semibold sm:text-5xl">{t("about.valuesTitle")}</h2>
            <div className="mx-auto mt-3 h-px w-16 bg-gold" />
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="border-t-2 border-gold pt-5">
                  <h3 className="font-display text-2xl font-semibold">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Craft band */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <Reveal>
          <div className="grid grid-cols-2 gap-4">
            <img src="/brand/tissue.webp" alt="" className="w-full object-cover" loading="lazy" />
            <img src="/brand/hangtag.webp" alt="" className="w-full object-cover" loading="lazy" />
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div>
            <p className="eyebrow">{t("about.craftEyebrow")}</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {t("about.craftTitle1")}
              <br />
              <em className="font-medium italic text-gold">{t("about.craftTitle2")}</em>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-charcoal/75">{t("about.craftText")}</p>
            <Link to="/shop" className="btn-primary mt-9">{t("about.craftCta")}</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
