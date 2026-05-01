"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface Categoria { id: string; nombre: string; slug: string; }
interface ProductoImagen { id: string; path: string; orden: number; }
interface Producto {
  id: string; nombre: string; marca: string; categoriaId: string;
  categoria: Categoria; descripcion: string; precio: number; descuento: number;
  stock: number; estado: "ACTIVO" | "INACTIVO"; imagenes: ProductoImagen[];
}

interface PreviewFile {
  file: File;
  preview: string;
}

const defaultForm = {
  nombre: "", marca: "", categoriaId: "", descripcion: "",
  precio: 0, descuento: 0, stock: 0, estado: "ACTIVO" as const,
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [existingImages, setExistingImages] = useState<ProductoImagen[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/productos");
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
    setForm({ nombre: p.nombre, marca: p.marca, categoriaId: p.categoriaId, descripcion: p.descripcion, precio: Number(p.precio), descuento: p.descuento, stock: p.stock, estado: p.estado });
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
        body: JSON.stringify({ ...form, precio: Number(form.precio), descuento: Number(form.descuento), stock: Number(form.stock) }),
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

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    fetchProductos();
  }

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
        <button onClick={openCreate} style={{
          background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px",
          padding: "0.7rem 1.4rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem",
          display: "flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 2px 8px rgba(11,44,95,0.25)",
        }}>
          + Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
          Cargando productos...
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Imagen", "Nombre", "Marca", "Categoría", "Precio", "Dcto.", "Stock", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {p.imagenes[0] ? (
                      <img src={`http://localhost:3001${p.imagenes[0].path}`} alt={p.nombre}
                        style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    ) : (
                      <div style={{ width: "52px", height: "52px", background: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", border: "1px solid #e2e8f0" }}>📷</div>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: "600", color: "#0f172a", maxWidth: "180px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" }}>{p.imagenes.length} imagen{p.imagenes.length !== 1 ? "es" : ""}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#475569" }}>{p.marca}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#475569" }}>{p.categoria?.nombre}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: "700", color: "#0B2C5F" }}>${Number(p.precio).toFixed(2)}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                    {p.descuento > 0 ? <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem" }}>{p.descuento}%</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: p.stock === 0 ? "#ef4444" : "#475569", fontWeight: p.stock === 0 ? "700" : "400" }}>{p.stock}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ background: p.estado === "ACTIVO" ? "#dcfce7" : "#fee2e2", color: p.estado === "ACTIVO" ? "#166534" : "#991b1b", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase" as const }}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openEdit(p)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>Editar</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "7px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📦</div>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Sin productos aún</div>
                    <div style={{ fontSize: "0.875rem" }}>Crea tu primer producto con el botón de arriba</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  <select style={inputStyle} value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))} required>
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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
                          src={`http://localhost:3001${img.path}`}
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
