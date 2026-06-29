"use client";
import { useState, useEffect } from "react";

type EstadoPedido = "PENDIENTE" | "ENVIADO" | "ENTREGADO" | "ANULADO";

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

const estadoConfig: Record<EstadoPedido, { badge: { bg: string; color: string }; row: string; label: string }> = {
  PENDIENTE:  { badge: { bg: "#fef3c7", color: "#92400e" }, row: "#fffbeb", label: "Pendiente" },
  ENVIADO:    { badge: { bg: "#dbeafe", color: "#1e40af" }, row: "#eff6ff", label: "Enviado" },
  ENTREGADO:  { badge: { bg: "#d1fae5", color: "#065f46" }, row: "#f0fdf4", label: "Entregado" },
  ANULADO:    { badge: { bg: "#fee2e2", color: "#991b1b" }, row: "#fff1f2", label: "Anulado" },
};

const ESTADOS: EstadoPedido[] = ["PENDIENTE", "ENVIADO", "ENTREGADO", "ANULADO"];

const PAGE_SIZE = 10;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | "">("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const normalizedSearch = search.trim().toLowerCase().replace(/^#/, "");
  const pedidosFiltrados = pedidos.filter((p) => {
    if (normalizedSearch) {
      const fullId = p.id.toLowerCase();
      const shortId = p.id.slice(-8).toLowerCase();
      if (!fullId.includes(normalizedSearch) && !shortId.includes(normalizedSearch)) return false;
    }
    if (filtroEstado && p.estado !== filtroEstado) return false;

    const createdAt = new Date(p.createdAt);
    if (fechaDesde) {
      const desde = new Date(`${fechaDesde}T00:00:00`);
      if (createdAt < desde) return false;
    }
    if (fechaHasta) {
      const hasta = new Date(`${fechaHasta}T23:59:59`);
      if (createdAt > hasta) return false;
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(pedidosFiltrados.length / PAGE_SIZE));
  const pagina = Math.min(currentPage, totalPages);
  const pedidosPagina = pedidosFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const hasFilters = Boolean(search || fechaDesde || fechaHasta || filtroEstado);

  function resetPage() { setCurrentPage(1); }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1rem" }}>Pedidos ({pedidos.length})</h1>

      {/* Filtros */}
      <div style={{ background: "white", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por número o código de pedido..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.25rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value as EstadoPedido | ""); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: filtroEstado ? "#0f172a" : "#94a3b8", background: "white" }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>{estadoConfig[s].label}</option>
          ))}
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => { setFechaDesde(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: fechaDesde ? "#0f172a" : "#94a3b8" }}
          aria-label="Fecha desde"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => { setFechaHasta(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: fechaHasta ? "#0f172a" : "#94a3b8" }}
          aria-label="Fecha hasta"
        />
        <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}><b style={{ color: "#0f172a" }}>{pedidosFiltrados.length}</b> de {pedidos.length}</span>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFechaDesde(""); setFechaHasta(""); setFiltroEstado(""); resetPage(); }}
            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "0.35rem 0.65rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Leyenda de colores */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {ESTADOS.map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: estadoConfig[s].row, border: `1.5px solid ${estadoConfig[s].badge.bg}`, borderRadius: "999px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", fontWeight: "600", color: estadoConfig[s].badge.color }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: estadoConfig[s].badge.color, display: "inline-block" }} />
            {estadoConfig[s].label}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Cargando...</div>
      ) : (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pedidosPagina.map(p => {
            const cfg = estadoConfig[p.estado] ?? estadoConfig["PENDIENTE"];
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} style={{ background: cfg.row, borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", border: `1.5px solid ${cfg.badge.bg}` }}>
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
                      style={{ background: cfg.badge.bg, color: cfg.badge.color, border: "none", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      {ESTADOS.map(s => (
                        <option key={s} value={s}>{estadoConfig[s].label}</option>
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
                  <div style={{ borderTop: `1px solid ${cfg.badge.bg}`, padding: "1rem 1.5rem", background: "rgba(255,255,255,0.6)" }}>
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
          {pedidosPagina.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", background: "white", borderRadius: "12px" }}>{pedidos.length === 0 ? "No hay pedidos aún." : "No hay pedidos con esos filtros."}</div>
          )}
        </div>
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Página <b>{pagina}</b> de <b>{totalPages}</b> · mostrando {pedidosPagina.length} pedidos</span>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button onClick={() => setCurrentPage(1)} disabled={pagina === 1} style={{ padding: "0.4rem 0.7rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === 1 ? "not-allowed" : "pointer", color: pagina === 1 ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}>«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={pagina === 1} style={{ padding: "0.4rem 0.8rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === 1 ? "not-allowed" : "pointer", color: pagina === 1 ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}>‹ Anterior</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={pagina === totalPages} style={{ padding: "0.4rem 0.8rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === totalPages ? "not-allowed" : "pointer", color: pagina === totalPages ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}>Siguiente ›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={pagina === totalPages} style={{ padding: "0.4rem 0.7rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === totalPages ? "not-allowed" : "pointer", color: pagina === totalPages ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}>»</button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
