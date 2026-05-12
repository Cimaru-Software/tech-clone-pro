"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const NoticiaEditor = dynamic(() => import("../NoticiaEditor"), { ssr: false });

const isNew = (id: string) => id === "nueva";

export default function NoticiaFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const creating = isNew(id);

  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [publicado, setPublicado] = useState(false);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
  const [portadaActual, setPortadaActual] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!creating);
  const [error, setError] = useState("");
  const portadaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) return;
    fetch(`/api/noticias/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.noticia) {
          setTitulo(d.noticia.titulo);
          setCuerpo(d.noticia.cuerpo);
          setPublicado(d.noticia.publicado);
          setPortadaActual(`http://localhost:3001${d.noticia.portada}`);
        } else {
          setError("Noticia no encontrada");
        }
      })
      .catch(() => setError("Error al cargar la noticia"))
      .finally(() => setLoading(false));
  }, [id, creating]);

  function handlePortadaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPortadaFile(f);
    if (portadaPreview) URL.revokeObjectURL(portadaPreview);
    setPortadaPreview(URL.createObjectURL(f));
  }

  async function handleSave(pub: boolean) {
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }
    if (creating && !portadaFile) { setError("La imagen de portada es obligatoria"); return; }
    setPublicado(pub);
    setSaving(true);
    setError("");

    const fd = new FormData();
    fd.append("titulo", titulo.trim());
    fd.append("cuerpo", cuerpo);
    fd.append("publicado", String(pub));
    if (portadaFile) fd.append("portada", portadaFile);

    try {
      const url = creating ? "/api/noticias" : `/api/noticias/${id}`;
      const method = creating ? "POST" : "PUT";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      await Swal.fire({ title: pub ? (creating ? "Noticia publicada" : "Cambios publicados") : "Guardado como borrador", icon: "success", confirmButtonColor: "#0B2C5F" });
      router.push("/admin/noticias");
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem", color: "#0f172a", outline: "none" };

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <button onClick={() => router.push("/admin/noticias")} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.875rem", padding: 0, marginBottom: "0.25rem" }}>← Volver</button>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{creating ? "Nueva noticia" : "Editar noticia"}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          {/* Estado actual badge */}
          {!creating && (
            <span style={{ fontSize: "0.75rem", fontWeight: "700", padding: "0.3rem 0.75rem", borderRadius: "20px", background: publicado ? "#dcfce7" : "#f1f5f9", color: publicado ? "#16a34a" : "#64748b" }}>
              {publicado ? "✓ Publicada" : "Borrador"}
            </span>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{ background: "white", color: "#475569", border: "1.5px solid #d1d5db", borderRadius: "10px", padding: "0.65rem 1.25rem", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "10px", padding: "0.65rem 1.25rem", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Guardando..." : "Publicar"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Cargando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Título */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
            <label style={labelStyle}>Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la noticia" style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: "600" }} />
          </div>

          {/* Portada */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
            <label style={labelStyle}>Imagen de portada</label>
            <input ref={portadaRef} type="file" accept="image/*" onChange={handlePortadaFile} style={{ display: "none" }} />

            {(portadaPreview || portadaActual) && (
              <div style={{ marginBottom: "0.75rem" }}>
                <img
                  src={portadaPreview || portadaActual!}
                  alt="Portada"
                  style={{ width: "100%", maxHeight: "260px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => portadaRef.current?.click()}
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "0.6rem 1.1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" }}
            >
              {portadaActual || portadaPreview ? "Cambiar portada" : "Seleccionar imagen de portada"}
            </button>
          </div>

          {/* Cuerpo */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
            <label style={labelStyle}>Contenido</label>
            <NoticiaEditor content={cuerpo} onChange={setCuerpo} />
          </div>
        </div>
      )}
    </div>
  );
}
