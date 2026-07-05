import { Link } from "react-router-dom";
import { useCart, lineKey } from "../context/CartContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";

// Slide-in mini cart, opened automatically when an item is added.
export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, updateQuantity, removeItem, subtotalCents } = useCart();
  const { t, price } = useLocale();

  return (
    <div className={`fixed inset-0 z-[60] ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
          <h2 className="font-display text-2xl font-semibold text-forest">{t("drawer.title")}</h2>
          <button onClick={closeDrawer} className="p-1 text-charcoal/60 hover:text-forest" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-charcoal/50">{t("cart.empty")}</p>
          ) : (
            items.map((line) => {
              const key = lineKey(line);
              return (
                <div key={key} className="flex gap-4 border-b border-charcoal/10 py-5">
                  <div className="h-24 w-[72px] shrink-0 overflow-hidden bg-sand/30">
                    {line.image && <img src={line.image} alt={line.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-base font-semibold leading-snug text-forest">{line.name}</p>
                      <span className="shrink-0 text-sm">{price(line.priceCents * line.quantity)}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-charcoal/50">
                      {line.size && <>{t("cart.size", { size: line.size })} · </>}
                      {line.personalization && <>{t("cart.name", { name: line.personalization })} · </>}
                      {t("cart.each", { price: price(line.priceCents) })}
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-2">
                      <div className="flex items-center border border-charcoal/20">
                        <button className="px-2.5 py-1 text-charcoal/70 hover:text-forest" onClick={() => updateQuantity(key, line.quantity - 1)}>−</button>
                        <span className="w-6 text-center text-xs">{line.quantity}</span>
                        <button className="px-2.5 py-1 text-charcoal/70 hover:text-forest" onClick={() => updateQuantity(key, line.quantity + 1)}>+</button>
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="text-[11px] uppercase tracking-[0.14em] text-charcoal/45 underline-offset-4 hover:text-terracotta hover:underline"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-charcoal/10 bg-white px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-charcoal/60">
                {t("cart.subtotal")}
              </span>
              <span className="font-display text-xl font-semibold text-forest">{price(subtotalCents)}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/cart" onClick={closeDrawer} className="btn-outline-dark">
                {t("drawer.viewCart")}
              </Link>
              <Link to="/checkout" onClick={closeDrawer} className="btn-primary">
                {t("drawer.checkout")}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
