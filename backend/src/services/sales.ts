import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { Actor, HttpError, integer, moveStock } from "./stock.js";

export const saleInclude = { items: { orderBy: { id: "asc" as const } }, events: { orderBy: { id: "desc" as const } } };
export const fulfillmentValues = ["awaiting_pickup", "awaiting_delivery", "completed"];
export async function actorFor(id: number): Promise<Actor> {
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) throw new HttpError(401, "Veuillez vous reconnecter");
  return { id: admin.id, name: admin.name || admin.email };
}
export function text(value: unknown, max = 500) { return String(value ?? "").trim().slice(0, max); }
function fulfillment(value: unknown) {
  if (!fulfillmentValues.includes(String(value))) throw new HttpError(400, "Statut de livraison invalide");
  return String(value);
}
export async function event(tx: Prisma.TransactionClient, orderId: number, actor: Actor, action: string, reason: string, detail: unknown) {
  await tx.orderEvent.create({ data: { orderId, adminId: actor.id, actor: actor.name, action, reason, detail: JSON.parse(JSON.stringify(detail)) } });
}
export async function lockSale(tx: Prisma.TransactionClient, id: number, version: number) {
  const changed = await tx.order.updateMany({ where: { id, version }, data: { version: { increment: 1 } } });
  if (!changed.count) throw new HttpError(409, "Cette vente a changé. Actualisez avant de réessayer.");
  const sale = await tx.order.findUniqueOrThrow({ where: { id }, include: saleInclude });
  if (sale.lifecycle !== "active") throw new HttpError(409, "Cette vente est déjà annulée ou entièrement retournée.");
  return sale;
}

type Input = Record<string, unknown>;
async function allocate(tx: Prisma.TransactionClient, input: Input, actor: Actor, orderId: number) {
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) throw new HttpError(400, "Ajoutez au moins un article (100 maximum)");
  const items = input.items.map((raw: Input) => ({ productId: integer(raw.productId, "Produit", 1), size: raw.size ? text(raw.size, 100) : null, quantity: integer(raw.quantity, "Quantité", 1, 10000) }))
    .sort((a, b) => a.productId - b.productId || (a.size ?? "").localeCompare(b.size ?? ""));
  const keys = new Set<string>();
  const lines = [];
  for (const item of items) {
    const key = `${item.productId}:${item.size}`;
    if (keys.has(key)) throw new HttpError(400, "Regroupez les quantités d’un même article");
    keys.add(key);
    const product = await moveStock(tx, item.productId, item.size, -item.quantity, "Vente / réservation", actor, orderId);
    if (product.archived) throw new HttpError(400, "Ce produit est archivé");
    lines.push({ ...item, productName: product.name, unitPriceCents: product.priceCents });
  }
  const subtotalCents = lines.reduce((n, line) => n + line.quantity * line.unitPriceCents, 0);
  integer(subtotalCents, "Sous-total");
  const discountCents = integer(input.discountCents ?? 0, "Remise", 0, subtotalCents);
  return { lines, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}
function payment(input: Input) {
  if (!["cash", "interac"].includes(String(input.paymentMethod))) throw new HttpError(400, "Choisissez espèces ou Interac");
  // This confirmation must be explicit; neither fulfillment nor a generic edit can mark Interac paid.
  if (input.paymentMethod === "cash" && input.paymentReceived !== true) throw new HttpError(400, "Confirmez la réception des espèces");
  return { paymentMethod: String(input.paymentMethod), paymentStatus: input.paymentReceived === true ? "paid" : "awaiting" };
}
export async function createSale(input: Input, actor: Actor) {
  const requestKey = text(input.requestKey, 100);
  if (!/^[\w-]{16,100}$/.test(requestKey)) throw new HttpError(400, "Clé de transaction manquante");
  const existing = await prisma.order.findUnique({ where: { requestKey }, include: saleInclude });
  if (existing) return existing;
  try {
    return await prisma.$transaction(async tx => {
      const pay = payment(input);
      const fulfillmentStatus = fulfillment(input.fulfillment);
      if (pay.paymentStatus !== "paid" && fulfillmentStatus === "completed") throw new HttpError(400, "Confirmez le paiement avant de terminer la vente");
      const order = await tx.order.create({ data: {
        orderNumber: `LFA-${randomUUID().slice(0, 8).toUpperCase()}`, requestKey,
        customerName: text(input.customerName, 150), email: text(input.email, 150), phone: text(input.phone, 60),
        addressLine: text(input.addressLine), city: "", province: "", postalCode: "", note: text(input.note),
        subtotalCents: 0, totalCents: 0, shippingCents: 0, ...pay, fulfillment: fulfillmentStatus,
        status: pay.paymentStatus === "paid" ? "paid" : "confirmed",
        deliveryMethod: fulfillmentStatus === "awaiting_delivery" ? "shipping" : "pickup",
        salespersonId: actor.id, salespersonName: actor.name,
        paymentConfirmedAt: pay.paymentStatus === "paid" ? new Date() : null,
        paymentConfirmedBy: pay.paymentStatus === "paid" ? actor.id : null,
      } });
      const { lines, ...totals } = await allocate(tx, input, actor, order.id);
      const result = await tx.order.update({ where: { id: order.id }, data: { ...totals, items: { create: lines } }, include: saleInclude });
      await event(tx, order.id, actor, "created", "", { ...totals, ...pay, items: lines });
      return result;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      const duplicate = await prisma.order.findUnique({ where: { requestKey }, include: saleInclude });
      if (duplicate) return duplicate;
    }
    throw err;
  }
}

export async function changeSale(id: number, input: Input, actor: Actor) {
  const version = integer(input.version, "Version");
  const action = String(input.action);
  const reason = text(input.reason);
  if (["cancel", "return", "correct"].includes(action) && !reason) throw new HttpError(400, "Indiquez le motif");
  return prisma.$transaction(async tx => {
    const sale = await lockSale(tx, id, version);
    if (action === "confirm_payment") {
      if (sale.paymentStatus !== "awaiting" || input.paymentReceived !== true) throw new HttpError(400, "Confirmez que le virement Interac est réellement arrivé");
      await tx.order.update({ where: { id }, data: { paymentStatus: "paid", status: "paid", paymentConfirmedAt: new Date(), paymentConfirmedBy: actor.id } });
    } else if (action === "fulfillment") {
      const next = fulfillment(input.fulfillment);
      if (next === "completed" && sale.paymentStatus !== "paid") throw new HttpError(400, "Le paiement doit être confirmé avant de terminer");
      await tx.order.update({ where: { id }, data: { fulfillment: next, status: next === "completed" ? "delivered" : sale.status } });
    } else if (action === "cancel") {
      if (sale.items.some(i => i.returnedQuantity)) throw new HttpError(400, "Cette vente a déjà un retour. Retournez les articles restants.");
      if (sale.paymentStatus === "paid" && input.refundConfirmed !== true) throw new HttpError(400, "Confirmez le remboursement effectué manuellement");
      if (sale.fulfillment === "completed") throw new HttpError(400, "Utilisez un retour pour une vente déjà remise au client");
      for (const line of [...sale.items].sort((a,b) => a.productId-b.productId)) {
        await moveStock(tx, line.productId, line.size, line.quantity, `Annulation : ${reason}`, actor, id);
      }
      await tx.order.update({ where: { id }, data: { lifecycle: "cancelled", status: "cancelled", paymentStatus: sale.paymentStatus === "paid" ? "refunded" : "cancelled", refundedCents: sale.paymentStatus === "paid" ? sale.totalCents : 0 } });
    } else if (action === "return") {
      if (sale.paymentStatus !== "paid") throw new HttpError(400, "Annulez une réservation non payée");
      if (input.refundConfirmed !== true) throw new HttpError(400, "Confirmez le remboursement effectué manuellement");
      if (!Array.isArray(input.items) || !input.items.length) throw new HttpError(400, "Choisissez les articles retournés");
      const seen = new Set<number>();
      let returnedValue = 0;
      for (const raw of [...input.items].sort((a,b) => Number(a.itemId)-Number(b.itemId))) {
        const itemId = integer(raw.itemId, "Article", 1);
        const line = sale.items.find(i => i.id === itemId);
        if (!line || seen.has(itemId)) throw new HttpError(400, "Article retourné invalide");
        seen.add(itemId);
        const quantity = integer(raw.quantity, "Quantité retournée", 1, line.quantity - line.returnedQuantity);
        if (typeof raw.restock !== "boolean") throw new HttpError(400, "Choisissez si l’article revient en stock");
        if (raw.restock) await moveStock(tx, line.productId, line.size, quantity, `Retour : ${reason}`, actor, id);
        await tx.orderItem.update({ where: { id: itemId }, data: { returnedQuantity: { increment: quantity } } });
        returnedValue += quantity * line.unitPriceCents;
      }
      const updatedItems = await tx.orderItem.findMany({ where: { orderId: id } });
      const allReturned = updatedItems.every(i => i.quantity === i.returnedQuantity);
      // Cumulative allocation avoids rounding drift across multiple partial returns; shipping is retained.
      const totalReturnedValue = updatedItems.reduce((n,i) => n + i.returnedQuantity * i.unitPriceCents, 0);
      const due = sale.subtotalCents ? Math.round(totalReturnedValue * (sale.subtotalCents - sale.discountCents) / sale.subtotalCents) : 0;
      await tx.order.update({ where: { id }, data: { refundedCents: due, lifecycle: allReturned ? "returned" : "active", paymentStatus: allReturned ? "refunded" : "paid" } });
      await event(tx, id, actor, "refund", reason, { refundCents: due - sale.refundedCents, returnedValue });
    } else if (action === "correct") {
      if (sale.items.some(i => i.returnedQuantity)) throw new HttpError(400, "Une vente avec retour ne peut plus être corrigée");
      // Lock every affected product in a stable order before restoring/reallocating stock.
      const newIds = Array.isArray(input.items) ? input.items.map(i => integer(i.productId, "Produit", 1)) : [];
      for (const productId of [...new Set([...sale.items.map(i => i.productId), ...newIds])].sort((a,b) => a-b)) {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
      }
      for (const line of sale.items) await moveStock(tx, line.productId, line.size, line.quantity, `Correction : ${reason}`, actor, id);
      const { lines, ...totals } = await allocate(tx, input, actor, id);
      const pay = payment(input);
      if (sale.paymentStatus === "paid" && pay.paymentStatus !== "paid") throw new HttpError(400, "Une vente payée ne peut pas redevenir impayée");
      if (sale.paymentStatus === "paid" && input.settlementConfirmed !== true) throw new HttpError(400, "Confirmez que la différence a été réglée ou remboursée");
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.update({ where: { id }, data: { ...totals, totalCents: totals.totalCents + sale.shippingCents, ...pay,
        status: pay.paymentStatus === "paid" ? "paid" : "confirmed",
        customerName: text(input.customerName,150), phone: text(input.phone,60), email: text(input.email,150), note: text(input.note), addressLine: text(input.addressLine),
        paymentConfirmedAt: pay.paymentStatus === "paid" ? new Date() : null, paymentConfirmedBy: pay.paymentStatus === "paid" ? actor.id : null,
        items: { create: lines } } });
      await event(tx, id, actor, "correction_before", reason, { ...sale, events: undefined });
    } else throw new HttpError(400, "Action inconnue");
    await event(tx, id, actor, action, reason, input);
    return tx.order.findUniqueOrThrow({ where: { id }, include: saleInclude });
  });
}
