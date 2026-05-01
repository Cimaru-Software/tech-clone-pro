import { Link } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export function CartDrawer() {
  const { items, open, setOpen, remove, setQty, subtotal } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col shadow-card-hover">
        <div className="bg-brand-blue text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold"><ShoppingBag className="h-5 w-5" /> Tu carrito ({items.length})</div>
          <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tu carrito está vacío</p>
            </div>
          )}
          {items.map((i) => (
            <div key={i.id} className="flex gap-3 border rounded p-2">
              <div className="h-20 w-20 bg-secondary rounded shrink-0">
                <img src={i.imagen} alt={i.nombre} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">{i.nombre}</div>
                <div className="text-xs text-muted-foreground">{i.marca}</div>
                <div className="text-brand-blue font-bold">${i.precio.toFixed(2)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setQty(i.id, i.qty - 1)} className="h-7 w-7 border rounded grid place-items-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                  <span className="text-sm w-6 text-center">{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} className="h-7 w-7 border rounded grid place-items-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => remove(i.id)} className="ml-auto text-muted-foreground hover:text-brand-red"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
            <div className="text-xs text-muted-foreground">El envío y los impuestos se calculan en el checkout</div>
            <Link to="/checkout" onClick={() => setOpen(false)} className="block bg-brand-red hover:bg-brand-red-dark text-white text-center font-bold py-3 rounded">
              Proceder al pago
            </Link>
            <Link to="/tienda" onClick={() => setOpen(false)} className="block text-center text-sm text-brand-blue hover:underline">Seguir comprando</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
