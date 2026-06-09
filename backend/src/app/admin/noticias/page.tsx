"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  portada: string;
  publicado: boolean;
  createdAt: string;
}

async function readJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: text }; }
}

const PAGE_SIZE = 10;

export default function NoticiasPage() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNoticias, setTotalNoticias] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNoticias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/noticias?publicado=all&page=${currentPage}&limit=${PAGE_SIZE}`);
      const data = await readJson(res);
      setNoticias(data.noticias || []);
      setTotalNoticias(data.total || 0);
      setTotalPages(Math.max(1, data.pages || 1));
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }, [currentPage]);

  useEffect(() => { fetchNoticias(); }, [fetchNoticias]);

  async function togglePublicado(n: Noticia) {
    const fd = new FormData();
    fd.append("publicado", String(!n.publicado));
    await fetch(`/api/noticias/${n.id}`, { method: "PUT", body: fd });
    await fetchNoticias();
  }

  async function handleDelete(n: Noticia) {
    const result = await Swal.fire({
      title: "Eliminar noticia",
      text: `¿Eliminar "${n.titulo}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D71920",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    await fetch(`/api/noticias/${n.id}`, { method: "DELETE" });
    if (noticias.length === 1 && currentPage > 1) setCurrentPage((page) => page - 1);
    else await fetchNoticias();
    Swal.fire({ title: "Eliminada", icon: "success", confirmButtonColor: "#0B2C5F" });
  }

  const pagina = Math.min(currentPage, totalPages);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Noticias</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{totalNoticias} noticia{totalNoticias !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => router.push("/admin/noticias/nueva")}
          style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px", padding: "0.7rem 1.4rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem", boxShadow: "0 2px 8px rgba(11,44,95,0.25)" }}
        >
          + Nueva noticia
        </button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Cargando...</div>
      ) : (
        <>
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Portada", "Título", "Estado", "Fecha", "Acciones"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noticias.map((n) => (
                <tr key={n.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", width: "100px" }}>
                    <img src={`${n.portada}`} alt={n.titulo} style={{ width: "80px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "#0f172a", maxWidth: "320px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.titulo}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>/noticias/{n.slug}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button
                      onClick={() => togglePublicado(n)}
                      style={{
                        padding: "0.3rem 0.75rem", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.75rem",
                        background: n.publicado ? "#dcfce7" : "#f1f5f9",
                        color: n.publicado ? "#16a34a" : "#64748b",
                      }}
                    >
                      {n.publicado ? "✓ Publicada" : "Borrador"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                    {new Date(n.createdAt).toLocaleDateString("es-EC")}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.45rem" }}>
                      <button
                        onClick={() => router.push(`/admin/noticias/${n.id}`)}
                        style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(n)}
                        style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {noticias.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📰</div>
                    <div style={{ fontWeight: "600" }}>Sin noticias aún</div>
                    <div style={{ fontSize: "0.875rem" }}>Crea la primera con el botón de arriba.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Página <b>{pagina}</b> de <b>{totalPages}</b> · mostrando {noticias.length} noticias</span>
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
