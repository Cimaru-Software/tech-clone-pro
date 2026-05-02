import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { MessageCircle, Package, User, LogOut } from "lucide-react";

export const Route = createFileRoute("/mi-cuenta/pedidos")({
  head: () => ({ meta: [{ title: "Mis Pedidos — La Casa del Computador" }] }),
  component: MisPedidosPage,
});

const estadoColors: Record<string, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800",
  PENDIENTE_VALIDACION: "bg-amber-100 text-amber-800",
  COMPROBANTE_RECHAZADO: "bg-red-100 text-red-800",
  COMPRA_APROBADA: "bg-green-100 text-green-800",
  PROCESANDO: "bg-blue-100 text-blue-800",
  ENVIADO:    "bg-indigo-100 text-indigo-800",
  ENTREGADO:  "bg-green-100 text-green-800",
  CANCELADO:  "bg-red-100 text-red-800",
};

const estadoLabels: Record<string, string> = {
  PENDIENTE_VALIDACION: "PENDIENTE DE VALIDACION",
  COMPROBANTE_RECHAZADO: "COMPROBANTE RECHAZADO",
  COMPRA_APROBADA: "COMPRA APROBADA",
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function imageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}

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
      <h1 className="text-3xl font-black text-brand-blue mb-8">Mi Cuenta</h1>
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
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
            <Link to="/mi-cuenta" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary text-sm">
              <User className="h-4 w-4" /> Mi perfil
            </Link>
            <Link to="/mi-cuenta/pedidos" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-secondary text-brand-blue font-semibold text-sm">
              <Package className="h-4 w-4" /> Mis pedidos
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 text-red-500 text-sm">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        <div className="space-y-4">
          {loadingPedidos ? (
            <div className="bg-white rounded-xl border shadow-sm p-10 text-center text-muted-foreground">Cargando pedidos...</div>
          ) : !pedidos?.length ? (
            <div className="bg-white rounded-xl border shadow-sm p-10 lg:p-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">Aún no tienes pedidos</p>
              <Link to="/tienda" className="inline-block mt-4 bg-brand-red text-white px-5 py-2 rounded font-bold text-sm">Ir a la tienda</Link>
            </div>
          ) : pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-secondary border-b">
                <div className="text-sm">
                  <span className="text-muted-foreground">{p.tipo === "compra" ? "Compra " : "Pedido "}</span>
                  <span className="font-mono font-semibold">#{p.id.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estadoColors[p.estado] || ""}`}>{estadoLabels[p.estado] || p.estado}</span>
                  <span className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-EC")}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                {p.estado === "PENDIENTE_VALIDACION" && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Tu comprobante fue recibido y está pendiente de validación. Cuando sea aprobado se creará tu pedido.
                  </div>
                )}
                {p.estado === "COMPROBANTE_RECHAZADO" && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <div className="font-bold">Tu comprobante fue rechazado.</div>
                    {p.motivoRechazo && <div className="mt-1">Motivo: {p.motivoRechazo}</div>}
                    <a
                      href="https://wa.me/593999999999"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      ¿CREES QUE FUE UN ERROR? Contáctanos por WhatsApp
                    </a>
                  </div>
                )}
                {p.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.producto.imagenes?.[0] && (
                      <img src={imageUrl(item.producto.imagenes[0].path)} alt="" className="h-12 w-12 object-contain bg-secondary rounded" />
                    )}
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{item.producto.nombre}</div>
                      <div className="text-muted-foreground text-xs">{item.producto.marca} · x{item.cantidad}</div>
                    </div>
                    <div className="font-bold text-brand-blue text-sm">${(Number(item.precio) * item.cantidad).toFixed(2)}</div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-1">
                  <span className="text-sm text-muted-foreground">{p.metodoPago} · {p.ciudad}{p.provincia ? `, ${p.provincia}` : ""}</span>
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
