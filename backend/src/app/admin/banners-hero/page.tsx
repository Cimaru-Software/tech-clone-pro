"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface BannerHero {
  id: string;
  path: string;
  orden: number;
  activo: boolean;
  createdAt: string;
}

interface PreviewFile {
  file: File;
  preview: string;
}

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function BannersHeroPage() {
  const [banners, setBanners] = useState<BannerHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/banners-hero?includeInactive=true");
      const data = await readJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar los banners. Reinicia el backend si acabas de crear la tabla.");
        setBanners([]);
        return;
      }
      setBanners(data.banners || []);
    } catch {
      setError("Error de conexión");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviewFiles((prev) => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePreview(idx: number) {
    setPreviewFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadBanners() {
    if (previewFiles.length === 0) return;
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      previewFiles.forEach((pf) => fd.append("images", pf.file));
      const res = await fetch("/api/banners-hero", { method: "POST", body: fd });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "No se pudieron subir las imágenes");
        return;
      }

      previewFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);
      await fetchBanners();
      await Swal.fire({ title: "Banners guardados", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function updateBanner(id: string, data: { activo?: boolean; orden?: number; file?: File }) {
    setEditingId(id);
    setError("");

    try {
      const fd = new FormData();
      if (typeof data.activo === "boolean") fd.append("activo", String(data.activo));
      if (typeof data.orden === "number") fd.append("orden", String(data.orden));
      if (data.file) fd.append("image", data.file);

      const res = await fetch(`/api/banners-hero/${id}`, { method: "PUT", body: fd });
      const result = await readJsonResponse(res);
      if (!res.ok) {
        setError(result.error || "No se pudo actualizar el banner");
        return;
      }
      await fetchBanners();
    } catch {
      setError("Error de conexión");
    } finally {
      setEditingId(null);
    }
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = editingId;
    if (!file || !id) return;
    await updateBanner(id, { file });
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  }

  async function handleDelete(banner: BannerHero) {
    const result = await Swal.fire({
      title: "Eliminar banner",
      text: "Esta imagen dejará de mostrarse en el hero.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D71920",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/banners-hero/${banner.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar el banner");
      await fetchBanners();
      await Swal.fire({ title: "Banner eliminado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch (error) {
      await Swal.fire({
        title: "No se pudo eliminar",
        text: error instanceof Error ? error.message : "Intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#D71920",
      });
    }
  }

  const inputStyle = {
    width: "90px",
    padding: "0.45rem 0.6rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.85rem",
    color: "#0f172a",
    outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Banners Hero</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {banners.length} banner{banners.length !== 1 ? "s" : ""} configurado{banners.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px",
            padding: "0.7rem 1.4rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem",
            boxShadow: "0 2px 8px rgba(11,44,95,0.25)",
          }}
        >
          + Subir fotos
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} style={{ display: "none" }} />
      <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplaceFile} style={{ display: "none" }} />

      {previewFiles.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1rem", color: "#0f172a", margin: 0 }}>Fotos nuevas</h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>Se guardarán en el orden seleccionado.</p>
            </div>
            <button
              onClick={uploadBanners}
              disabled={saving}
              style={{ background: "#D71920", color: "white", border: "none", borderRadius: "8px", padding: "0.65rem 1.1rem", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Guardando..." : "Guardar fotos"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {previewFiles.map((pf, idx) => (
              <div key={pf.preview} style={{ position: "relative", aspectRatio: "16 / 7", borderRadius: "10px", overflow: "hidden", border: "1.5px dashed #93c5fd", background: "#f8fafc" }}>
                <img src={pf.preview} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removePreview(idx)}
                  style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(220,38,38,0.92)", color: "white", cursor: "pointer", fontWeight: "700" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Cargando banners...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Imagen", "Orden", "Estado", "Fecha", "Acciones"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.85rem 1rem", width: "34%" }}>
                    <img
                      src={`${banner.path}`}
                      alt="Banner hero"
                      style={{ width: "260px", maxWidth: "100%", aspectRatio: "16 / 7", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0", display: "block" }}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <input
                      type="number"
                      value={banner.orden}
                      onChange={(e) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, orden: Number(e.target.value) } : b))}
                      onBlur={(e) => updateBanner(banner.id, { orden: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem", cursor: "pointer", color: "#475569", fontSize: "0.875rem", fontWeight: "600" }}>
                      <input
                        type="checkbox"
                        checked={banner.activo}
                        disabled={editingId === banner.id}
                        onChange={(e) => updateBanner(banner.id, { activo: e.target.checked })}
                        style={{ width: "18px", height: "18px", accentColor: "#0B2C5F" }}
                      />
                      {banner.activo ? "Activo" : "Inactivo"}
                    </label>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                    {new Date(banner.createdAt).toLocaleDateString("es-EC")}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => { setEditingId(banner.id); replaceInputRef.current?.click(); }}
                        style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Reemplazar
                      </button>
                      <button
                        onClick={() => handleDelete(banner)}
                        style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "7px", padding: "0.45rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🖼️</div>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Sin banners aún</div>
                    <div style={{ fontSize: "0.875rem" }}>Sube una foto para reemplazar la imagen fija del hero.</div>
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
