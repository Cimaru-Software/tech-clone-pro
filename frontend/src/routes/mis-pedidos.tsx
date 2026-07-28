import { Link, useNavigate } from "@/lib/router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { MessageCircle, Package } from "lucide-react";

const estadoColors: Record<string, string> = {
  PENDIENTE:             "bg-yellow-100 text-yellow-800",
  PENDIENTE_VALIDACION:  "bg-amber-100 text-amber-800",
  COMPROBANTE_RECHAZADO: "bg-red-100 text-red-800",
  COMPRA_APROBADA:       "bg-green-100 text-green-800",
  PROCESANDO:            "bg-blue-100 text-blue-800",
  ENVIADO:               "bg-indigo-100 text-indigo-800",
  ENTREGADO:             "bg-emerald-100 text-emerald-800",
  CANCELADO:             "bg-red-100 text-red-800",
};

const estadoLabels: Record<string, string> = {
  PENDIENTE_VALIDACION:  "PENDIENTE DE VALIDACIÓN",
  COMPROBANTE_RECHAZADO: "COMPROBANTE RECHAZADO",
  COMPRA_APROBADA:       "COMPRA APROBADA",
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function imgUrl(path?: string) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
}

export default function MisPedidosPage() {
  const { cliente, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { data: pedidos, isLoading: loadingPedidos } = useMyOrders();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>;
  if (!cliente) return null;

  return (
    <div className="container-x py-10 max-w-3xl">
      <h1 className="text-3xl font-black text-brand-blue mb-8">Mis Pedidos</h1>

      {loadingPedidos ? (
        <div className="bg-white rounded-2xl border shadow-sm p-10 text-center text-muted-foreground">
          Cargando pedidos...
        </div>
      ) : !pedidos?.length ? (
        <div className="bg-white rounded-2xl border shadow-sm p-10 lg:p-16 text-center">
          <Package className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <p className="font-bold text-lg">Aún no tienes pedidos</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Explora nuestra tienda y realiza tu primera compra.</p>
          <Link to="/tienda" className="inline-block bg-brand-red text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} en tu cuenta
          </p>

          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              {/* Cabecera */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-50 border-b">
                <div className="text-sm">
                  <span className="text-muted-foreground">{p.tipo === "compra" ? "Compra " : "Pedido "}</span>
                  <span className="font-mono font-bold">#{p.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estadoColors[p.estado] ?? "bg-slate-100 text-slate-700"}`}>
                    {estadoLabels[p.estado] ?? p.estado}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4">
                {p.estado === "PENDIENTE_VALIDACION" && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Tu comprobante fue recibido y está pendiente de validación.
                  </div>
                )}
                {p.estado === "COMPROBANTE_RECHAZADO" && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <div className="font-bold">Tu comprobante fue rechazado.</div>
                    {p.motivoRechazo && <div className="mt-1">Motivo: {p.motivoRechazo}</div>}
                    <a
                      href="https://wa.me/593989955400"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" /> ¿Crees que fue un error? Contáctanos
                    </a>
                  </div>
                )}

                <div className="divide-y">
                  {p.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      {item.producto.imagenes?.[0] ? (
                        <img src={imgUrl(item.producto.imagenes[0].path)} alt="" className="h-12 w-12 object-contain bg-secondary rounded shrink-0" />
                      ) : (
                        <div className="h-12 w-12 bg-secondary rounded shrink-0 grid place-items-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="font-medium truncate">{item.producto.nombre}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{item.producto.marca} · x{item.cantidad}</div>
                      </div>
                      <div className="font-bold text-brand-blue text-sm shrink-0">
                        ${(Number(item.precio) * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-between items-center pt-3 mt-1 border-t gap-2">
                  <span className="text-xs text-muted-foreground capitalize">
                    {p.metodoPago} · {p.ciudad}{p.provincia ? `, ${p.provincia}` : ""}
                  </span>
                  <span className="font-black text-brand-blue">Total: ${Number(p.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
