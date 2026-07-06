import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { useLocale } from "../hooks/useLocale.ts";
import ProductCard from "../components/ProductCard.tsx";
import NewsletterSignup from "../components/NewsletterSignup.tsx";
import HowItWorks from "../components/HowItWorks.tsx";
import Reveal from "../components/Reveal.tsx";
import { ProductGridSkeleton } from "../components/Skeleton.tsx";
import type { CollectionInfo, Product } from "../types.ts";

export default function Home() {
  const { t, pick } = useLocale();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [featured, setFeatured] = useState<Product[] | null>(null);

  useEffect(() => {
    api.collections().then(setCollections).catch(console.error);
    api.products({ featured: "true" }).then(setFeatured).catch(console.error);
  }, []);

  const valueProps = [
    { title: t("values.sourced"), sub: t("values.sourcedSub"), icon: "M6 21C6 13 12 7 21 7c0 9-6 14-13 14H6Zm0 0c0-6 3-10 9-13" },
    { title: t("values.quality"), sub: t("values.qualitySub"), icon: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z" },
    { title: t("values.love"), sub: t("values.loveSub"), icon: "M12 21c-4.5-3.2-8-6.4-8-10.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 3.8c0 3.8-3.5 7-8 10.2Z" },
    { title: t("values.shipping"), sub: t("values.shippingSub"), icon: "M3 7h11v8H3V7Zm11 3h4l3 3v2h-7v-5Z" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[560px] overflow-hidden lg:min-h-[680px]">
        <img
          src="/brand/homepage_hero.webp"
          alt=""
          className="hero-img absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/75 via-charcoal/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-6 lg:min-h-[680px]">
          <div className="max-w-xl py-24">
            <Reveal>
              <div className="mb-4 h-px w-14 bg-gold" />
              <p className="eyebrow">{t("hero.eyebrow")}</p>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-3 font-display text-6xl font-semibold leading-[1.02] text-ivory sm:text-7xl">
                {t("hero.title")}
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/85">{t("hero.sub")}</p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link to="/shop" className="btn-gold">{t("hero.ctaShop")}</Link>
                <Link to="/about" className="btn-outline-light">{t("hero.ctaStory")}</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-charcoal/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-9 lg:grid-cols-4">
          {valueProps.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 shrink-0 text-gold">
                  <path d={v.icon} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-forest">{v.title}</p>
                  <p className="text-[12px] text-charcoal/60">{v.sub}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-semibold sm:text-5xl">{t("home.collections")}</h2>
          <div className="mx-auto mt-3 h-px w-16 bg-gold" />
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {collections.map((c, i) => (
            <Reveal key={c.slug} delay={i * 120}>
              <Link to={`/shop/${c.slug}`} className="group relative block overflow-hidden">
                <div className="aspect-[4/5] bg-sand/30">
                  {c.coverImage && (
                    <img
                      src={c.coverImage}
                      alt={pick(c.name)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-charcoal/75 via-transparent pb-9">
                  <h3 className="font-display text-3xl font-semibold text-ivory">{pick(c.name)}</h3>
                  <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.32em] text-sand transition-colors group-hover:text-gold">
                    {t("home.shopNow")} →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* Story band */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="eyebrow">{t("home.storyEyebrow")}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                {t("home.storyTitle1")}
                <br />
                <em className="font-medium italic text-gold">{t("home.storyTitle2")}</em>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-charcoal/75">{t("home.storyText")}</p>
              <Link to="/about" className="btn-primary mt-9">{t("home.storyCta")}</Link>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative overflow-hidden">
              <img src="/brand/shop_hero.webp" alt="" loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-gold/20" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-semibold sm:text-5xl">{t("home.bestSellers")}</h2>
          <div className="mx-auto mt-3 h-px w-16 bg-gold" />
        </Reveal>
        {featured === null ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 8).map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
        <div className="mt-14 text-center">
          <Link to="/shop" className="btn-outline-dark">{t("home.viewAll")}</Link>
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
