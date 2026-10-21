type Props = {
  stock: number;
  variant?: "card" | "detail";
};

export function StockInfo({ stock, variant = "card" }: Props) {
  const unidades = Math.max(0, Math.trunc(Number(stock) || 0));
  const disponible = unidades > 0;
  const texto = disponible ? `${unidades} ${unidades === 1 ? "unidad" : "unidades"} en stock` : "Sin stock";

  return (
    <div
      className={`flex items-center gap-1.5 font-semibold ${disponible ? "text-green-700" : "text-brand-red"} ${
        variant === "detail" ? "text-sm mt-3" : "text-[11px] mt-1.5"
      }`}
    >
      <span className={`inline-block rounded-full ${disponible ? "bg-green-600" : "bg-brand-red"} ${variant === "detail" ? "h-2 w-2" : "h-1.5 w-1.5"}`} />
      {texto}
    </div>
  );
}
