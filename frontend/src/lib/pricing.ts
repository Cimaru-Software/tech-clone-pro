import type { Producto } from "@/types/product";

type Precios = Pick<Producto, "precio" | "descuento" | "precioTransferencia">;

function aplicarDescuento(precio: number, descuento: number): number {
  if (!descuento || descuento <= 0) return precio;
  return Number((precio * (1 - Math.min(descuento, 100) / 100)).toFixed(2));
}

export function getPrecioNormal(p: Precios): number {
  const precio = Number(p.precio);
  if (!Number.isFinite(precio) || precio <= 0) return 0;
  return aplicarDescuento(precio, p.descuento);
}

/** Precio de transferencia (PVP3) sin descuento, o null si el producto no tiene uno. */
export function getPrecioTransferenciaOriginal(p: Pick<Producto, "precioTransferencia">): number | null {
  if (p.precioTransferencia == null) return null;
  const transferencia = Number(p.precioTransferencia);
  if (!Number.isFinite(transferencia) || transferencia <= 0) return null;
  return Number(transferencia.toFixed(2));
}

/** Precio con pago por transferencia (PVP3) con el % de descuento aplicado, o null si el producto no tiene uno. */
export function getPrecioTransferencia(p: Precios): number | null {
  const transferencia = getPrecioTransferenciaOriginal(p);
  return transferencia == null ? null : aplicarDescuento(transferencia, p.descuento);
}
