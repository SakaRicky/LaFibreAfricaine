import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.ts";
import { useLocale } from "../hooks/useLocale.ts";
import ProductCard from "../components/ProductCard.tsx";
import Reveal from "../components/Reveal.tsx";
import { ProductGridSkeleton } from "../components/Skeleton.tsx";
import type { Product } from "../types.ts";

export default function Shop() {
  const { collection } = useParams<{ collection?: string }>();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sort, setSort] = useState("default");

  useEffect(() => {
    setProducts(null);
    const params: Record<string, string> = {};
    if (collection) params.collection = collection;
    if (sort !== "default") params.sort = sort;
    api.products(params).then(setProducts).catch(console.error);
  }, [collection, sort]);

  const filters = [
    { slug: null, label: t("shop.all") },
    { slug: "matching-sets", label: t("nav.matchingSets") },
    { slug: "bags", label: t("nav.bags") },
    { slug: "sandals", label: t("nav.sandals") },
  ];

  const collectionTitles: Record<string, string> = {
    "matching-sets": t("nav.matchingSets"),
    bags: t("nav.bags"),
    sandals: t("nav.sandals"),
  };
  const title = collection ? collectionTitles[collection] ?? t("shop.title") : t("shop.title");

  return (
    <div>
      {/* Banner */}
      <section className="relative overflow-hidden bg-forest">
        <img
          src="/brand/shop_hero.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest/30 to-forest/80" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-center">
          <Reveal>
            <p className="eyebrow">La Fibre Africaine</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-ivory sm:text-6xl">{title}</h1>
            <p className="mt-4 text-sm tracking-[0.14em] text-ivory/70">{t("shop.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Filters + sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = (collection ?? null) === f.slug;
              return (
                <Link
                  key={f.label}
                  to={f.slug ? `/shop/${f.slug}` : "/shop"}
                  className={`px-4 py-2 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors ${
                    active
                      ? "bg-forest text-ivory"
                      : "border border-charcoal/20 text-charcoal hover:border-forest hover:text-forest"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-charcoal/20 bg-white px-3 py-2 text-[13px] text-charcoal outline-none focus:border-gold"
          >
            <option value="default">{t("shop.sortFeatured")}</option>
            <option value="price_asc">{t("shop.sortPriceAsc")}</option>
            <option value="price_desc">{t("shop.sortPriceDesc")}</option>
            <option value="name">{t("shop.sortName")}</option>
          </select>
        </div>

        {/* Grid */}
        {products === null ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <p className="py-24 text-center text-sm tracking-wide text-charcoal/50">{t("shop.empty")}</p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
