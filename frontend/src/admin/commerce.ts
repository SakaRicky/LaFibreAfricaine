import { request } from "./api.ts";
import type { AdminProduct } from "./api.ts";
export interface SaleItem { id:number; productId:number; productName:string; size:string|null; quantity:number; returnedQuantity:number; unitPriceCents:number }
export interface SaleEvent { id:number; actor:string; action:string; reason:string; createdAt:string; detail:Record<string,unknown> }
export interface Sale {
  id:number; orderNumber:string; customerName:string; email:string; phone:string; addressLine:string; note:string;
  paymentMethod:string; paymentStatus:string; fulfillment:string; lifecycle:string; salespersonName:string;
  salespersonId:number|null; createdAt:string; subtotalCents:number; totalCents:number; discountCents:number;
  shippingCents:number; refundedCents:number; version:number; items:SaleItem[]; events:SaleEvent[];
}
export interface Inventory {
  products:AdminProduct[];
  reservations:{productId:number;size:string|null;quantity:number}[];
  movements:{id:number;product:{name:string};size:string|null;delta:number;reason:string;actor:string;createdAt:string}[];
}
export interface DashboardData {
  netSalesCents:number; refundedCents:number; paidCount:number; pendingCount:number; pendingCents:number;
  recent:Sale[]; pending:Sale[]; lowStock:{productId:number;name:string;size:string|null;stock:number}[];
}
export const commerce = {
  dashboard:()=>request<DashboardData>("/api/admin/dashboard"),
  sales:(query="")=>request<Sale[]>(`/api/admin/sales?${query}`),
  sale:(id:string|number)=>request<Sale>(`/api/admin/sales/${id}`),
  create:(data:unknown)=>request<Sale>("/api/admin/sales",{method:"POST",body:JSON.stringify(data)}),
  change:(id:number,data:unknown)=>request<Sale>(`/api/admin/sales/${id}`,{method:"PATCH",body:JSON.stringify(data)}),
  inventory:()=>request<Inventory>("/api/admin/inventory"),
  adjust:(data:unknown)=>request<{ok:boolean}>("/api/admin/inventory/adjust",{method:"POST",body:JSON.stringify(data)}),
  variant:(data:unknown)=>request<{ok:boolean}>("/api/admin/inventory/variants",{method:"POST",body:JSON.stringify(data)}),
};
export const fulfillmentLabels:Record<string,string>={awaiting_pickup:"À récupérer",awaiting_delivery:"À livrer",completed:"Terminée"};
export const paymentLabels:Record<string,string>={awaiting:"Paiement à confirmer",paid:"Payée",refunded:"Remboursée",cancelled:"Annulée"};
export const methodLabels:Record<string,string>={cash:"Espèces",interac:"Interac",legacy:"Ancien paiement"};
export const dateLabel=(value:string)=>new Date(value).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
