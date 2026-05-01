import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, LogOut } from "lucide-react";

export const Route = createFileRoute("/mi-cuenta/")({
  head: () => ({ meta: [{ title: "Mi Cuenta — La Casa del Computador" }] }),
  component: MiCuentaPage,
});

function MiCuentaPage() {
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

  if (!cliente) return null;

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-black text-brand-blue mb-6">Mi Cuenta</h1>
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-xl shadow-sm p-4 h-fit">
          <div className="flex items-center gap-3 p-3 mb-4 bg-secondary rounded-lg">
            <div className="h-10 w-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
              {cliente.nombre[0]}{cliente.apellido[0]}
            </div>
            <div>
              <div className="font-semibold text-sm">{cliente.nombre} {cliente.apellido}</div>
              <div className="text-xs text-muted-foreground">{cliente.email}</div>
            </div>
          </div>
          <nav className="space-y-1">
            <Link to="/mi-cuenta" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-brand-blue font-semibold text-sm">
              <User className="h-4 w-4" /> Mi perfil
            </Link>
            <Link to="/mi-cuenta/pedidos" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-sm">
              <Package className="h-4 w-4" /> Mis pedidos
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 text-sm">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-lg mb-4">Información personal</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Nombre", value: cliente.nombre },
              { label: "Apellido", value: cliente.apellido },
              { label: "Email", value: cliente.email },
              { label: "Teléfono", value: cliente.telefono || "—" },
              { label: "Dirección", value: cliente.direccion || "—" },
              { label: "Ciudad", value: cliente.ciudad || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-muted-foreground text-xs mb-0.5">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
