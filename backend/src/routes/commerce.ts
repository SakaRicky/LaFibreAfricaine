import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import type { AdminRequest } from "../middleware/auth.js";
import { actorFor, changeSale, createSale, saleInclude, text } from "../services/sales.js";
import { HttpError, integer, moveStock } from "../services/stock.js";
const router = Router();

router.get("/sales", async (req, res, next) => {
  try {
    const where: Prisma.OrderWhereInput = {};
    const q = text(req.query.q, 100);
    if (q) where.OR = [{ orderNumber: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { items: { some: { productName: { contains: q, mode: "insensitive" } } } }];
    if (req.query.paymentMethod) where.paymentMethod = String(req.query.paymentMethod);
    if (req.query.salespersonId === "online") where.salespersonId = null;
    else if (req.query.salespersonId) where.salespersonId = integer(Number(req.query.salespersonId), "Vendeur", 1);
    if (req.query.productId) where.items = { some: { productId: integer(Number(req.query.productId), "Produit", 1) } };
    if (req.query.reservations === "true") { where.paymentStatus = "awaiting"; where.lifecycle = "active"; }
    if (req.query.from || req.query.to) {
      const dates: Prisma.DateTimeFilter = {};
      if (req.query.from) { const d = new Date(String(req.query.from)); if (!Number.isFinite(+d)) throw new HttpError(400,"Date invalide"); dates.gte = d; }
      if (req.query.to) { const d = new Date(String(req.query.to)); if (!Number.isFinite(+d)) throw new HttpError(400,"Date invalide"); dates.lt = d; }
      where.createdAt = dates;
    }
    const sales = await prisma.order.findMany({ where, include: saleInclude, orderBy: { createdAt: "desc" } });
    if (req.query.export === "csv") {
      // Neutralize formula injection in spreadsheets, including leading control characters.
      const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const rows: unknown[][] = [["Vente", "Date", "Vendeur", "Client", "Paiement", "Statut paiement", "Livraison", "État", "Total CAD", "Remboursé CAD", "Produit", "Taille / couleur", "Quantité", "Retourné", "Prix CAD"]];
      for (const s of sales) for (const i of s.items) rows.push([s.orderNumber,s.createdAt.toISOString(),s.salespersonName,s.customerName,s.paymentMethod,s.paymentStatus,s.fulfillment,s.lifecycle,(s.totalCents/100).toFixed(2),(s.refundedCents/100).toFixed(2),i.productName,i.size,i.quantity,i.returnedQuantity,(i.unitPriceCents/100).toFixed(2)]);
      return res.setHeader("Content-Disposition", 'attachment; filename="ventes.csv"').type("text/csv").send("\ufeff" + rows.map(r => r.map(cell).join(",")).join("\r\n"));
    }
    res.json(sales);
  } catch (e) { next(e); }
});
router.get("/sales/:id", async (req, res, next) => {
  try {
    const sale = await prisma.order.findUnique({ where: { id: integer(Number(req.params.id),"Vente",1) }, include: saleInclude });
    if (!sale) throw new HttpError(404,"Vente introuvable");
    res.json(sale);
  } catch(e) { next(e); }
});
router.post("/sales", async (req: AdminRequest, res, next) => {
  try { res.status(201).json(await createSale(req.body ?? {}, await actorFor(req.adminId!))); } catch(e) { next(e); }
});
router.patch("/sales/:id", async (req: AdminRequest, res, next) => {
  try { res.json(await changeSale(integer(Number(req.params.id),"Vente",1), req.body ?? {}, await actorFor(req.adminId!))); } catch(e) { next(e); }
});
router.get("/dashboard", async (_req, res, next) => {
  try {
    const [sales, products] = await Promise.all([
      prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }),
      prisma.product.findMany({ where: { archived: false }, include: { sizes: true } }),
    ]);
    const paid = sales.filter(s => ["paid", "refunded"].includes(s.paymentStatus));
    const pending = sales.filter(s => s.lifecycle === "active" && s.paymentStatus === "awaiting");
    res.json({ netSalesCents: paid.reduce((n,s) => n+s.totalCents-s.refundedCents,0),
      refundedCents: paid.reduce((n,s) => n+s.refundedCents,0), paidCount: paid.length,
      pendingCount: pending.length, pendingCents: pending.reduce((n,s)=>n+s.totalCents,0),
      recent: sales.slice(0,8), pending: pending.slice(0,8),
      lowStock: products.flatMap<{productId:number;name:string;size:string|null;stock:number}>(p => p.sizes.length
        ? p.sizes.filter(v=>v.stock<=3).map(v=>({productId:p.id,name:p.name,size:v.size,stock:v.stock}))
        : p.stock<=3 ? [{productId:p.id,name:p.name,size:null,stock:p.stock}] : []),
    });
  } catch(e) { next(e); }
});
router.get("/inventory", async (_req, res, next) => {
  try {
    const [products,reservations,movements] = await Promise.all([
      prisma.product.findMany({ include: { collection: true, sizes: { orderBy:{size:"asc"} }, images: { orderBy:{sortOrder:"asc"} } }, orderBy:{name:"asc"} }),
      prisma.orderItem.findMany({ where:{order:{lifecycle:"active",paymentStatus:"awaiting"}}, select:{productId:true,size:true,quantity:true} }),
      prisma.stockMovement.findMany({ include:{product:{select:{name:true}}}, orderBy:{id:"desc"},take:100 }),
    ]);
    res.json({products,reservations,movements});
  } catch(e) { next(e); }
});
router.post("/inventory/adjust", async (req: AdminRequest, res, next) => {
  try {
    const actor = await actorFor(req.adminId!);
    const productId = integer(req.body.productId,"Produit",1);
    const delta = integer(req.body.delta,"Quantité",-100000,100000);
    const reason = text(req.body.reason);
    if (!delta || !reason) throw new HttpError(400,"Indiquez une quantité et un motif");
    await prisma.$transaction(tx => moveStock(tx,productId,req.body.size ? text(req.body.size,100) : null,delta,reason,actor));
    res.json({ok:true});
  } catch(e) { next(e); }
});
router.post("/inventory/variants", async (req: AdminRequest,res,next) => {
  try {
    const actor = await actorFor(req.adminId!);
    const productId = integer(req.body.productId,"Produit",1);
    const sizeName = text(req.body.size,40); const color = text(req.body.color,40);
    if (!sizeName && !color) throw new HttpError(400,"Indiquez une taille ou une couleur");
    const size = [sizeName,color].filter(Boolean).join(" · ");
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
      const product = await tx.product.findUniqueOrThrow({where:{id:productId},include:{sizes:true}});
      // Keep existing unassigned stock and old order lines addressable during conversion.
      if (!product.sizes.length) {
        const held = await tx.orderItem.count({where:{productId,size:null,order:{lifecycle:"active"}}});
        if (held) throw new HttpError(409,"Ce produit a des ventes sans variante. Créez un produit distinct pour les nouvelles tailles / couleurs");
        if (product.stock) throw new HttpError(409,"Ajustez le stock disponible à zéro, puis répartissez-le entre les nouvelles tailles / couleurs");
      }
      await tx.productSize.create({data:{productId,size,color,stock:0}});
      await tx.stockMovement.create({data:{productId,size,delta:0,reason:"Nouvelle taille / couleur",actor:actor.name,adminId:actor.id}});
    });
    res.status(201).json({ok:true});
  } catch(e) {
    if ((e as {code?:string}).code === "P2002") return res.status(409).json({error:"Cette taille / couleur existe déjà"});
    next(e);
  }
});
export default router;
