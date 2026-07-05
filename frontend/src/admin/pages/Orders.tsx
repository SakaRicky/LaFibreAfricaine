import { useEffect, useState } from "react";
import { adminApi, cad, statusInfo, ORDER_STATUSES } from "../api.ts";
import type { AdminOrder } from "../api.ts";

const waFor = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/${d.length === 10 ? `1${d}` : d}` : null;
};

export default function Orders() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = (status: string) => {
    setOrders(null);
    adminApi.orders(status || undefined).then(setOrders).catch((e: Error) => setError(e.message));
  };

  useEffect(() => load(filter), [filter]);

  const changeStatus = async (order: AdminOrder, status: string) => {
    try {
      const updated = await adminApi.setOrderStatus(order.id, status);
      setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Commandes</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] ${
            filter === "" ? "bg-forest text-ivory" : "border border-charcoal/20 text-charcoal hover:border-forest"
          }`}
        >
          Toutes
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] ${
              filter === s.value ? "bg-forest text-ivory" : "border border-charcoal/20 text-charcoal hover:border-forest"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {orders === null ? (
        <p className="mt-10 text-sm text-charcoal/50">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-sm text-charcoal/50">Aucune commande.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => {
            const info = statusInfo(o.status);
            const open = openId === o.id;
            const wa = waFor(o.phone);
            return (
              <div key={o.id} className="border border-charcoal/10 bg-white">
                <button
                  onClick={() => setOpenId(open ? null : o.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-forest">{o.orderNumber}</span>
                  <span className="text-sm text-charcoal/70">{o.customerName}</span>
                  <span className="text-[12px] text-charcoal/50">
                    {new Date(o.createdAt).toLocaleDateString("fr-CA")} ·{" "}
                    {o.deliveryMethod === "pickup" ? "Ramassage" : `${o.city}, ${o.province}`}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="font-medium">{cad(o.totalCents)}</span>
                    <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${info.color}`}>
                      {info.label}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-charcoal/10 px-5 py-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">Articles</h3>
                        <ul className="mt-2 divide-y divide-charcoal/10 text-sm">
                          {o.items.map((i) => (
                            <li key={i.id} className="flex justify-between py-2">
                              <span>
                                {i.quantity}× {i.productName}
                                {i.size && <span className="text-charcoal/50"> — pointure {i.size}</span>}
                              </span>
                              <span>{cad(i.unitPriceCents * i.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm text-charcoal/60">
                          Sous-total {cad(o.subtotalCents)} · Livraison {o.shippingCents === 0 ? "gratuite" : cad(o.shippingCents)}
                        </p>
                      </div>
                      <div className="text-sm">
                        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">Client</h3>
                        <p className="mt-2">{o.customerName}</p>
                        <p><a href={`mailto:${o.email}`} className="text-forest underline underline-offset-2">{o.email}</a></p>
                        {o.phone && <p>{o.phone}</p>}
                        {o.deliveryMethod === "shipping" ? (
                          <p className="mt-1 text-charcoal/70">{o.addressLine}, {o.city}, {o.province} {o.postalCode}</p>
                        ) : (
                          <p className="mt-1 text-charcoal/70">Ramassage à Montréal (Lachine)</p>
                        )}
                        {o.note && <p className="mt-2 italic text-charcoal/60">« {o.note} »</p>}

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener noreferrer"
                               className="bg-[#1fa855] px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#178a45]">
                              WhatsApp client
                            </a>
                          )}
                          <label className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-charcoal/60">
                            Statut :
                            <select
                              value={o.status}
                              onChange={(e) => changeStatus(o, e.target.value)}
                              className="border border-charcoal/20 bg-white px-2 py-1.5 text-[13px] normal-case tracking-normal"
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <p className="mt-2 text-[11px] text-charcoal/45">
                          « Payée » envoie le courriel de remerciement (code -10 %) · « Expédiée » envoie l'avis d'expédition.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
