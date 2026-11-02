import { useEffect,useState } from "react";
import { commerce } from "../commerce.ts";
import type { Sale } from "../commerce.ts";
import { adminApi } from "../api.ts";
import type { AdminMe,AdminProduct } from "../api.ts";
import { Field,Notice,PageTitle,SaleList } from "../components.tsx";
export default function Sales({reservations=false}:{reservations?:boolean}) {
 const [sales,setSales]=useState<Sale[]|null>(null);const [error,setError]=useState("");
 const [admins,setAdmins]=useState<AdminMe[]>([]);const [products,setProducts]=useState<AdminProduct[]>([]);
 const [filters,setFilters]=useState({q:"",from:"",to:"",paymentMethod:"",salespersonId:"",productId:""});
 const query=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v){if(k==="from")query.set(k,new Date(`${v}T00:00:00`).toISOString());else if(k==="to"){const d=new Date(`${v}T00:00:00`);d.setDate(d.getDate()+1);query.set(k,d.toISOString());}else query.set(k,v);}});if(reservations)query.set("reservations","true");const qs=query.toString();
 useEffect(()=>{Promise.all([adminApi.admins(),adminApi.products()]).then(([a,p])=>{setAdmins(a);setProducts(p);}).catch(e=>setError(e.message));},[]);
 useEffect(()=>{let active=true;setSales(null);const timer=setTimeout(()=>{commerce.sales(qs).then(s=>{if(active){setSales(s);setError("");}}).catch(e=>{if(active)setError(e.message);});},200);return()=>{active=false;clearTimeout(timer);};},[qs]);
 const set=(k:keyof typeof filters,v:string)=>setFilters(f=>({...f,[k]:v}));
 return <><PageTitle title={reservations?"Réservations":"Historique des ventes"} sub={reservations?"Articles mis de côté jusqu’à confirmation du virement ou annulation. Aucune expiration automatique.":"Retrouvez les ventes, corrigez les erreurs et enregistrez les retours."}/>
 <div className="admin-card mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field label="Rechercher une vente, un client ou un produit"><input className="field" value={filters.q} onChange={e=>set("q",e.target.value)}/></Field><Field label="Du"><input type="date" className="field" value={filters.from} onChange={e=>set("from",e.target.value)}/></Field><Field label="Au (inclus)"><input type="date" className="field" value={filters.to} onChange={e=>set("to",e.target.value)}/></Field><Field label="Paiement"><select className="field" value={filters.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}><option value="">Tous</option><option value="cash">Espèces</option><option value="interac">Interac</option><option value="legacy">Ancien paiement</option></select></Field><Field label="Vendeur"><select className="field" value={filters.salespersonId} onChange={e=>set("salespersonId",e.target.value)}><option value="">Tous</option><option value="online">Boutique en ligne</option>{admins.map(a=><option key={a.id} value={a.id}>{a.name||a.email}</option>)}</select></Field><Field label="Produit"><select className="field" value={filters.productId} onChange={e=>set("productId",e.target.value)}><option value="">Tous</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><a className="admin-secondary justify-self-start" href={`/api/admin/sales?${qs}&export=csv`}>Exporter ces résultats (CSV)</a></div>
 {error&&<Notice>{error}</Notice>}<section className="admin-card p-0">{sales?<SaleList sales={sales}/>:!error&&<p className="p-5">Chargement…</p>}</section></>;
}
