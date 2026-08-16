/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "nsp-club-cart";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === product.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === product.slug ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          article: product.article,
          priceRetailUsd: product.priceRetailUsd,
          priceDiscountUsd: product.priceDiscountUsd,
          image: product.images?.[0] || null,
          qty,
        },
      ];
    });
  };

  const setQty = (slug, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
    );
  };

  const removeItem = (slug) =>
    setItems((prev) => prev.filter((i) => i.slug !== slug));

  const clear = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalUsd = items.reduce(
    (sum, i) => sum + (i.priceRetailUsd || 0) * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, setQty, removeItem, clear, totalCount, totalUsd }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
