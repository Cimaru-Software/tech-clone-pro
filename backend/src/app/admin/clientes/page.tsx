"use client";
import { useEffect, useState } from "react";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  ciudad?: string | null;
  createdAt: string;
  _count: { pedidos: number };
}

const PAGE_SIZE = 15;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        if (active) setClientes(data.clientes || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const clientesFiltrados = clientes.filter((c) => {
    if (!normalizedSearch) return true;
    const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
    return nombreCompleto.includes(normalizedSearch) || c.email.toLowerCase().includes(normalizedSearch);
  });
  const totalPages = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE));
  const pagina = Math.min(currentPage, totalPages);
  const clientesPagina = clientesFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  function resetPage() { setCurrentPage(1); }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1rem" }}>Clientes ({clientes.length})</h1>
      <div style={{ background: "white", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "240px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.25rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}><b style={{ color: "#0f172a" }}>{clientesFiltrados.length}</b> de {clientes.length}</span>
        {search && (
          <button
            onClick={() => { setSearch(""); resetPage(); }}
            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "0.35rem 0.65rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Cargando...</div>
      ) : (
        <>
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Nombre", "Email", "Teléfono", "Ciudad", "Pedidos", "Registro"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientesPagina.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: "500" }}>{c.nombre} {c.apellido}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.email}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.telefono || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.ciudad || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600" }}>{c._count.pedidos}</span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{new Date(c.createdAt).toLocaleDateString("es-EC")}</td>
                  </tr>
                ))}
                {clientesPagina.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>{clientes.length === 0 ? "No hay clientes registrados." : "No hay clientes con esa búsqueda."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 0.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Página <b>{pagina}</b> de <b>{totalPages}</b> · mostrando {clientesPagina.length} clientes</span>
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
