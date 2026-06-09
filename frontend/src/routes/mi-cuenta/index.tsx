import { Link, useNavigate } from "@/lib/router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, LogOut, Mail, Phone, MapPin, Building2 } from "lucide-react";

export default function MiCuentaPage() {
  const { cliente, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!cliente) {
    return <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>;
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-black text-brand-blue mb-8">Mi Cuenta</h1>
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Sidebar */}
        <aside className="bg-white rounded-xl border shadow-sm p-5 h-fit">
          <div className="flex items-start gap-4 p-4 mb-5 bg-secondary rounded-lg min-w-0">
            <div className="h-12 w-12 shrink-0 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
              {cliente.nombre[0]}{cliente.apellido[0]}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-snug break-words">{cliente.nombre} {cliente.apellido}</div>
              <div className="text-xs text-muted-foreground break-all mt-1">{cliente.email}</div>
            </div>
          </div>
          <nav className="space-y-1">
            <Link to="/mi-cuenta" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-secondary text-brand-blue font-semibold text-sm">
              <User className="h-4 w-4" /> Mi perfil
            </Link>
            <Link to="/mi-cuenta/pedidos" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary text-sm">
              <Package className="h-4 w-4" /> Mis pedidos
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 text-red-500 text-sm">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="bg-white rounded-xl border shadow-sm p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="font-bold text-xl text-foreground">Información personal</h2>
            <p className="text-sm text-muted-foreground mt-1">Datos asociados a tu cuenta y entregas.</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Nombre", value: cliente.nombre, icon: User },
              { label: "Apellido", value: cliente.apellido, icon: User },
              { label: "Email", value: cliente.email, icon: Mail },
              { label: "Teléfono", value: cliente.telefono || "No registrado", icon: Phone },
              { label: "Dirección", value: cliente.direccion || "No registrada", icon: MapPin },
              { label: "Ciudad", value: cliente.ciudad || "No registrada", icon: Building2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border bg-white p-4 min-w-0">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
                  <Icon className="h-4 w-4 text-brand-blue" />
                  {label}
                </div>
                <div className="font-semibold text-foreground mt-2 break-words">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
