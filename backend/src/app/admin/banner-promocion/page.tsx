"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface BannerPromocion {
  id: string;
  path: string;
  updatedAt: string;
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: text }; }
}

export default function BannerPromocionPage() {
  const [banner, setBanner] = useState<BannerPromocion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanner = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/banner-promocion");
      const data = await readJson(res);
      setBanner(data.banner || null);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanner(); }, [fetchBanner]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/banner-promocion", { method: "POST", body: fd });
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "No se pudo guardar"); return; }
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      await fetchBanner();
      await Swal.fire({ title: "Banner guardado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    const result = await Swal.fire({
      title: "Eliminar banner de promoción",
      text: "Se eliminará la imagen. La sección quedará vacía.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D71920",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch("/api/banner-promocion", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBanner(null);
      await Swal.fire({ title: "Banner eliminado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch {
      await Swal.fire({ title: "Error al eliminar", icon: "error", confirmButtonColor: "#D71920" });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Banner de Promoción</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
          Una sola imagen que aparece en el inicio y en la página de Promociones.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Upload card */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 1rem" }}>
          {banner ? "Reemplazar imagen" : "Subir imagen"}
        </h2>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {preview ? (
          <div style={{ marginBottom: "1rem" }}>
            <img src={preview} alt="Vista previa" style={{ width: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "10px", border: "1.5px dashed #93c5fd", background: "#f8fafc" }} />
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", border: "2px dashed #cbd5e1", borderRadius: "10px", padding: "3rem 1rem",
              background: "#f8fafc", cursor: "pointer", color: "#64748b", fontSize: "0.9rem",
              fontWeight: "600", marginBottom: "1rem", display: "block",
            }}
          >
            📂  Haz clic para seleccionar una imagen
          </button>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {preview && (
            <button
              onClick={() => fileRef.current?.click()}
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "0.6rem 1.1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" }}
            >
              Cambiar imagen
            </button>
          )}
          {file && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "8px", padding: "0.6rem 1.3rem", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem" }}
            >
              {saving ? "Guardando..." : "Guardar banner"}
            </button>
          )}
        </div>
      </div>

      {/* Current banner */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Cargando...</div>
      ) : banner ? (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Banner actual</h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
                Última actualización: {new Date(banner.updatedAt).toLocaleDateString("es-EC")}
              </p>
            </div>
            <button
              onClick={handleDelete}
              style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
            >
              Eliminar
            </button>
          </div>
          <img
            src={`${banner.path}`}
            alt="Banner promoción"
            style={{ width: "100%", maxHeight: "350px", objectFit: "contain", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc" }}
          />
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🖼️</div>
          <div style={{ fontWeight: "600" }}>Sin banner aún</div>
          <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Sube una imagen para mostrarla en el inicio y promociones.</div>
        </div>
      )}
    </div>
  );
}
