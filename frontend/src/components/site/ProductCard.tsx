import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <div className="group bg-white border rounded-md overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow">
      <div className="relative aspect-square bg-secondary p-4">
        {product.badge && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded">
            {product.badge}
          </span>
        )}
        {discount > 0 && !product.badge && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded">-{discount}%</span>
        )}
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] uppercase font-semibold text-brand-blue tracking-wide">{product.brand}</div>
        <h3 className="text-sm font-medium line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</h3>
        <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5 line-clamp-2">
          {product.specs.slice(0, 2).map((s) => <li key={s}>• {s}</li>)}
        </ul>
        <div className="mt-2">
          {product.oldPrice && (
            <div className="text-xs text-muted-foreground line-through">${product.oldPrice.toFixed(2)}</div>
          )}
          <div className="text-xl font-black text-brand-blue">
            ${product.price.toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground ml-1">+ IVA</span>
          </div>
        </div>
        <button
          onClick={() => add(product)}
          className="mt-3 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" /> Agregar
        </button>
      </div>
    </div>
  );
}
