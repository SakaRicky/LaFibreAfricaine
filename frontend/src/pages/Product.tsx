import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.ts";
import { whatsappLink } from "../lib/whatsapp.ts";
import { useCart } from "../context/CartContext.tsx";
import { useConfig } from "../context/ConfigContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";
import ProductCard from "../components/ProductCard.tsx";
import Reveal from "../components/Reveal.tsx";
import WhatsAppIcon from "../components/WhatsAppIcon.tsx";
import type { Product as ProductType } from "../types.ts";

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  return (
    <div
      className={`aspect-[4/5] overflow-hidden bg-sand/30 ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      }}
      onMouseLeave={() => setZoom(false)}
      onClick={() => setZoom((v) => !v)}
    >
      <img
        src={src}
        alt={alt}
        style={{ transformOrigin: origin, transform: zoom ? "scale(2)" : "scale(1)" }}
        className="h-full w-full object-cover transition-transform duration-300"
      />
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-charcoal/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-[13px] font-semibold uppercase tracking-[0.16em] text-forest"
      >
        {title}
        <span className="text-gold">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-charcoal/75">{children}</div>}
    </div>
  );
}

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { whatsappNumber } = useConfig();
  const { t, pick, price } = useLocale();

  const [product, setProduct] = useState<(ProductType & { related: ProductType[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setError(null);
    setImageIdx(0);
    setSize(null);
    setPersonalization("");
    setQuantity(1);
    setWarn(null);
    api.product(slug).then(setProduct).catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("product.notFound")}</h1>
        <Link to="/shop" className="btn-outline-dark mt-8">{t("product.backToShop")}</Link>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-[4/5] shimmer" />
          <div>
            <div className="h-10 w-2/3 shimmer" />
            <div className="mt-4 h-6 w-24 shimmer" />
            <div className="mt-8 h-24 w-full shimmer" />
          </div>
        </div>
      </div>
    );
  }

  const hasSizes = product.sizes.length > 0;
  const soldOut = product.stock === 0;
  const story = pick(product.story);

  const handleAdd = () => {
    if (hasSizes && !size) {
      setWarn(t("product.selectSize"));
      return;
    }
    if (product.personalizable && !personalization.trim()) {
      setWarn(t("product.enterName"));
      return;
    }
    setWarn(null);
    addItem(
      {
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        image: product.images[0]?.url,
        size,
        personalization: product.personalizable ? personalization.trim() : null,
      },
      quantity
    );
  };

  const waHref = whatsappLink(
    whatsappNumber,
    t("wa.productMessage", { name: product.name, url: window.location.href })
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="text-[12px] uppercase tracking-[0.14em] text-charcoal/50">
        <Link to="/shop" className="hover:text-gold">{t("nav.shopAll")}</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop/${product.collectionSlug}`} className="hover:text-gold">
          {pick(product.collectionName)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal/80">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <ZoomImage
            src={product.images[imageIdx]?.url ?? ""}
            alt={product.images[imageIdx]?.alt || product.name}
          />
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setImageIdx(i)}
                  className={`h-20 w-16 overflow-hidden border-2 transition-colors ${
                    i === imageIdx ? "border-gold" : "border-transparent hover:border-gold/40"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.isSet && <p className="eyebrow">{t("product.setEyebrow")}</p>}
          <h1 className="mt-1 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-3xl font-medium text-charcoal">{price(product.priceCents)}</p>
          <p className="mt-2 text-[12px] uppercase tracking-[0.2em] text-charcoal/50">
            {pick(product.color)} · {t("product.origin")}
          </p>

          <p className="mt-6 text-[15px] leading-relaxed text-charcoal/80">{pick(product.description)}</p>

          {hasSizes && (
            <div className="mt-8">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-forest">
                {t("product.size")}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const disabled = s.stock === 0;
                  return (
                    <button
                      key={s.size}
                      disabled={disabled}
                      onClick={() => setSize(s.size)}
                      className={`h-11 w-11 border text-sm font-medium transition-colors ${
                        size === s.size
                          ? "border-forest bg-forest text-ivory"
                          : disabled
                          ? "cursor-not-allowed border-charcoal/10 text-charcoal/30 line-through"
                          : "border-charcoal/25 text-charcoal hover:border-forest"
                      }`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.personalizable && (
            <div className="mt-8">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-forest">
                {t("product.personalization")}
              </p>
              <input
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                maxLength={20}
                placeholder={t("product.personalizationPlaceholder")}
                className="field max-w-sm"
              />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-charcoal/25">
              <button
                className="px-4 py-3 text-lg text-charcoal/70 hover:text-forest"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                className="px-4 py-3 text-lg text-charcoal/70 hover:text-forest"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className="btn-primary flex-1 disabled:opacity-40 sm:flex-none sm:px-14"
            >
              {soldOut ? t("product.soldOut") : t("product.addToCart")}
            </button>
          </div>
          {warn && <p className="mt-3 text-sm text-terracotta">{warn}</p>}
          {!soldOut && product.stock <= 3 && (
            <p className="mt-3 text-[13px] font-medium text-terracotta">
              {t("product.lowStock", { count: product.stock })}
            </p>
          )}

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-forest underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            {t("product.whatsapp")}
          </a>

          <div className="mt-10">
            {story && (
              <Accordion title={t("product.storyTitle")} defaultOpen>
                {story} {t("product.storySuffix")}
              </Accordion>
            )}
            <Accordion title={t("product.materialsTitle")} defaultOpen={!story}>
              <p>{pick(product.materials)}.</p>
              <p className="mt-2">{t("product.care")}</p>
            </Accordion>
            <Accordion title={t("product.shippingTitle")}>{t("product.shippingText")}</Accordion>
          </div>
        </div>
      </div>

      {/* Related */}
      {product.related.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">
              {t("product.related")}
            </h2>
            <div className="mx-auto mt-3 h-px w-16 bg-gold" />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {product.related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
