import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale.ts";
import type { Product } from "../types.ts";

export default function ProductCard({ product }: { product: Product }) {
  const { t, pick, price } = useLocale();
  const [primary, secondary] = product.images;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-sand/30">
        <div className="aspect-[4/5]">
          {primary && (
            <img
              src={primary.url}
              alt={primary.alt || product.name}
              loading="lazy"
              className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.04] ${
                secondary ? "group-hover:opacity-0" : ""
              }`}
            />
          )}
          {secondary && (
            <img
              src={secondary.url}
              alt={secondary.alt || product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </div>
        {product.isSet && (
          <span className="absolute left-3 top-3 bg-forest/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sand">
            {t("badge.set")}
          </span>
        )}
        {product.personalizable && (
          <span className="absolute left-3 top-3 bg-terracotta/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory">
            {t("badge.personalizable")}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-charcoal/50 text-[12px] font-medium uppercase tracking-[0.25em] text-ivory">
            {t("badge.soldOut")}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold leading-snug text-forest transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <span className="shrink-0 text-sm font-medium text-charcoal/80">{price(product.priceCents)}</span>
      </div>
      <p className="mt-0.5 text-[12px] uppercase tracking-[0.16em] text-charcoal/50">{pick(product.color)}</p>
    </Link>
  );
}
