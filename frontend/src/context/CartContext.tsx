import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Producto } from "@/types/product";
import { gaAddToCart } from "@/lib/analytics";
import { getPrecioTransferencia } from "@/lib/pricing";

export type CartItem = {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  precioOriginal: number;
  descuento: number;
  /** Precio unitario si el pago es por transferencia (solo si es menor a `precio`). */
  precioTransferencia: number | null;
  imagen: string;
  qty: number;
};

type AddableProduct = Partial<Producto> & {
  id: string;
  name?: string;
  brand?: string;
  price?: number;
  image?: string;
  oldPrice?: number;
};

function getDiscountedPrice(precio: number, descuento = 0) {
  if (!Number.isFinite(precio) || precio <= 0) return 0;
  if (!Number.isFinite(descuento) || descuento <= 0) return precio;
  return Number((precio * (1 - Math.min(descuento, 100) / 100)).toFixed(2));
}

function normalizeCartItem(item: CartItem & { name?: string; brand?: string; price?: number; image?: string; oldPrice?: number }): CartItem {
  const descuento = Number(item.descuento ?? 0);
  const original = Number(item.precioOriginal ?? item.oldPrice ?? item.precio ?? item.price ?? 0);
  const precio = descuento > 0 ? getDiscountedPrice(original, descuento) : Number(item.precio ?? item.price ?? original);
  return {
    ...item,
    nombre: item.nombre || item.name || "",
    marca: item.marca || item.brand || "",
    precio,
    precioOriginal: original,
    precioTransferencia: getPrecioTransferencia({ precio: original, descuento, precioTransferencia: item.precioTransferencia }),
    imagen: item.imagen || item.image || "/placeholder-product.png",
    descuento,
    qty: Number(item.qty || 1),
  };
}

type CartCtx = {
  items: CartItem[];
  add: (p: AddableProduct, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  subtotalTransferencia: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const CART_STORAGE_KEY = "lcdc_cart";

function getImageUrl(producto: AddableProduct): string {
  if (producto.image) return producto.image;
  if (producto.imagenes && producto.imagenes.length > 0) {
    return `${BACKEND}${producto.imagenes[0].path}`;
  }
  return "/placeholder-product.png";
}

function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter((item) => item.id && item.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getStoredCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartCtx["add"] = (p, qty = 1) => {
    const precioOriginal = Number(p.precio ?? p.oldPrice ?? p.price ?? 0);
    const descuento = Number(p.descuento ?? (p.oldPrice && p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0));
    const item: CartItem = {
      id: p.id,
      nombre: p.nombre || p.name || "",
      marca: p.marca || p.brand || "",
      precio: getDiscountedPrice(precioOriginal, descuento),
      precioOriginal,
      descuento,
      precioTransferencia: getPrecioTransferencia({ precio: precioOriginal, descuento, precioTransferencia: p.precioTransferencia }),
      imagen: getImageUrl(p),
      qty,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) return prev.map((i) => i.id === p.id ? { ...item, qty: i.qty + qty } : i);
      return [...prev, item];
    });
    gaAddToCart({ item_id: item.id, item_name: item.nombre, item_brand: item.marca, price: item.precio, quantity: qty });
    setOpen(true);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * Number(i.precio || 0), 0);
  const subtotalTransferencia = items.reduce((s, i) => s + i.qty * Number(i.precioTransferencia ?? i.precio ?? 0), 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal, subtotalTransferencia, open, setOpen }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be inside CartProvider");
  return v;
};
