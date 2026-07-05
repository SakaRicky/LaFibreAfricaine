import type {
  CollectionInfo,
  CustomerPayload,
  DeliveryMethod,
  Lang,
  OrderDetails,
  OrderItemPayload,
  OrderSummary,
  Product,
} from "../types.ts";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  collections: () => request<CollectionInfo[]>("/api/collections"),
  products: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Product[]>(`/api/products${qs ? `?${qs}` : ""}`);
  },
  product: (slug: string) => request<Product & { related: Product[] }>(`/api/products/${slug}`),
  createOrder: (payload: { customer: CustomerPayload; items: OrderItemPayload[]; deliveryMethod: DeliveryMethod; lang: Lang }) =>
    request<OrderSummary>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  order: (orderNumber: string) => request<OrderDetails>(`/api/orders/${orderNumber}`),
  subscribe: (email: string) =>
    request<{ ok: boolean }>("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) }),
};
