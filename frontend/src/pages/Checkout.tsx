import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.tsx";
import { useConfig } from "../context/ConfigContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";
import { api } from "../lib/api.ts";
import WhatsAppIcon from "../components/WhatsAppIcon.tsx";
import HowItWorks from "../components/HowItWorks.tsx";
import type { CustomerPayload, DeliveryMethod } from "../types.ts";

const PROVINCES = ["QC", "ON", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];

export default function Checkout() {
  const { items, subtotalCents, clear } = useCart();
  const { t, lang, price } = useLocale();
  const config = useConfig();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");

  const [form, setForm] = useState<CustomerPayload>({
    name: "", email: "", phone: "", address_line: "",
    city: "", province: "QC", postal_code: "", note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h1 className="font-display text-4xl font-semibold">{t("checkout.title")}</h1>
        <p className="mt-4 text-sm text-charcoal/60">{t("cart.empty")}</p>
        <Link to="/shop" className="btn-primary mt-9">{t("cart.shopCta")}</Link>
      </div>
    );
  }

  const shipping = deliveryMethod === "pickup" ? 0 : subtotalCents >= 10000 ? 0 : 1200;
  const pickupNote = lang === "fr" ? config.pickupNoteFr : config.pickupNoteEn;
  const set = (field: keyof CustomerPayload) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.createOrder({
        customer: form,
        deliveryMethod,
        lang,
        items: items.map((l) => ({
          slug: l.slug,
          quantity: l.quantity,
          size: l.size ?? undefined,
          personalization: l.personalization ?? undefined,
        })),
      });
      clear();
      navigate(`/order/${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSubmitting(false);
    }
  };

  const label = (key: string, required = true) => (
    <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">
      {t(key)}{required ? " *" : ""}
    </span>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("checkout.title")}</h1>

      <div className="mt-8">
        <HowItWorks compact />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="space-y-5">
          <fieldset>
            <legend className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">
              {t("checkout.delivery")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["shipping", "pickup"] as DeliveryMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                    deliveryMethod === method ? "border-forest bg-forest/5" : "border-charcoal/20 hover:border-forest/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === method}
                    onChange={() => setDeliveryMethod(method)}
                    className="mt-1 accent-[#183a2d]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-forest">
                      {method === "shipping" ? t("checkout.deliveryShipping") : t("checkout.deliveryPickup")}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-charcoal/60">
                      {method === "shipping"
                        ? t("footer.careShipping")
                        : pickupNote || t("footer.based")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              {label("checkout.fullName")}
              <input required className="field" value={form.name} onChange={set("name")} autoComplete="name" />
            </label>
            <label className="block">
              {label("checkout.email")}
              <input required type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              {label("checkout.phone")}
              <input required className="field" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+1 …" />
            </label>
          </div>
          {deliveryMethod === "shipping" && (
            <>
              <label className="block">
                {label("checkout.address")}
                <input required className="field" value={form.address_line} onChange={set("address_line")} autoComplete="street-address" />
              </label>
              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block">
                  {label("checkout.city")}
                  <input required className="field" value={form.city} onChange={set("city")} />
                </label>
                <label className="block">
                  {label("checkout.province")}
                  <select className="field" value={form.province} onChange={set("province")}>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label className="block">
                  {label("checkout.postal")}
                  <input required className="field" value={form.postal_code} onChange={set("postal_code")} autoComplete="postal-code" />
                </label>
              </div>
            </>
          )}
          <label className="block">
            {label("checkout.note", false)}
            <textarea rows={3} className="field" value={form.note} onChange={set("note")} placeholder={t("checkout.notePlaceholder")} />
          </label>

          <div className="flex items-start gap-3 border border-[#1fa855]/30 bg-[#1fa855]/5 p-4 text-[13px] leading-relaxed text-charcoal/75">
            <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#1fa855]" />
            <p>{t("checkout.whatsappInfo")}</p>
          </div>

          {error && <p className="text-sm font-medium text-terracotta">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50 sm:w-auto sm:px-16">
            {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
          </button>
        </form>

        <aside className="h-fit border border-charcoal/10 bg-white p-7">
          <h2 className="font-display text-2xl font-semibold">{t("checkout.yourOrder")}</h2>
          <ul className="mt-4 divide-y divide-charcoal/10 text-sm">
            {items.map((l, i) => (
              <li key={i} className="flex justify-between gap-3 py-3">
                <span className="text-charcoal/75">
                  {l.name} × {l.quantity}
                  {l.size && (
                    <span className="block text-[11px] uppercase tracking-wider text-charcoal/45">
                      {t("cart.size", { size: l.size })}
                    </span>
                  )}
                  {l.personalization && (
                    <span className="block text-[11px] uppercase tracking-wider text-charcoal/45">
                      {t("cart.name", { name: l.personalization })}
                    </span>
                  )}
                </span>
                <span className="shrink-0">{price(l.priceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2.5 border-t border-charcoal/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.subtotal")}</dt><dd>{price(subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.shipping")}</dt><dd>{shipping === 0 ? t("cart.free") : price(shipping)}</dd></div>
            <div className="flex justify-between border-t border-charcoal/10 pt-3.5 font-display text-lg font-semibold text-forest">
              <dt>{t("cart.total")}</dt><dd>{price(subtotalCents + shipping)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
