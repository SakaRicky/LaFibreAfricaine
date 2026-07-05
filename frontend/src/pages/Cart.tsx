import { Link } from "react-router-dom";
import { useCart, lineKey } from "../context/CartContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";

const FREE_SHIPPING_CENTS = 10000;
const FLAT_SHIPPING_CENTS = 1200;

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotalCents } = useCart();
  const { t, price } = useLocale();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h1 className="font-display text-4xl font-semibold">{t("cart.title")}</h1>
        <p className="mt-4 text-sm text-charcoal/60">{t("cart.empty")}</p>
        <Link to="/shop" className="btn-primary mt-9">{t("cart.shopCta")}</Link>
      </div>
    );
  }

  const shipping = subtotalCents >= FREE_SHIPPING_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const remaining = FREE_SHIPPING_CENTS - subtotalCents;

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("cart.title")}</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="divide-y divide-charcoal/10">
          {items.map((line) => {
            const key = lineKey(line);
            return (
              <div key={key} className="flex gap-5 py-6">
                <Link to={`/product/${line.slug}`} className="block h-36 w-28 shrink-0 overflow-hidden bg-sand/30">
                  {line.image && <img src={line.image} alt={line.name} className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-4">
                    <Link
                      to={`/product/${line.slug}`}
                      className="font-display text-xl font-semibold text-forest transition-colors hover:text-gold"
                    >
                      {line.name}
                    </Link>
                    <span className="text-sm font-medium">{price(line.priceCents * line.quantity)}</span>
                  </div>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-charcoal/50">
                    {line.size && <>{t("cart.size", { size: line.size })} · </>}
                    {line.personalization && <>{t("cart.name", { name: line.personalization })} · </>}
                    {t("cart.each", { price: price(line.priceCents) })}
                  </p>
                  <div className="mt-auto flex items-center gap-5 pt-3">
                    <div className="flex items-center border border-charcoal/25">
                      <button className="px-3 py-1.5 text-charcoal/70 hover:text-forest" onClick={() => updateQuantity(key, line.quantity - 1)}>−</button>
                      <span className="w-7 text-center text-sm">{line.quantity}</span>
                      <button className="px-3 py-1.5 text-charcoal/70 hover:text-forest" onClick={() => updateQuantity(key, line.quantity + 1)}>+</button>
                    </div>
                    <button
                      onClick={() => removeItem(key)}
                      className="text-[12px] uppercase tracking-[0.14em] text-charcoal/50 underline-offset-4 hover:text-terracotta hover:underline"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit border border-charcoal/10 bg-white p-7">
          <h2 className="font-display text-2xl font-semibold">{t("cart.summary")}</h2>
          {remaining > 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-charcoal/70">
              {t("cart.away", { amount: price(remaining) })}
            </p>
          ) : (
            <p className="mt-3 text-[13px] font-medium text-forest">{t("cart.shipsFree")}</p>
          )}
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.subtotal")}</dt><dd>{price(subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.shipping")}</dt><dd>{shipping === 0 ? t("cart.free") : price(shipping)}</dd></div>
            <div className="flex justify-between border-t border-charcoal/10 pt-3.5 font-display text-lg font-semibold text-forest">
              <dt>{t("cart.total")}</dt><dd>{price(subtotalCents + shipping)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn-primary mt-7 w-full">{t("cart.checkout")}</Link>
          <Link
            to="/shop"
            className="mt-4 block text-center text-[12px] uppercase tracking-[0.16em] text-charcoal/50 transition-colors hover:text-gold"
          >
            {t("cart.continue")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
