import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { commerce } from "../commerce.ts";
import type { DashboardData } from "../commerce.ts";
import { cad } from "../api.ts";
import { Notice,PageTitle,SaleList } from "../components.tsx";
export default function Dashboard() {
 const [data,setData]=useState<DashboardData|null>(null);const [error,setError]=useState("");
 useEffect(()=>{commerce.dashboard().then(setData).catch(e=>setError(e.message));},[]);
 return <><PageTitle title="Tableau de bord" sub="Vos ventes, paiements et stocks au même endroit. Tous les montants sont en dollars canadiens."/>{error&&<Notice>{error}</Notice>}{!data&&!error&&<p>Chargement…</p>}{data&&<>
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
 ["Ventes nettes · depuis le début",cad(data.netSalesCents)], ["Ventes payées",String(data.paidCount)], ["Paiements à confirmer",`${data.pendingCount} · ${cad(data.pendingCents)}`], ["Remboursements",cad(data.refundedCents)],
 ].map(([label,value])=><div className="admin-card" key={label}><p className="text-sm text-charcoal/65">{label}</p><p className="mt-3 text-2xl font-semibold text-forest">{value}</p></div>)}</div>
 <div className="mt-6 grid gap-6 xl:grid-cols-2"><section className="admin-card"><div className="mb-3 flex justify-between gap-3"><h2 className="text-2xl">Ventes récentes</h2><Link className="text-sm underline" to="/admin/sales">Tout voir</Link></div><SaleList sales={data.recent}/></section>
 <section className="admin-card"><div className="mb-3 flex justify-between gap-3"><h2 className="text-2xl">Virements à confirmer</h2><Link className="text-sm underline" to="/admin/reservations">Réservations</Link></div><p className="mb-3 text-sm text-charcoal/65">Vérifiez votre compte bancaire avant de confirmer. Le stock est déjà réservé.</p><SaleList sales={data.pending}/></section></div>
 <section className="admin-card mt-6"><h2 className="text-2xl">Stock faible · 3 articles ou moins</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.lowStock.map(p=><Link key={`${p.productId}:${p.size}`} className="flex justify-between gap-3 rounded-lg bg-ivory p-3 text-sm" to={`/admin/inventory?product=${p.productId}`}><span>{p.name}{p.size&&` · ${p.size}`}</span><strong className={p.stock===0?"text-terracotta":"text-forest"}>{p.stock}</strong></Link>)}</div>{!data.lowStock.length&&<p className="mt-3 text-sm">Aucun stock faible.</p>}</section>
 </>}</>;
}
