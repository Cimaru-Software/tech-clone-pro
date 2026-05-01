import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { Package, User, LogOut } from "lucide-react";

export const Route = createFileRoute("/mi-cuenta/pedidos")({
  head: () => ({ meta: [{ title: "Mis Pedidos — La Casa del Computador" }] }),
  component: MisPedidosPage,
});

const estadoColors: Record<string, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800",
  PROCESANDO: "bg-blue-100 text-blue-800",
  ENVIADO:    "bg-indigo-100 text-indigo-800",
  ENTREGADO:  "bg-green-100 text-green-800",
  CANCELADO:  "bg-red-100 text-red-800",
};

function MisPedidosPage() {
  const { cliente, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { data: pedidos, isLoading: loadingPedidos } = useMyOrders();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>;
  if (!cliente) return null;

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-black text-brand-blue mb-6">Mi Cuenta</h1>
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
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
            <Link to="/mi-cuenta" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-sm">
              <User className="h-4 w-4" /> Mi perfil
            </Link>
            <Link to="/mi-cuenta/pedidos" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-brand-blue font-semibold text-sm">
              <Package className="h-4 w-4" /> Mis pedidos
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 text-sm">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        <div className="space-y-4">
          {loadingPedidos ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center text-muted-foreground">Cargando pedidos...</div>
          ) : !pedidos?.length ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">Aún no tienes pedidos</p>
              <Link to="/tienda" className="inline-block mt-4 bg-brand-red text-white px-5 py-2 rounded font-bold text-sm">Ir a la tienda</Link>
            </div>
          ) : pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-secondary border-b">
                <div className="text-sm">
                  <span className="text-muted-foreground">Pedido </span>
                  <span className="font-mono font-semibold">#{p.id.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estadoColors[p.estado] || ""}`}>{p.estado}</span>
                  <span className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-EC")}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                {p.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.producto.imagenes?.[0] && (
                      <img src={item.producto.imagenes[0].path} alt="" className="h-12 w-12 object-contain bg-secondary rounded" />
                    )}
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{item.producto.nombre}</div>
                      <div className="text-muted-foreground text-xs">{item.producto.marca} · x{item.cantidad}</div>
                    </div>
                    <div className="font-bold text-brand-blue text-sm">${(Number(item.precio) * item.cantidad).toFixed(2)}</div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-1">
                  <span className="text-sm text-muted-foreground">{p.metodoPago} · {p.ciudad}</span>
                  <span className="font-black text-brand-blue">Total: ${Number(p.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
