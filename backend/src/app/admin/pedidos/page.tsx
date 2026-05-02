"use client";
import { useState, useEffect } from "react";

type EstadoPedido = "PENDIENTE" | "ENTREGADO";

interface ItemPedido {
  id: string;
  cantidad: number;
  precio: number;
  producto: { nombre: string; marca: string; imagenes: { path: string }[] };
}

interface Pedido {
  id: string;
  total: number;
  estado: EstadoPedido;
  metodoPago: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  notas?: string;
  createdAt: string;
  cliente: { nombre: string; apellido: string; email: string };
  items: ItemPedido[];
}

const estadoColors: Record<EstadoPedido, { bg: string; color: string }> = {
  PENDIENTE:   { bg: "#fef3c7", color: "#92400e" },
  ENTREGADO:   { bg: "#d1fae5", color: "#065f46" },
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchPedidos() {
    setLoading(true);
    const res = await fetch("/api/pedidos?scope=admin");
    const data = await res.json();
    setPedidos(data.pedidos || []);
    setLoading(false);
  }

  useEffect(() => { fetchPedidos(); }, []);

  async function changeEstado(id: string, estado: EstadoPedido) {
    await fetch(`/api/pedidos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) });
    fetchPedidos();
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1.5rem" }}>Pedidos ({pedidos.length})</h1>
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Cargando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pedidos.map(p => {
            const colors = estadoColors[p.estado];
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>#{p.id.slice(-8)}</div>
                    <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>{p.cliente.nombre} {p.cliente.apellido}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{p.cliente.email}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Total</div>
                    <div style={{ fontWeight: "700", color: "#0B2C5F", fontSize: "1rem" }}>${Number(p.total).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Pago</div>
                    <div style={{ fontSize: "0.875rem" }}>{p.metodoPago}</div>
                  </div>
                  <div>
                    <select
                      value={p.estado}
                      onChange={e => changeEstado(p.id, e.target.value as EstadoPedido)}
                      style={{ background: colors.bg, color: colors.color, border: "none", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      {(["PENDIENTE","ENTREGADO"] as EstadoPedido[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{new Date(p.createdAt).toLocaleDateString("es-EC")}</div>
                    <button onClick={() => setExpanded(isExpanded ? null : p.id)} style={{ background: "none", border: "none", color: "#0B2C5F", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600", marginTop: "0.25rem" }}>
                      {isExpanded ? "▲ Ocultar" : "▼ Ver detalle"}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #f3f4f6", padding: "1rem 1.5rem", background: "#fafafa" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                      <div><span style={{ color: "#9ca3af" }}>Dirección: </span>{p.direccion}, {p.ciudad}, {p.provincia}</div>
                      {p.notas && <div><span style={{ color: "#9ca3af" }}>Notas: </span>{p.notas}</div>}
                    </div>
                    <div style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Productos ({p.items.length})</div>
                    {p.items.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}>
                        {item.producto.imagenes[0] && (
                          <img src={item.producto.imagenes[0].path} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
                        )}
                        <div style={{ flex: 1, fontSize: "0.875rem" }}>{item.producto.nombre} <span style={{ color: "#9ca3af" }}>({item.producto.marca})</span></div>
                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>x{item.cantidad}</div>
                        <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>${(Number(item.precio) * item.cantidad).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {pedidos.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", background: "white", borderRadius: "12px" }}>No hay pedidos aún.</div>
          )}
        </div>
      )}
    </div>
  );
}
