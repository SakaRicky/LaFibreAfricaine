import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine } from "../types.ts";

const STORAGE_KEY = "lfa-cart";

// A cart line is keyed by slug + size + personalization so the same product
// in two sizes stays as two lines.
export const lineKey = (item: Pick<CartLine, "slug" | "size" | "personalization">): string =>
  `${item.slug}__${item.size ?? ""}__${item.personalization ?? ""}`;

interface CartContextValue {
  items: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartLine[];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const key = lineKey(item);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setDrawerOpen(true);
  };

  const updateQuantity = (key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
    );
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((l) => lineKey(l) !== key));
  const clear = () => setItems([]);

  const { count, subtotalCents } = useMemo(
    () => ({
      count: items.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: items.reduce((n, l) => n + l.priceCents * l.quantity, 0),
    }),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items, addItem, updateQuantity, removeItem, clear, count, subtotalCents,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
