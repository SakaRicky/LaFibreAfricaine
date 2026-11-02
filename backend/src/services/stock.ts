import type { Prisma } from "@prisma/client";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function integer(value: unknown, label: string, min = 0, max = 100000000) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${label} invalide`);
  }
  return value;
}
export type Actor = { id: number | null; name: string };
export const onlineActor: Actor = { id: null, name: "Boutique en ligne" };

// stock always means AVAILABLE stock. Reservations and sales share this path.
// Lock product first everywhere so variant and aggregate updates remain atomic.
export async function moveStock(tx: Prisma.TransactionClient, productId: number, size: string | null,
  delta: number, reason: string, actor: Actor, orderId?: number) {
  integer(productId, "Produit", 1);
  integer(delta, "Quantité", -1000000, 1000000);
  await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
  const product = await tx.product.findUnique({ where: { id: productId }, include: { sizes: true } });
  if (!product) throw new HttpError(404, "Produit introuvable");
  if (product.sizes.length && !size) throw new HttpError(400, `Choisissez la taille / couleur de ${product.name}`);
  if (size) {
    const variant = product.sizes.find(v => v.size === size);
    if (!variant) throw new HttpError(400, `Taille / couleur inconnue : ${size}`);
    const changed = await tx.productSize.updateMany({
      where: { id: variant.id, ...(delta < 0 ? { stock: { gte: -delta } } : {}) },
      data: { stock: { increment: delta } },
    });
    if (!changed.count) throw new HttpError(409, `Stock insuffisant : ${product.name} (${size})`);
  }
  const changed = await tx.product.updateMany({
    where: { id: productId, ...(delta < 0 ? { stock: { gte: -delta } } : {}) },
    data: { stock: { increment: delta } },
  });
  if (!changed.count) throw new HttpError(409, `Stock insuffisant : ${product.name}`);
  await tx.stockMovement.create({ data: { productId, size, delta, reason, adminId: actor.id, actor: actor.name, orderId } });
  return product;
}
