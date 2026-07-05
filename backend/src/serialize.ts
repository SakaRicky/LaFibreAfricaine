import type { Collection, Product, ProductImage, ProductSize } from "@prisma/client";

export interface Localized {
  en: string;
  fr: string;
}

export type ProductWithRelations = Product & {
  collection: Collection;
  images: ProductImage[];
  sizes: ProductSize[];
};

// Shape sent to the storefront: localized fields become {en, fr} objects.
export function serializeProduct(p: ProductWithRelations) {
  return {
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    description: { en: p.descriptionEn, fr: p.descriptionFr } satisfies Localized,
    story: { en: p.storyEn, fr: p.storyFr } satisfies Localized,
    materials: { en: p.materialsEn, fr: p.materialsFr } satisfies Localized,
    color: { en: p.colorEn, fr: p.colorFr } satisfies Localized,
    stock: p.stock,
    featured: p.featured,
    isSet: p.isSet,
    personalizable: p.personalizable,
    collectionSlug: p.collection.slug,
    collectionName: { en: p.collection.nameEn, fr: p.collection.nameFr } satisfies Localized,
    images: p.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ url: i.url, alt: i.alt })),
    sizes: p.sizes
      .sort((a, b) => a.size.localeCompare(b.size))
      .map((s) => ({ size: s.size, stock: s.stock })),
  };
}

export const productInclude = {
  collection: true,
  images: true,
  sizes: true,
} as const;
