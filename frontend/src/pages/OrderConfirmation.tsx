import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.ts";
import { whatsappLink } from "../lib/whatsapp.ts";
import { useConfig } from "../context/ConfigContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";
import WhatsAppIcon from "../components/WhatsAppIcon.tsx";
import type { OrderDetails } from "../types.ts";

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { whatsappNumber } = useConfig();
  const { t, price } = useLocale();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    api.order(orderNumber).then(setOrder).catch((e: Error) => setError(e.message));
  }, [orderNumber]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("confirmation.notFound")}</h1>
        <Link to="/shop" className="btn-primary mt-9">{t("product.backToShop")}</Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mx-auto h-24 w-24 rounded-full shimmer" />
        <div className="mx-auto mt-8 h-10 w-2/3 shimmer" />
        <div className="mx-auto mt-6 h-40 w-full shimmer" />
      </div>
    );
  }

  // Pre-filled WhatsApp message with the order summary for the admin.
  const itemLines = order.items
    .map((i) => `• ${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}${i.personalization ? ` — "${i.personalization}"` : ""}`)
    .join("\n");
  const waHref = whatsappLink(
    whatsappNumber,
    t("wa.orderMessage", {
      number: order.orderNumber,
      total: price(order.totalCents),
      items: itemLines,
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <img src="/brand/seal.webp" alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
      <p className="eyebrow mt-7">{t("confirmation.thanks")}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{t("confirmation.title")}</h1>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-charcoal/70">
        {t("confirmation.text", { number: order.orderNumber })}
      </p>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn mt-8 w-full bg-[#1fa855] text-white hover:bg-[#178a45] sm:w-auto sm:px-12"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t("confirmation.whatsappCta")}
      </a>
      <p className="mt-3 text-[12px] text-charcoal/50">{t("confirmation.whatsappHint")}</p>

      <div className="mt-12 border border-charcoal/10 bg-white p-7 text-left">
        <h2 className="font-display text-xl font-semibold">{t("confirmation.details")}</h2>
        <ul className="mt-3 divide-y divide-charcoal/10 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-3">
              <span className="text-charcoal/75">
                {item.name} × {item.quantity}
                {item.size && (
                  <span className="block text-[11px] uppercase tracking-wider text-charcoal/45">
                    {t("cart.size", { size: item.size })}
                  </span>
                )}
                {item.personalization && (
                  <span className="block text-[11px] uppercase tracking-wider text-charcoal/45">
                    {t("cart.name", { name: item.personalization })}
                  </span>
                )}
              </span>
              <span>{price(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2.5 border-t border-charcoal/10 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.subtotal")}</dt><dd>{price(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-charcoal/60">{t("cart.shipping")}</dt><dd>{order.shippingCents === 0 ? t("cart.free") : price(order.shippingCents)}</dd></div>
          <div className="flex justify-between border-t border-charcoal/10 pt-3.5 font-display text-lg font-semibold text-forest">
            <dt>{t("cart.total")}</dt><dd>{price(order.totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-charcoal/45">
          {order.deliveryMethod === "pickup"
            ? t("confirmation.pickupLine")
            : t("confirmation.shippingTo", { city: order.city, province: order.province })}
        </p>
      </div>

      <Link to="/shop" className="btn-outline-dark mt-12">{t("confirmation.continue")}</Link>
    </div>
  );
}
