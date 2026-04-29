import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-brand-blue-dark text-white text-xs">
      <div className="container-x flex items-center justify-between h-9 gap-4 overflow-hidden">
        <div className="hidden md:flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Envíos a todo Ecuador</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Garantía oficial</span>
          <span className="flex items-center gap-1.5"><Headphones className="h-3.5 w-3.5" /> Soporte técnico 24/7</span>
          <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Hasta 12 cuotas sin intereses</span>
        </div>
        <div className="md:hidden">Envíos a todo Ecuador · Garantía oficial</div>
        <div className="hidden md:flex items-center gap-4">
          <a href="tel:+593999999999" className="hover:text-brand-yellow">📞 (04) 222-3333</a>
          <span className="opacity-70">Lun–Sáb 9:00–19:00</span>
        </div>
      </div>
    </div>
  );
}
