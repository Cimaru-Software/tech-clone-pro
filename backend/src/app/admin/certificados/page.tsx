"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Certificado {
  id: string;
  nombre: string;
  path: string;
  orden: number;
  createdAt: string;
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: text }; }
}

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // New form state
  const [newNombre, setNewNombre] = useState("");
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);

  const fetchCertificados = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/certificados");
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "Error al cargar"); setCertificados([]); return; }
      setCertificados(data.certificados || []);
    } catch { setError("Error de conexión"); setCertificados([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCertificados(); }, [fetchCertificados]);

  function handleNewFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
    if (newFileRef.current) newFileRef.current.value = "";
  }

  async function handleCreate() {
    if (!newNombre.trim() || !newFile) {
      setError("Completa el nombre y selecciona una imagen.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("nombre", newNombre.trim());
      fd.append("image", newFile);
      const res = await fetch("/api/certificados", { method: "POST", body: fd });
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "No se pudo guardar"); return; }
      setNewNombre("");
      setNewFile(null);
      if (newPreview) URL.revokeObjectURL(newPreview);
      setNewPreview(null);
      await fetchCertificados();
      await Swal.fire({ title: "Certificado guardado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = editingId;
    if (!file || !id) return;
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/certificados/${id}`, { method: "PUT", body: fd });
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "No se pudo reemplazar"); return; }
      await fetchCertificados();
    } catch { setError("Error de conexión"); }
    finally { setEditingId(null); if (replaceFileRef.current) replaceFileRef.current.value = ""; }
  }

  async function handleOrdenBlur(cert: Certificado, newOrden: number) {
    if (newOrden === cert.orden) return;
    try {
      const fd = new FormData();
      fd.append("orden", String(newOrden));
      await fetch(`/api/certificados/${cert.id}`, { method: "PUT", body: fd });
      await fetchCertificados();
    } catch { setError("Error de conexión"); }
  }

  async function handleNombreBlur(cert: Certificado, newNombreVal: string) {
    if (newNombreVal.trim() === cert.nombre) return;
    try {
      const fd = new FormData();
      fd.append("nombre", newNombreVal.trim());
      await fetch(`/api/certificados/${cert.id}`, { method: "PUT", body: fd });
      await fetchCertificados();
    } catch { setError("Error de conexión"); }
  }

  async function handleDelete(cert: Certificado) {
    const result = await Swal.fire({
      title: "Eliminar certificado",
      text: `¿Eliminar "${cert.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D71920",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/certificados/${cert.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchCertificados();
      await Swal.fire({ title: "Eliminado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch {
      await Swal.fire({ title: "Error al eliminar", icon: "error", confirmButtonColor: "#D71920" });
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.45rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "0.85rem", color: "#0f172a", outline: "none",
  };

  return (
    <div>
      <input ref={replaceFileRef} type="file" accept="image/*" onChange={handleReplaceFile} style={{ display: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Certificados</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {certificados.length} certificado{certificados.length !== 1 ? "s" : ""} registrado{certificados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Create form */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 1rem" }}>Nuevo certificado</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase" }}>Nombre</label>
            <input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Ej: Hikvision Certified Engineer"
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase" }}>Imagen</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {newPreview && (
                <img src={newPreview} alt="Preview" style={{ height: "44px", width: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
              )}
              <button
                onClick={() => newFileRef.current?.click()}
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "0.55rem 1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.8rem" }}
              >
                {newPreview ? "Cambiar" : "Seleccionar imagen"}
              </button>
              <input ref={newFileRef} type="file" accept="image/*" onChange={handleNewFile} style={{ display: "none" }} />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "8px", padding: "0.6rem 1.3rem", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Cargando...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Imagen", "Nombre", "Orden", "Fecha", "Acciones"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certificados.map((cert) => (
                <tr key={cert.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.85rem 1rem", width: "160px" }}>
                    <img
                      src={`http://localhost:3001${cert.path}`}
                      alt={cert.nombre}
                      style={{ width: "120px", height: "80px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <input
                      defaultValue={cert.nombre}
                      onBlur={(e) => handleNombreBlur(cert, e.target.value)}
                      style={{ ...inputStyle, width: "100%", minWidth: "180px" }}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <input
                      type="number"
                      defaultValue={cert.orden}
                      onBlur={(e) => handleOrdenBlur(cert, Number(e.target.value))}
                      style={{ ...inputStyle, width: "70px" }}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                    {new Date(cert.createdAt).toLocaleDateString("es-EC")}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.45rem" }}>
                      <button
                        onClick={() => { setEditingId(cert.id); replaceFileRef.current?.click(); }}
                        style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Reemplazar
                      </button>
                      <button
                        onClick={() => handleDelete(cert)}
                        style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {certificados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏅</div>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Sin certificados aún</div>
                    <div style={{ fontSize: "0.875rem" }}>Agrega el primero con el formulario de arriba.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
