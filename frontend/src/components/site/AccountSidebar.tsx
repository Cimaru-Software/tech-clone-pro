import { Link } from "@/lib/router";
import { User, Package, LogOut } from "lucide-react";
import type { Cliente } from "@/types";

interface Props {
  cliente: Cliente;
  onLogout: () => void;
}

export function AccountSidebar({ cliente, onLogout }: Props) {
  return (
    <aside className="bg-white rounded-xl border shadow-sm p-5 h-fit">
      <div className="flex items-center gap-3 p-4 mb-5 bg-secondary rounded-lg">
        <div className="h-12 w-12 shrink-0 bg-brand-blue rounded-full flex items-center justify-center text-white font-black text-base">
          {cliente.nombre[0]}{cliente.apellido[0]}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-snug break-words">{cliente.nombre} {cliente.apellido}</div>
          <div className="text-xs text-muted-foreground break-all mt-0.5">{cliente.email}</div>
        </div>
      </div>
      <nav className="space-y-1">
        <Link
          to="/mi-cuenta"
          activeProps={{ className: "bg-brand-blue/10 text-brand-blue font-semibold" }}
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm transition-colors"
        >
          <User className="h-4 w-4 shrink-0" /> Mi perfil
        </Link>
        <Link
          to="/mi-cuenta/pedidos"
          activeProps={{ className: "bg-brand-blue/10 text-brand-blue font-semibold" }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm transition-colors"
        >
          <Package className="h-4 w-4 shrink-0" /> Mis pedidos
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-500 text-sm transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
