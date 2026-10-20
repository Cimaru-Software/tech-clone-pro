import type { Producto } from "@/types/product";

type Precios = Pick<Producto, "precio" | "descuento" | "precioTransferencia">;

export function getPrecioNormal(p: Precios): number {
  const precio = Number(p.precio);
  if (!Number.isFinite(precio) || precio <= 0) return 0;
  if (!p.descuento || p.descuento <= 0) return precio;
  return Number((precio * (1 - Math.min(p.descuento, 100) / 100)).toFixed(2));
}

/** Precio con pago por transferencia (PVP3 de Contífico, tal cual), o null si el producto no tiene uno. */
export function getPrecioTransferencia(p: Precios): number | null {
  if (p.precioTransferencia == null) return null;
  const transferencia = Number(p.precioTransferencia);
  if (!Number.isFinite(transferencia) || transferencia <= 0) return null;
  return Number(transferencia.toFixed(2));
}
