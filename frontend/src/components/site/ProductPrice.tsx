import type { Producto } from "@/types/product";
import { getPrecioNormal, getPrecioTransferencia } from "@/lib/pricing";

type Props = {
  producto: Pick<Producto, "precio" | "descuento" | "precioTransferencia">;
  variant?: "card" | "detail";
  showIva?: boolean;
};

export function ProductPrice({ producto, variant = "card", showIva = true }: Props) {
  const precio = Number(producto.precio);
  const precioNormal = getPrecioNormal(producto);
  const precioTransferencia = getPrecioTransferencia(producto);
  const tieneDescuento = producto.descuento > 0;

  if (variant === "detail") {
    if (precioTransferencia == null) {
      return (
        <>
          {tieneDescuento && <div className="text-sm text-muted-foreground line-through">${precio.toFixed(2)}</div>}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-brand-blue">${precioNormal.toFixed(2)}</span>
            <span className="text-sm font-normal text-muted-foreground mb-1">IVA incluido</span>
            {tieneDescuento && (
              <span className="text-sm font-bold text-green-600 mb-1">Ahorras ${(precio - precioNormal).toFixed(2)}</span>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {tieneDescuento && <div className="text-sm text-muted-foreground line-through mb-1">${precio.toFixed(2)}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-brand-red bg-brand-red/5 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-brand-red">Promo transferencia</div>
            <div className="text-3xl lg:text-4xl font-black text-brand-red leading-tight mt-0.5">${precioTransferencia.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Precio normal</div>
            <div className="text-xl lg:text-2xl font-bold text-brand-blue leading-tight mt-1.5">${precioNormal.toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Precios incluyen IVA</span>
          {precio - precioTransferencia > 0 && (
            <span className="font-bold text-green-600">
              Ahorras ${(precio - precioTransferencia).toFixed(2)} pagando por transferencia
            </span>
          )}
        </div>
      </>
    );
  }

  if (precioTransferencia == null) {
    return (
      <>
        {tieneDescuento && <div className="text-xs text-muted-foreground line-through">${precio.toFixed(2)}</div>}
        <div className="text-xl font-black text-brand-blue">
          ${precioNormal.toFixed(2)}
          {showIva && <span className="text-xs font-normal text-muted-foreground ml-1">IVA incluido</span>}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-1">
      {tieneDescuento && <div className="text-xs text-muted-foreground line-through">${precio.toFixed(2)}</div>}
      <div className="rounded border border-brand-red/50 bg-brand-red/5 px-2 py-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-brand-red leading-tight">Promo transferencia</div>
        <div className="text-xl font-black text-brand-red leading-tight">
          ${precioTransferencia.toFixed(2)}
          {showIva && <span className="text-[10px] font-normal text-muted-foreground ml-1">IVA incluido</span>}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-1 px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Precio normal</span>
        <span className="text-sm font-bold text-brand-blue">${precioNormal.toFixed(2)}</span>
      </div>
    </div>
  );
}
