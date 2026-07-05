import { Router } from "express";
import { prisma } from "../prisma.js";
import { sendOrderConfirmation, sendAdminAlert } from "../mail.js";

const router = Router();

const FREE_SHIPPING_THRESHOLD_CENTS = 10000; // free shipping over $100 CAD
const FLAT_SHIPPING_CENTS = 1200;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface OrderItemInput {
  slug: string;
  quantity: number;
  size?: string;
  personalization?: string;
}

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address_line?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  note?: string;
}

// POST /api/orders — creates the order and holds stock; payment is finalized
// with the admin over WhatsApp (V1 flow).
router.post("/", async (req, res, next) => {
  try {
    const customer = (req.body?.customer ?? {}) as Partial<CustomerInput>;
    const items = (req.body?.items ?? []) as OrderItemInput[];
    const deliveryMethod = req.body?.deliveryMethod === "pickup" ? "pickup" : "shipping";
    const lang = req.body?.lang === "en" ? "en" : "fr";

    // WhatsApp is the payment channel, so phone is always required.
    const required: (keyof CustomerInput)[] =
      deliveryMethod === "pickup"
        ? ["name", "email", "phone"]
        : ["name", "email", "phone", "address_line", "city", "province", "postal_code"];
    for (const field of required) {
      if (!customer[field] || !String(customer[field]).trim()) {
        throw new HttpError(400, `Missing customer field: ${field}`);
      }
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpError(400, "Cart is empty");
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const lines: {
        productId: number;
        productName: string;
        size: string | null;
        personalization: string | null;
        quantity: number;
        unitPriceCents: number;
      }[] = [];

      for (const item of items) {
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const product = await tx.product.findUnique({ where: { slug: item.slug } });
        if (!product) throw new HttpError(400, `Unknown product: ${item.slug}`);

        // Atomic conditional decrement — fails cleanly if stock is insufficient.
        const decremented = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (decremented.count === 0) {
          throw new HttpError(409, `Only ${product.stock} left of ${product.name}`);
        }

        if (item.size) {
          const sizeDecremented = await tx.productSize.updateMany({
            where: { productId: product.id, size: String(item.size), stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
          if (sizeDecremented.count === 0) {
            throw new HttpError(409, `Size ${item.size} of ${product.name} is sold out`);
          }
        }

        subtotal += product.priceCents * qty;
        lines.push({
          productId: product.id,
          productName: product.name,
          size: item.size ? String(item.size) : null,
          personalization: item.personalization ? String(item.personalization).slice(0, 60) : null,
          quantity: qty,
          unitPriceCents: product.priceCents,
        });
      }

      const shipping =
        deliveryMethod === "pickup" ? 0 :
        subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
      const orderNumber = `LFA-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;

      return tx.order.create({
        data: {
          orderNumber,
          customerName: customer.name!.trim(),
          email: customer.email!.trim(),
          phone: customer.phone!.trim(),
          addressLine: customer.address_line?.trim() ?? "",
          city: customer.city?.trim() ?? (deliveryMethod === "pickup" ? "Montréal" : ""),
          province: customer.province?.trim() ?? "QC",
          postalCode: customer.postal_code?.trim() ?? "",
          note: customer.note?.trim() ?? "",
          deliveryMethod,
          lang,
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: subtotal + shipping,
          items: { create: lines },
        },
        include: { items: true },
      });
    });

    // Customer confirmation + admin alert (fire-and-forget)
    void sendOrderConfirmation(order);
    void sendAdminAlert(order);

    res.status(201).json({
      orderNumber: order.orderNumber,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      status: order.status,
    });
  } catch (err) { next(err); }
});

// GET /api/orders/:orderNumber — order confirmation lookup
router.get("/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      city: order.city,
      province: order.province,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.productName,
        size: i.size,
        personalization: i.personalization,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
    });
  } catch (err) { next(err); }
});

export default router;
