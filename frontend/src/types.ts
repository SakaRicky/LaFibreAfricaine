export type Lang = "en" | "fr";

export interface Localized {
  en: string;
  fr: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface SizeStock {
  size: string;
  stock: number;
}

export interface Product {
  slug: string;
  name: string;
  priceCents: number;
  description: Localized;
  story: Localized;
  materials: Localized;
  color: Localized;
  stock: number;
  featured: boolean;
  isSet: boolean;
  personalizable: boolean;
  collectionSlug: string;
  collectionName: Localized;
  images: ProductImage[];
  sizes: SizeStock[];
  related?: Product[];
}

export interface CollectionInfo {
  slug: string;
  name: Localized;
  description: Localized;
  productCount: number;
  coverImage: string | null;
}

export interface CartLine {
  slug: string;
  name: string;
  priceCents: number;
  image?: string;
  size?: string | null;
  personalization?: string | null;
  quantity: number;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  note?: string;
}

export interface OrderItemPayload {
  slug: string;
  quantity: number;
  size?: string;
  personalization?: string;
}

export type DeliveryMethod = "shipping" | "pickup";

export interface OrderSummary {
  orderNumber: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  status: string;
}

export interface OrderDetails extends OrderSummary {
  customerName: string;
  city: string;
  province: string;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  items: {
    name: string;
    size: string | null;
    personalization: string | null;
    quantity: number;
    unitPriceCents: number;
  }[];
}
