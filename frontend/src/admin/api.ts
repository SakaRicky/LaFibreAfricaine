// Typed client for the admin API (cookie-authenticated).

export interface AdminMe { id: number; email: string; name: string }
export interface AdminImage { id: number; url: string; alt: string; sortOrder: number }
export interface AdminSize { id: number; size: string; stock: number }

export interface AdminProduct {
  id: number; slug: string; name: string; priceCents: number; stock: number;
  featured: boolean; archived: boolean; isSet: boolean; personalizable: boolean;
  descriptionEn: string; descriptionFr: string; storyEn: string; storyFr: string;
  materialsEn: string; materialsFr: string; colorEn: string; colorFr: string;
  collection: { slug: string; nameFr: string; nameEn: string };
  images: AdminImage[];
  sizes: AdminSize[];
}

export interface AdminOrderItem {
  id: number; productName: string; size: string | null; personalization: string | null;
  quantity: number; unitPriceCents: number;
}

export interface AdminOrder {
  id: number; orderNumber: string; customerName: string; email: string; phone: string;
  addressLine: string; city: string; province: string; postalCode: string; note: string;
  deliveryMethod: string; lang: string;
  subtotalCents: number; shippingCents: number; totalCents: number;
  status: string; createdAt: string; items: AdminOrderItem[];
}

export type AdminSettings = Record<string, string>;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Erreur (${res.status})`);
  return body as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<AdminMe>("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: boolean }>("/api/admin/logout", { method: "POST" }),
  me: () => request<AdminMe>("/api/admin/me"),
  updateMe: (payload: { currentPassword: string; email?: string; name?: string; newPassword?: string }) =>
    request<AdminMe>("/api/admin/me", { method: "PATCH", body: JSON.stringify(payload) }),

  admins: () => request<(AdminMe & { createdAt: string })[]>("/api/admin/admins"),
  addAdmin: (payload: { email: string; name: string; tempPassword: string }) =>
    request<AdminMe>("/api/admin/admins", { method: "POST", body: JSON.stringify(payload) }),

  orders: (status?: string) =>
    request<AdminOrder[]>(`/api/admin/orders${status ? `?status=${status}` : ""}`),
  setOrderStatus: (id: number, status: string) =>
    request<AdminOrder>(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  products: () => request<AdminProduct[]>("/api/admin/products"),
  createProduct: (payload: { name: string; collectionSlug: string; priceCents: number }) =>
    request<AdminProduct>("/api/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: number, payload: Partial<AdminProduct>) =>
    request<AdminProduct>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateSizes: (id: number, sizes: { size: string; stock: number }[]) =>
    request<AdminSize[]>(`/api/admin/products/${id}/sizes`, { method: "PATCH", body: JSON.stringify({ sizes }) }),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<AdminImage>(`/api/admin/products/${id}/images`, { method: "POST", body: form });
  },
  deleteImage: (imageId: number) =>
    request<{ ok: boolean }>(`/api/admin/images/${imageId}`, { method: "DELETE" }),
  reorderImages: (productId: number, ids: number[]) =>
    request<{ ok: boolean }>(`/api/admin/products/${productId}/images/order`, { method: "PATCH", body: JSON.stringify({ ids }) }),

  settings: () => request<AdminSettings>("/api/admin/settings"),
  saveSettings: (payload: AdminSettings) =>
    request<AdminSettings>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(payload) }),
};

export const ORDER_STATUSES = [
  { value: "pending_whatsapp", label: "En attente WhatsApp", color: "bg-amber-100 text-amber-800" },
  { value: "confirmed", label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  { value: "paid", label: "Payée", color: "bg-green-100 text-green-800" },
  { value: "shipped", label: "Expédiée", color: "bg-teal-100 text-teal-800" },
  { value: "delivered", label: "Livrée", color: "bg-charcoal/10 text-charcoal" },
  { value: "cancelled", label: "Annulée", color: "bg-red-100 text-red-700" },
];

export const statusInfo = (value: string) =>
  ORDER_STATUSES.find((s) => s.value === value) ?? { value, label: value, color: "bg-charcoal/10 text-charcoal" };

export const cad = (cents: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
