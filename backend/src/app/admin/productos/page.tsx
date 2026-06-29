"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Subsubcategoria { id: string; nombre: string; slug: string; subcategoriaId: string; }
interface Subcategoria { id: string; nombre: string; slug: string; categoriaId: string; subsubcategorias?: Subsubcategoria[]; }
interface Categoria { id: string; nombre: string; slug: string; subcategorias?: Subcategoria[]; }
interface ProductoImagen { id: string; path: string; orden: number; }
interface Producto {
  id: string; nombre: string; marca: string; categoriaId: string;
  categoria: Categoria; subcategoriaId?: string | null; subsubcategoriaId?: string | null; descripcion: string; precio: number; descuento: number;
  destacado: boolean; stock: number; estado: "ACTIVO" | "INACTIVO"; imagenes: ProductoImagen[];
  contificoId?: string | null; contificoCode?: string | null; lastSyncedAt?: string | null;
}

interface Serial {
  id: string;
  serial: string;
  estado: string;
  createdAt: string;
  itemCompra: { compraId: string; compra: { createdAt: string } } | null;
}

interface PreviewFile {
  file: File;
  preview: string;
}

const defaultForm = {
  nombre: "", marca: "", categoriaId: "", subcategoriaId: "" as string | null,
  subsubcategoriaId: "" as string | null, descripcion: "",
  precio: 0, descuento: 0, destacado: false, stock: 0, estado: "ACTIVO" as Producto["estado"],
};

const PAGE_SIZE = 20;

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Filtros y búsqueda
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroContifico, setFiltroContifico] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [syncProgress, setSyncProgress] = useState<{
    fase: string;
    mensaje: string;
    total?: number;
    procesados?: number;
    sincronizados?: number;
    omitidos?: number;
    errores?: number;
  } | null>(null);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [existingImages, setExistingImages] = useState<ProductoImagen[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seriales
  const [serialesModal, setSerialesModal] = useState<{ producto: Producto; seriales: Serial[] } | null>(null);
  const [loadingSeriales, setLoadingSeriales] = useState(false);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/productos?todos=1");
    const data = await res.json();
    setProductos(data.productos || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProductos();
    fetch("/api/categorias").then(r => r.json()).then(d => setCategorias(d.categorias || []));
  }, [fetchProductos]);

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setPreviewFiles([]);
    setExistingImages([]);
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Producto) {
    setEditId(p.id);
    setForm({ nombre: p.nombre, marca: p.marca, categoriaId: p.categoriaId, subcategoriaId: p.subcategoriaId ?? null, subsubcategoriaId: p.subsubcategoriaId ?? null, descripcion: p.descripcion, precio: Number(p.precio), descuento: p.descuento, destacado: p.destacado, stock: p.stock, estado: p.estado });
    setPreviewFiles([]);
    setExistingImages(p.imagenes || []);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    previewFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    setPreviewFiles([]);
    setShowModal(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalSlots = 5 - existingImages.length;
    const allowed = files.slice(0, totalSlots - previewFiles.length);
    const newPreviews = allowed.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviewFiles(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePreview(idx: number) {
    setPreviewFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function removeExistingImage(imageId: string) {
    setDeletingImageId(imageId);
    try {
      await fetch(`/api/productos/imagenes/${imageId}`, { method: "DELETE" });
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      // ignore
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/productos/${editId}` : "/api/productos";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, precio: Number(form.precio), descuento: Number(form.descuento), stock: Number(form.stock), subcategoriaId: form.subcategoriaId || null, subsubcategoriaId: form.subsubcategoriaId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }

      const productoId = editId || data.producto.id;

      // Upload new images if any
      if (previewFiles.length > 0) {
        const fd = new FormData();
        fd.append("productoId", productoId);
        previewFiles.forEach(pf => fd.append("images", pf.file));
        await fetch("/api/upload", { method: "POST", body: fd });
      }

      closeModal();
      fetchProductos();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  function handleSyncContifico() {
    setSyncing(true);
    setSyncProgress({ fase: "cargando", mensaje: "Iniciando sincronización..." });

    const es = new EventSource("/api/contifico/sync-productos/stream");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setSyncProgress(data);

      if (data.fase === "completo" || data.fase === "error") {
        es.close();
        setSyncing(false);
        fetchProductos();
      }
    };

    es.onerror = () => {
      es.close();
      setSyncing(false);
      setSyncProgress(prev => prev?.fase !== "completo" ? { fase: "error", mensaje: "Error de conexión con el servidor" } : prev);
    };
  }

  async function openSeriales(p: Producto) {
    setLoadingSeriales(true);
    setSerialesModal({ producto: p, seriales: [] });
    const res = await fetch(`/api/productos/${p.id}/seriales`);
    const data = await res.json();
    setSerialesModal({ producto: p, seriales: data.seriales || [] });
    setLoadingSeriales(false);
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar producto",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D71920",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar el producto");
      await fetchProductos();
      await Swal.fire({
        title: "Producto eliminado",
        icon: "success",
        confirmButtonColor: "#0B2C5F",
      });
    } catch (error) {
      await Swal.fire({
        title: "No se pudo eliminar",
        text: error instanceof Error ? error.message : "Intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#D71920",
      });
    }
  }

  // Lógica de filtrado y paginación
  const productosFiltrados = productos.filter(p => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.marca.toLowerCase().includes(search.toLowerCase()) && !(p.contificoCode || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filtroCategoria && p.categoriaId !== filtroCategoria) return false;
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (filtroContifico === "si" && !p.contificoId) return false;
    if (filtroContifico === "no" && p.contificoId) return false;
    if (filtroStock === "sin" && p.stock > 0) return false;
    if (filtroStock === "con" && p.stock === 0) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const pagina = Math.min(currentPage, totalPages);
  const productosPagina = productosFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  function resetPage() { setCurrentPage(1); }

  const subcategoriasDisponibles = categorias.find(c => c.id === form.categoriaId)?.subcategorias ?? [];
  const subsubcategoriasDisponibles = subcategoriasDisponibles.find(s => s.id === form.subcategoriaId)?.subsubcategorias ?? [];

  const totalImages = existingImages.length + previewFiles.length;
  const canAddMore = totalImages < 5;

  const inputStyle = {
    width: "100%", padding: "0.5rem 0.75rem", border: "1.5px solid #e2e8f0",
    borderRadius: "8px", fontSize: "0.875rem", boxSizing: "border-box" as const,
    outline: "none", color: "#0f172a", background: "white",
  };
  const labelStyle = {
    display: "block", fontSize: "0.75rem", fontWeight: "600" as const,
    color: "#374151", marginBottom: "0.35rem", textTransform: "uppercase" as const, letterSpacing: "0.04em",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Productos</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{productos.length} producto{productos.length !== 1 ? "s" : ""} en total</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSyncContifico}
            disabled={syncing}
            style={{
              background: syncing ? "#94a3b8" : "white",
              color: syncing ? "white" : "#0B2C5F",
              border: "2px solid #0B2C5F",
              borderRadius: "10px",
              padding: "0.7rem 1.4rem",
              fontWeight: "600",
              cursor: syncing ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {syncing ? "Sincronizando..." : "↻ Sincronizar Contífico"}
          </button>
          <button onClick={openCreate} style={{
            background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px",
            padding: "0.7rem 1.4rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem",
            display: "flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 2px 8px rgba(11,44,95,0.25)",
          }}>
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{ background: "white", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        {/* Búsqueda */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, marca o código..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.25rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        {/* Filtro categoría */}
        <select
          value={filtroCategoria}
          onChange={e => { setFiltroCategoria(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: filtroCategoria ? "#0f172a" : "#94a3b8", minWidth: "150px" }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        {/* Filtro estado */}
        <select
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: filtroEstado ? "#0f172a" : "#94a3b8" }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>

        {/* Filtro stock */}
        <select
          value={filtroStock}
          onChange={e => { setFiltroStock(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: filtroStock ? "#0f172a" : "#94a3b8" }}
        >
          <option value="">Cualquier stock</option>
          <option value="con">Con stock</option>
          <option value="sin">Sin stock</option>
        </select>

        {/* Filtro Contífico */}
        <select
          value={filtroContifico}
          onChange={e => { setFiltroContifico(e.target.value); resetPage(); }}
          style={{ padding: "0.55rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem", outline: "none", color: filtroContifico ? "#0f172a" : "#94a3b8" }}
        >
          <option value="">Todos los orígenes</option>
          <option value="si">De Contífico</option>
          <option value="no">Manuales</option>
        </select>

        {/* Contador y limpiar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}>
            <b style={{ color: "#0f172a" }}>{productosFiltrados.length}</b> de {productos.length}
          </span>
          {(search || filtroCategoria || filtroEstado || filtroStock || filtroContifico) && (
            <button
              onClick={() => { setSearch(""); setFiltroCategoria(""); setFiltroEstado(""); setFiltroStock(""); setFiltroContifico(""); resetPage(); }}
              style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "0.35rem 0.65rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
          Cargando productos...
        </div>
      ) : (
        <>
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Imagen", "Nombre", "Marca", "Categoría", "Precio", "Dcto.", "Destacado", "Stock", "Estado", "Acciones"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosPagina.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {p.imagenes[0] ? (
                        <img src={`${p.imagenes[0].path}`} alt={p.nombre}
                          style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      ) : (
                        <div style={{ width: "52px", height: "52px", background: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", border: "1px solid #e2e8f0" }}>📷</div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: "600", color: "#0f172a", maxWidth: "200px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                      <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        {p.contificoId && (
                          <span style={{ background: "#ecfdf5", color: "#065f46", fontSize: "0.6rem", fontWeight: "700", padding: "0.1rem 0.4rem", borderRadius: "4px", border: "1px solid #a7f3d0" }}>
                            CTFICO {p.contificoCode || ""}
                          </span>
                        )}
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{p.imagenes.length} img</span>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#475569" }}>{p.marca}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#475569" }}>
                      <div>{p.categoria?.nombre}</div>
                      {p.subcategoriaId && (() => {
                        const sub = categorias.find(c => c.id === p.categoriaId)?.subcategorias?.find(s => s.id === p.subcategoriaId);
                        const subsub = sub?.subsubcategorias?.find(ss => ss.id === p.subsubcategoriaId);
                        return (
                          <>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.1rem" }}>{sub?.nombre ?? "—"}</div>
                            {subsub && <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.05rem" }}>↳ {subsub.nombre}</div>}
                          </>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: "700", color: "#0B2C5F" }}>${Number(p.precio).toFixed(2)}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                      {p.descuento > 0 ? <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem" }}>{p.descuento}%</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                      {p.destacado ? <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem" }}>Sí</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: p.stock === 0 ? "#ef4444" : "#475569", fontWeight: p.stock === 0 ? "700" : "400" }}>{p.stock}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ background: p.estado === "ACTIVO" ? "#dcfce7" : "#fee2e2", color: p.estado === "ACTIVO" ? "#166534" : "#991b1b", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase" as const }}>
                        {p.estado}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button onClick={() => openEdit(p)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>Editar</button>
                        {p.contificoId && (
                          <button onClick={() => openSeriales(p)} style={{ background: "#f0fdf4", color: "#166534", border: "none", borderRadius: "7px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>Seriales</button>
                        )}
                        <button onClick={() => handleDelete(p.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "7px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {productosPagina.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{productos.length === 0 ? "📦" : "🔍"}</div>
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{productos.length === 0 ? "Sin productos aún" : "Sin resultados"}</div>
                      <div style={{ fontSize: "0.875rem" }}>{productos.length === 0 ? "Crea tu primer producto con el botón de arriba" : "Intenta con otros filtros"}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 0.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Página <b>{pagina}</b> de <b>{totalPages}</b> · mostrando {productosPagina.length} productos
              </span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={pagina === 1}
                  style={{ padding: "0.4rem 0.7rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === 1 ? "not-allowed" : "pointer", color: pagina === 1 ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}
                >«</button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{ padding: "0.4rem 0.8rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === 1 ? "not-allowed" : "pointer", color: pagina === 1 ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}
                >‹ Anterior</button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(pagina - 2, totalPages - 4));
                  const num = start + i;
                  return num <= totalPages ? (
                    <button key={num} onClick={() => setCurrentPage(num)}
                      style={{ padding: "0.4rem 0.75rem", border: `1.5px solid ${num === pagina ? "#0B2C5F" : "#e2e8f0"}`, borderRadius: "7px", background: num === pagina ? "#0B2C5F" : "white", color: num === pagina ? "white" : "#475569", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                    >{num}</button>
                  ) : null;
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={pagina === totalPages}
                  style={{ padding: "0.4rem 0.8rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === totalPages ? "not-allowed" : "pointer", color: pagina === totalPages ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}
                >Siguiente ›</button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={pagina === totalPages}
                  style={{ padding: "0.4rem 0.7rem", border: "1.5px solid #e2e8f0", borderRadius: "7px", background: "white", cursor: pagina === totalPages ? "not-allowed" : "pointer", color: pagina === totalPages ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: "600" }}
                >»</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sync Progress Modal */}
      {syncProgress && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "white", borderRadius: "20px", padding: "2.5rem",
            width: "100%", maxWidth: "480px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            textAlign: "center",
          }}>
            {/* Icono animado */}
            <div style={{ marginBottom: "1.5rem" }}>
              {syncProgress.fase === "completo" ? (
                <div style={{ width: "64px", height: "64px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "2rem" }}>✓</div>
              ) : syncProgress.fase === "error" ? (
                <div style={{ width: "64px", height: "64px", background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "2rem" }}>✗</div>
              ) : (
                <div style={{ width: "64px", height: "64px", margin: "0 auto", position: "relative" }}>
                  <svg viewBox="0 0 64 64" style={{ width: "64px", height: "64px", animation: "spin 1s linear infinite" }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#0B2C5F" strokeWidth="6"
                      strokeDasharray="88 88" strokeLinecap="round" strokeDashoffset="22" />
                  </svg>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </div>

            {/* Título */}
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.5rem" }}>
              {syncProgress.fase === "completo" ? "¡Sincronización completada!" :
               syncProgress.fase === "error" ? "Error en sincronización" :
               "Sincronizando con Contífico"}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
              {syncProgress.mensaje}
            </p>

            {/* Barra de progreso */}
            {syncProgress.total && syncProgress.total > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                  <span>{syncProgress.procesados ?? 0} procesados</span>
                  <span>{syncProgress.total} total</span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "999px",
                    background: "linear-gradient(90deg, #0B2C5F, #1d4ed8)",
                    width: `${Math.round(((syncProgress.procesados ?? 0) / syncProgress.total) * 100)}%`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem", textAlign: "right" }}>
                  {Math.round(((syncProgress.procesados ?? 0) / syncProgress.total) * 100)}%
                </div>
              </div>
            )}

            {/* Estadísticas */}
            {(syncProgress.sincronizados !== undefined) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "#dcfce7", borderRadius: "10px", padding: "0.75rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#166534" }}>{syncProgress.sincronizados}</div>
                  <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: "600" }}>Importados</div>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: "10px", padding: "0.75rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#475569" }}>{syncProgress.omitidos ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: "600" }}>Sin stock</div>
                </div>
                <div style={{ background: syncProgress.errores ? "#fee2e2" : "#f1f5f9", borderRadius: "10px", padding: "0.75rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: syncProgress.errores ? "#991b1b" : "#475569" }}>{syncProgress.errores ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", color: syncProgress.errores ? "#991b1b" : "#475569", fontWeight: "600" }}>Errores</div>
                </div>
              </div>
            )}

            {/* Botón cerrar solo cuando termina */}
            {(syncProgress.fase === "completo" || syncProgress.fase === "error") && (
              <button
                onClick={() => setSyncProgress(null)}
                style={{
                  background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px",
                  padding: "0.75rem 2rem", fontWeight: "700", cursor: "pointer", fontSize: "0.875rem",
                  boxShadow: "0 2px 8px rgba(11,44,95,0.3)",
                }}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seriales Modal */}
      {serialesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "640px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "16px 16px 0 0" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Seriales — {serialesModal.producto.nombre}</h2>
                <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
                  {loadingSeriales ? "Cargando..." : `${serialesModal.seriales.length} serial${serialesModal.seriales.length !== 1 ? "es" : ""} registrados`}
                </p>
              </div>
              <button onClick={() => setSerialesModal(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "34px", height: "34px", fontSize: "1.2rem", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Resumen */}
            {!loadingSeriales && serialesModal.seriales.length > 0 && (
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "1rem" }}>
                {[
                  { label: "Disponibles", valor: serialesModal.seriales.filter(s => s.estado === "disponible").length, bg: "#dcfce7", color: "#166534" },
                  { label: "Vendidos", valor: serialesModal.seriales.filter(s => s.estado === "vendido").length, bg: "#fee2e2", color: "#991b1b" },
                ].map(({ label, valor, bg, color }) => (
                  <div key={label} style={{ background: bg, borderRadius: "10px", padding: "0.65rem 1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: "800", color }}>{valor}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lista */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loadingSeriales ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Cargando seriales...</div>
              ) : serialesModal.seriales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
                  <div style={{ fontWeight: "600" }}>Sin seriales registrados</div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Sincroniza con Contífico para importarlos</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                      {["Serial", "Estado", "Importado", "Compra"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0.65rem 1.5rem", fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serialesModal.seriales.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1.5rem", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "600", color: "#0f172a" }}>{s.serial}</td>
                        <td style={{ padding: "0.75rem 1.5rem" }}>
                          <span style={{
                            background: s.estado === "disponible" ? "#dcfce7" : "#fee2e2",
                            color: s.estado === "disponible" ? "#166534" : "#991b1b",
                            padding: "0.2rem 0.6rem", borderRadius: "999px",
                            fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase" as const,
                          }}>
                            {s.estado === "disponible" ? "Disponible" : "Vendido"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(s.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "0.75rem 1.5rem", fontSize: "0.8rem" }}>
                          {s.itemCompra ? (
                            <span style={{ color: "#0B2C5F", fontWeight: "600", fontFamily: "monospace", fontSize: "0.75rem" }}>
                              #{s.itemCompra.compraId.slice(-8).toUpperCase()}
                            </span>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", borderRadius: "0 0 16px 16px" }}>
              <button onClick={() => setSerialesModal(null)} style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "9px", padding: "0.65rem 1.5rem", fontWeight: "700", cursor: "pointer", fontSize: "0.875rem" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            {/* Modal header */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 10, borderRadius: "16px 16px 0 0" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{editId ? "Editar Producto" : "Nuevo Producto"}</h2>
                <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>Completa la información y sube las imágenes</p>
              </div>
              <button onClick={closeModal} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "34px", height: "34px", fontSize: "1.1rem", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.75rem 2rem" }}>
              {/* Info fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nombre del producto</label>
                  <input style={inputStyle} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: Laptop HP 250 G9 Core i5" />
                </div>
                <div>
                  <label style={labelStyle}>Marca</label>
                  <input style={inputStyle} value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} required placeholder="HP, Dell, Lenovo..." />
                </div>
                <div>
                  <label style={labelStyle}>Categoría</label>
                  <select
                    style={inputStyle}
                    value={form.categoriaId}
                    onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value, subcategoriaId: null, subsubcategoriaId: null }))}
                    required
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Subcategoría <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(opcional)</span></label>
                  <select
                    style={{ ...inputStyle, color: form.subcategoriaId ? "#0f172a" : "#94a3b8" }}
                    value={form.subcategoriaId ?? ""}
                    onChange={e => setForm(f => ({ ...f, subcategoriaId: e.target.value || null, subsubcategoriaId: null }))}
                    disabled={!form.categoriaId || subcategoriasDisponibles.length === 0}
                  >
                    <option value="">{!form.categoriaId ? "— Selecciona categoría primero —" : "Sin subcategoría"}</option>
                    {subcategoriasDisponibles.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Sub-Subcategoría <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(opcional)</span></label>
                  <select
                    style={{ ...inputStyle, color: form.subsubcategoriaId ? "#0f172a" : "#94a3b8" }}
                    value={form.subsubcategoriaId ?? ""}
                    onChange={e => setForm(f => ({ ...f, subsubcategoriaId: e.target.value || null }))}
                    disabled={!form.subcategoriaId || subsubcategoriasDisponibles.length === 0}
                  >
                    <option value="">
                      {!form.subcategoriaId
                        ? "— Selecciona subcategoría primero —"
                        : subsubcategoriasDisponibles.length === 0
                        ? "— Esta subcategoría no tiene subsubcategorías —"
                        : "Sin subsubcategoría"}
                    </option>
                    {subsubcategoriasDisponibles.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descripción</label>
                  <textarea style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} required placeholder="Descripción detallada del producto..." />
                </div>
                <div>
                  <label style={labelStyle}>Precio ($)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={labelStyle}>Descuento (%)</label>
                  <input style={inputStyle} type="number" min="0" max="100" value={form.descuento} onChange={e => setForm(f => ({ ...f, descuento: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input style={inputStyle} type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select style={inputStyle} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as "ACTIVO" | "INACTIVO" }))}>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
                <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.65rem", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "0.85rem 1rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#0B2C5F" }}
                  />
                  <span>
                    <span style={{ display: "block", fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>Producto destacado</span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>Se mostrará en la sección de productos destacados de la página inicial.</span>
                  </span>
                </label>
              </div>

              {/* Images section */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Imágenes del producto</label>
                    <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>
                      {totalImages}/5 imágenes · Formatos: JPG, PNG, WebP
                    </p>
                  </div>
                  {canAddMore && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: "#eff6ff", color: "#1d4ed8", border: "1.5px dashed #93c5fd", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
                    >
                      + Agregar imágenes
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {totalImages === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "2rem",
                      textAlign: "center", cursor: "pointer", color: "#94a3b8",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#0B2C5F"; (e.currentTarget as HTMLDivElement).style.background = "#f8fafc"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</div>
                    <div style={{ fontWeight: "600", color: "#475569", fontSize: "0.9rem" }}>Haz clic para subir imágenes</div>
                    <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Hasta 5 imágenes por producto</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                    {/* Existing images (when editing) */}
                    {existingImages.map(img => (
                      <div key={img.id} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
                        <img
                          src={`${img.path}`}
                          alt="Imagen del producto"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          disabled={deletingImageId === img.id}
                          style={{
                            position: "absolute", top: "4px", right: "4px",
                            background: "rgba(220,38,38,0.9)", color: "white",
                            border: "none", borderRadius: "50%", width: "22px", height: "22px",
                            cursor: "pointer", fontSize: "0.7rem", fontWeight: "700",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {deletingImageId === img.id ? "…" : "×"}
                        </button>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.45)", color: "white", fontSize: "0.6rem", padding: "2px 4px", textAlign: "center" }}>Guardada</div>
                      </div>
                    ))}

                    {/* New previews */}
                    {previewFiles.map((pf, idx) => (
                      <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", border: "1.5px dashed #93c5fd" }}>
                        <img src={pf.preview} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => removePreview(idx)}
                          style={{
                            position: "absolute", top: "4px", right: "4px",
                            background: "rgba(220,38,38,0.9)", color: "white",
                            border: "none", borderRadius: "50%", width: "22px", height: "22px",
                            cursor: "pointer", fontSize: "0.7rem", fontWeight: "700",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >×</button>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(11,44,95,0.6)", color: "white", fontSize: "0.6rem", padding: "2px 4px", textAlign: "center" }}>Nueva</div>
                      </div>
                    ))}

                    {/* Add more slot */}
                    {canAddMore && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          aspectRatio: "1", border: "2px dashed #cbd5e1", borderRadius: "10px",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "#94a3b8", fontSize: "0.7rem", gap: "0.25rem",
                          transition: "all 0.15s",
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#0B2C5F"; (e.currentTarget as HTMLDivElement).style.color = "#0B2C5F"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLDivElement).style.color = "#94a3b8"; }}
                      >
                        <span style={{ fontSize: "1.25rem" }}>+</span>
                        <span>Agregar</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: "0.7rem 1.4rem", border: "1.5px solid #e2e8f0", borderRadius: "9px", background: "white", cursor: "pointer", fontWeight: "600", color: "#475569", fontSize: "0.875rem" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "0.7rem 1.8rem",
                    background: saving ? "#94a3b8" : "#0B2C5F",
                    color: "white", border: "none", borderRadius: "9px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "700", fontSize: "0.875rem",
                    boxShadow: saving ? "none" : "0 2px 8px rgba(11,44,95,0.3)",
                  }}
                >
                  {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
