import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";
import { prisma } from "./prisma.js";

// SMTP is configured via env (Gmail app password works until the domain +
// Resend are set up). If unconfigured, emails are logged and skipped so the
// order flow never breaks.
const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transport = smtpReady
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value || fallback;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transport) {
    console.warn(`[mail skipped — SMTP not configured] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? `"La Fibre Africaine" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[mail error]", err);
  }
}

const money = (cents: number, lang: string) =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function waLinkForPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length === 10 ? `1${digits}` : digits}`;
}

function layout(body: string): string {
  return `<div style="background:#f8f6f1;padding:32px 16px;font-family:Georgia,serif;color:#2e2e2e">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e0d5">
      <div style="background:#183a2d;padding:22px;text-align:center">
        <span style="color:#f8f6f1;font-size:20px;letter-spacing:3px">LA FIBRE <span style="color:#b88a2a">AFRICAINE</span></span>
      </div>
      <div style="padding:28px 26px;font-size:15px;line-height:1.6">${body}</div>
      <div style="background:#183a2d;padding:14px;text-align:center;color:#f8f6f199;font-size:12px;letter-spacing:1px">
        Wear Your Roots With Elegance · Montréal, QC
      </div>
    </div>
  </div>`;
}

type FullOrder = Order & { items: OrderItem[] };

function itemsTable(order: FullOrder, lang: string): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity}× ${i.productName}${i.size ? ` (${i.size})` : ""}</td>
         <td style="text-align:right">${money(i.unitPriceCents * i.quantity, lang)}</td></tr>`
    )
    .join("");
  const shippingLabel = lang === "fr" ? "Livraison" : "Shipping";
  const shippingValue =
    order.deliveryMethod === "pickup"
      ? lang === "fr" ? "Ramassage" : "Pickup"
      : order.shippingCents === 0
      ? lang === "fr" ? "Gratuite" : "Free"
      : money(order.shippingCents, lang);
  return `<table style="width:100%;font-size:14px;border-top:1px solid #eee;margin-top:12px">${rows}
    <tr><td style="padding:8px 0;border-top:1px solid #eee">${shippingLabel}</td><td style="text-align:right;border-top:1px solid #eee">${shippingValue}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#183a2d">Total</td><td style="text-align:right;font-weight:bold;color:#183a2d">${money(order.totalCents, lang)}</td></tr>
  </table>`;
}

export async function sendOrderConfirmation(order: FullOrder): Promise<void> {
  const fr = order.lang === "fr";
  const subject = fr
    ? `Commande ${order.orderNumber} reçue — La Fibre Africaine`
    : `Order ${order.orderNumber} received — La Fibre Africaine`;
  const body = fr
    ? `<p>Bonjour ${order.customerName},</p>
       <p>Merci ! Votre commande <b>${order.orderNumber}</b> est réservée. Nous vous contactons sur WhatsApp pour confirmer le paiement (virement Interac ou comptant) et la ${order.deliveryMethod === "pickup" ? "remise en main propre à Montréal (Lachine)" : "livraison"}.</p>`
    : `<p>Hello ${order.customerName},</p>
       <p>Thank you! Your order <b>${order.orderNumber}</b> is reserved. We'll connect on WhatsApp to confirm payment (Interac e-Transfer or cash) and ${order.deliveryMethod === "pickup" ? "pickup in Montreal (Lachine)" : "delivery"}.</p>`;
  await send(order.email, subject, layout(body + itemsTable(order, order.lang)));
}

export async function sendAdminAlert(order: FullOrder): Promise<void> {
  const alertEmail = await getSetting("alert_email");
  if (!alertEmail) return;
  const wa = waLinkForPhone(order.phone);
  const body = `<p><b>Nouvelle commande ${order.orderNumber}</b></p>
    <p>${order.customerName} — ${order.email}${order.phone ? ` — ${order.phone}` : ""}<br/>
    ${order.deliveryMethod === "pickup" ? "Ramassage (Lachine)" : `Livraison : ${order.addressLine}, ${order.city}, ${order.province} ${order.postalCode}`}</p>
    ${order.note ? `<p>Note : ${order.note}</p>` : ""}
    ${wa ? `<p><a href="${wa}" style="background:#1fa855;color:#fff;padding:10px 18px;text-decoration:none;display:inline-block">Écrire au client sur WhatsApp</a></p>` : ""}`;
  await send(alertEmail, `🛍 Nouvelle commande ${order.orderNumber} — ${money(order.totalCents, "fr")}`, layout(body + itemsTable(order, "fr")));
}

export async function sendPaidThankYou(order: FullOrder): Promise<void> {
  const code = await getSetting("thankyou_code", "MERCI10");
  const fr = order.lang === "fr";
  const subject = fr
    ? `Merci ! Votre code -10 % vous attend — La Fibre Africaine`
    : `Thank you! Your 10% code is inside — La Fibre Africaine`;
  const body = fr
    ? `<p>Bonjour ${order.customerName},</p>
       <p>Votre paiement pour la commande <b>${order.orderNumber}</b> est confirmé — merci de soutenir l'artisanat africain 🧡</p>
       <p>En remerciement, profitez de <b>10 % de rabais</b> sur votre prochaine commande avec le code <b style="color:#b88a2a">${code}</b> (mentionnez-le sur WhatsApp).</p>
       <p>Partagez une photo avec votre pièce et identifiez <b>@lafibreafricaine</b> — nous adorons voir la famille s'agrandir.</p>`
    : `<p>Hello ${order.customerName},</p>
       <p>Your payment for order <b>${order.orderNumber}</b> is confirmed — thank you for supporting African craftsmanship 🧡</p>
       <p>As a thank-you, enjoy <b>10% off</b> your next order with code <b style="color:#b88a2a">${code}</b> (mention it on WhatsApp).</p>
       <p>Share a photo wearing your piece and tag <b>@lafibreafricaine</b> — we love seeing the family grow.</p>`;
  await send(order.email, subject, layout(body));
}

export async function sendShippedNotice(order: FullOrder): Promise<void> {
  const fr = order.lang === "fr";
  const isPickup = order.deliveryMethod === "pickup";
  const subject = fr
    ? `Commande ${order.orderNumber} ${isPickup ? "prête" : "expédiée"} — La Fibre Africaine`
    : `Order ${order.orderNumber} ${isPickup ? "ready" : "shipped"} — La Fibre Africaine`;
  const body = fr
    ? `<p>Bonjour ${order.customerName},</p>
       <p>${isPickup ? `Votre commande <b>${order.orderNumber}</b> est prête pour le ramassage — on se coordonne sur WhatsApp.` : `Votre commande <b>${order.orderNumber}</b> est en route ! Nous vous tenons au courant sur WhatsApp.`}</p>`
    : `<p>Hello ${order.customerName},</p>
       <p>${isPickup ? `Your order <b>${order.orderNumber}</b> is ready for pickup — we'll coordinate on WhatsApp.` : `Your order <b>${order.orderNumber}</b> is on its way! We'll keep you posted on WhatsApp.`}</p>`;
  await send(order.email, subject, layout(body));
}
