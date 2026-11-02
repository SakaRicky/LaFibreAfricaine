import "dotenv/config";
import { prisma } from "../src/prisma.js";
// One-time, non-destructive upgrade of existing orders and aggregate stock.
await prisma.$transaction(async tx => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(73519022)`;
  if (await tx.setting.findUnique({where:{key:"inventory_v2_migrated"}})) return;
  const orders = await tx.order.findMany({include:{items:true}});
  for (const o of orders) {
    const paid = ["paid","shipped","delivered"].includes(o.status);
    const cancelled = o.status === "cancelled";
    await tx.order.update({where:{id:o.id},data:{
      paymentStatus: cancelled ? "cancelled" : paid ? "paid" : "awaiting",
      lifecycle: cancelled ? "cancelled" : "active",
      fulfillment: o.status === "delivered" ? "completed" : o.deliveryMethod === "pickup" ? "awaiting_pickup" : "awaiting_delivery",
      // Historical payment method is unknown; do not invent a cash/Interac receipt.
      paymentMethod: paid ? "legacy" : "interac",
    }});
    await tx.orderEvent.create({data:{orderId:o.id,actor:"Migration",action:"legacy_import",reason:"Ancienne commande conservée",detail:{previousStatus:o.status}}});
  }
  // The storefront previously stored both variant totals and an independently editable total.
  const products = await tx.product.findMany({include:{sizes:true}});
  for (const p of products) {
    if (!p.sizes.length) continue;
    const total = p.sizes.reduce((n,s)=>n+s.stock,0);
    if (p.stock!==total) {
      await tx.product.update({where:{id:p.id},data:{stock:total}});
      await tx.stockMovement.create({data:{productId:p.id,delta:total-p.stock,reason:"Synchronisation du total avec les tailles existantes",actor:"Migration"}});
    }
  }
  await tx.setting.create({data:{key:"inventory_v2_migrated",value:new Date().toISOString()}});
});
await prisma.$disconnect();
console.log("Inventory upgrade complete; existing orders and stock retained.");
