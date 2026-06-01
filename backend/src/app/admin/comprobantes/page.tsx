"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type EstadoCompra = "PENDIENTE" | "APROBADO" | "RECHAZADO";

interface Compra {
  id: string;
  total: number;
  estado: EstadoCompra;
  metodoPago: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  notas?: string;
  comprobantePath?: string | null;
  motivoRechazo?: string;
  createdAt: string;
  cliente: { nombre: string; apellido: string; email: string };
  pedido?: { id: string; estado: string } | null;
  items: {
    id: string;
    cantidad: number;
    precio: number;
    producto: { nombre: string; marca: string; imagenes: { path: string }[] };
  }[];
}

const estadoColors: Record<EstadoCompra, { bg: string; color: string }> = {
  PENDIENTE: { bg: "#fef3c7", color: "#92400e" },
  APROBADO: { bg: "#d1fae5", color: "#065f46" },
  RECHAZADO: { bg: "#fee2e2", color: "#991b1b" },
};

export default function ComprobantesPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchCompras() {
    setLoading(true);
    const res = await fetch("/api/compras");
    const data = await res.json();
    setCompras(data.compras || []);
    setLoading(false);
  }

  useEffect(() => { fetchCompras(); }, []);

  async function validar(id: string, estado: "APROBADO" | "RECHAZADO") {
    let motivoRechazo: string | undefined;

    if (estado === "RECHAZADO") {
      const result = await Swal.fire({
        title: "Rechazar comprobante",
        input: "text",
        inputLabel: "Motivo del rechazo",
        inputValue: "Comprobante no válido",
        inputPlaceholder: "Escribe el motivo",
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#D71920",
        cancelButtonColor: "#6b7280",
        inputValidator: (value) => !value.trim() ? "El motivo es obligatorio" : undefined,
      });
      if (!result.isConfirmed) return;
      motivoRechazo = result.value;
    } else {
      const result = await Swal.fire({
        title: "Aprobar comprobante",
        text: "Se creará el pedido en estado pendiente.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Aprobar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
      });
      if (!result.isConfirmed) return;
    }

    try {
      const res = await fetch(`/api/compras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, motivoRechazo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo validar la compra");
      await fetchCompras();
      await Swal.fire({
        title: estado === "APROBADO" ? "Comprobante aprobado" : "Comprobante rechazado",
        text: estado === "APROBADO" ? "El pedido fue creado correctamente." : "La compra quedó marcada como rechazada.",
        icon: "success",
        confirmButtonColor: "#0B2C5F",
      });
    } catch (error) {
      await Swal.fire({
        title: "No se pudo procesar",
        text: error instanceof Error ? error.message : "Intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#D71920",
      });
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1.5rem" }}>Validación de comprobantes ({compras.length})</h1>
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Cargando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {compras.map((c) => {
            const colors = estadoColors[c.estado];
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Compra #{c.id.slice(-8)}</div>
                    <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>{c.cliente.nombre} {c.cliente.apellido}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{c.cliente.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Total</div>
                    <div style={{ fontWeight: "700", color: "#0B2C5F" }}>${Number(c.total).toFixed(2)}</div>
                  </div>
                  <span style={{ background: colors.bg, color: colors.color, borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: "700" }}>{c.estado}</span>
                  {c.estado === "PENDIENTE" && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => validar(c.id, "APROBADO")} style={{ background: "#059669", color: "white", border: "none", borderRadius: "8px", padding: "0.55rem 0.8rem", fontWeight: "700", cursor: "pointer" }}>Aprobar</button>
                      <button onClick={() => validar(c.id, "RECHAZADO")} style={{ background: "#D71920", color: "white", border: "none", borderRadius: "8px", padding: "0.55rem 0.8rem", fontWeight: "700", cursor: "pointer" }}>Rechazar</button>
                    </div>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : c.id)} style={{ background: "none", border: "none", color: "#0B2C5F", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>
                    {isExpanded ? "▲ Ocultar" : "▼ Detalle"}
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #f3f4f6", padding: "1rem 1.5rem", background: "#fafafa" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1rem", alignItems: "start" }}>
                      {c.comprobantePath
                        ? <img src={c.comprobantePath} alt="Comprobante" style={{ width: "220px", maxHeight: "280px", objectFit: "contain", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                        : <div style={{ width: "220px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", borderRadius: "8px", fontSize: "0.8rem", color: "#6b7280" }}>Pago con tarjeta</div>
                      }
                      <div>
                        <div style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                          <div><span style={{ color: "#9ca3af" }}>Dirección: </span>{c.direccion}, {c.ciudad}, {c.provincia}</div>
                          {c.notas && <div><span style={{ color: "#9ca3af" }}>Notas: </span>{c.notas}</div>}
                          {c.pedido && <div><span style={{ color: "#9ca3af" }}>Pedido creado: </span>#{c.pedido.id.slice(-8)} ({c.pedido.estado})</div>}
                          {c.motivoRechazo && <div><span style={{ color: "#9ca3af" }}>Rechazo: </span>{c.motivoRechazo}</div>}
                        </div>
                        {c.items.map((item) => (
                          <div key={item.id} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb", alignItems: "center" }}>
                            {item.producto.imagenes[0] && <img src={item.producto.imagenes[0].path} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />}
                            <div style={{ flex: 1, fontSize: "0.875rem" }}>{item.producto.nombre} <span style={{ color: "#9ca3af" }}>({item.producto.marca})</span></div>
                            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>x{item.cantidad}</div>
                            <div style={{ fontWeight: "700", fontSize: "0.875rem" }}>${(Number(item.precio) * item.cantidad).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {compras.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", background: "white", borderRadius: "12px" }}>No hay comprobantes por validar.</div>
          )}
        </div>
      )}
    </div>
  );
}
