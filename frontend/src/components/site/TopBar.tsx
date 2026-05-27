import { CreditCard, Headphones, Phone, ShieldCheck, Truck } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-brand-blue-dark text-white text-xs">
      <div className="container-x flex min-h-9 flex-col justify-center gap-1 py-2 md:flex-row md:items-center md:justify-between md:gap-4 lg:py-0">
        <div className="flex items-center justify-center gap-4 text-center md:hidden">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 shrink-0" /> Envíos a todo Ecuador
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Garantía oficial
          </span>
        </div>
        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 md:flex">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Truck className="h-3.5 w-3.5 shrink-0" /> Envíos a todo Ecuador</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Garantía oficial</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Headphones className="h-3.5 w-3.5 shrink-0" /> Soporte 24/7</span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap xl:inline-flex"><CreditCard className="h-3.5 w-3.5 shrink-0" /> Difiere hasta 12 meses</span>
        </div>
        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-right md:flex">
          <a href="tel:+593989955400" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-brand-yellow">
            <Phone className="h-3.5 w-3.5 shrink-0" /> 0989955400 / 0968716845
          </a>
          <span className="whitespace-nowrap text-white/70">Lun-Vie 8h30-18h00</span>
          <span className="hidden whitespace-nowrap text-white/70 xl:inline">Sab-Dom 9h00-15h00</span>
        </div>
      </div>
    </div>
  );
}
