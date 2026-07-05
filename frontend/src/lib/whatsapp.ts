// V1 payment flow: orders are finalized in a WhatsApp conversation with the admin.
// The number is managed in the admin dashboard (Settings) and served by /api/config.
const FALLBACK_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "12638807371";

export function whatsappLink(number: string | undefined, message: string): string {
  return `https://wa.me/${number || FALLBACK_NUMBER}?text=${encodeURIComponent(message)}`;
}
