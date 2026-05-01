import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Producto } from "@/types/product";

export type CartItem = {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  descuento: number;
  imagen: string;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  add: (p: Producto, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function getImageUrl(producto: Producto): string {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return `${BACKEND}${producto.imagenes[0].path}`;
  }
  return "/placeholder-product.png";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lcdc_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("lcdc_cart", JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartCtx["add"] = (p, qty = 1) => {
    const item: CartItem = {
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      precio: Number(p.precio),
      descuento: p.descuento,
      imagen: getImageUrl(p),
      qty,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, item];
    });
    setOpen(true);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.precio, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal, open, setOpen }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be inside CartProvider");
  return v;
};
