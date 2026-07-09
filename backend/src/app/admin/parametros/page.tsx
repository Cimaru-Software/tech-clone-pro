"use client";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface EnvioProvincia {
  id: string;
  provincia: string;
  costo: number;
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: text }; }
}

export default function ParametrosPage() {
  const [ivaPorcentaje, setIvaPorcentaje] = useState("15");
  const [ivaSaving, setIvaSaving] = useState(false);
  const [envios, setEnvios] = useState<EnvioProvincia[]>([]);
  const [envioValues, setEnvioValues] = useState<Record<string, string>>({});
  const [enviosSaving, setEnviosSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ivaRes, envioRes] = await Promise.all([
        fetch("/api/parametros/iva"),
        fetch("/api/parametros/envio"),
      ]);
      const ivaData = await readJson(ivaRes);
      const envioData = await readJson(envioRes);
      if (!ivaRes.ok || !envioRes.ok) {
        setError(ivaData.error || envioData.error || "Error al cargar");
        return;
      }
      setIvaPorcentaje(String(ivaData.porcentaje ?? 15));
      const list: EnvioProvincia[] = envioData.envios || [];
      setEnvios(list);
      const values: Record<string, string> = {};
      for (const e of list) values[e.provincia] = String(e.costo);
      setEnvioValues(values);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSaveIva() {
    const porcentaje = Number(ivaPorcentaje);
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      setError("El IVA debe ser un número entre 0 y 100");
      return;
    }
    setIvaSaving(true);
    setError("");
    try {
      const res = await fetch("/api/parametros/iva", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentaje }),
      });
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "No se pudo guardar el IVA"); return; }
      await Swal.fire({ title: "IVA guardado", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch {
      setError("Error de conexión");
    } finally {
      setIvaSaving(false);
    }
  }

  async function handleSaveEnvios() {
    const payload = envios.map((e) => ({
      provincia: e.provincia,
      costo: Number(envioValues[e.provincia]),
    }));
    if (payload.some((p) => !Number.isFinite(p.costo) || p.costo < 0)) {
      setError("Todos los costos de envío deben ser números válidos (0 o mayores)");
      return;
    }
    setEnviosSaving(true);
    setError("");
    try {
      const res = await fetch("/api/parametros/envio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envios: payload }),
      });
      const data = await readJson(res);
      if (!res.ok) { setError(data.error || "No se pudieron guardar los envíos"); return; }
      await fetchData();
      await Swal.fire({ title: "Costos de envío guardados", icon: "success", confirmButtonColor: "#0B2C5F" });
    } catch {
      setError("Error de conexión");
    } finally {
      setEnviosSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Parámetros</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
          Configura el IVA y el costo de envío por provincia usados en el checkout.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Cargando...</div>
      ) : (
        <>
          {/* IVA */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 1rem" }}>IVA</h2>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.875rem", color: "#334155", fontWeight: "600" }}>Porcentaje de IVA (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={ivaPorcentaje}
                onChange={(e) => setIvaPorcentaje(e.target.value)}
                style={{ width: "120px", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
              />
              <button
                onClick={handleSaveIva}
                disabled={ivaSaving}
                style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "8px", padding: "0.6rem 1.3rem", fontWeight: "700", cursor: ivaSaving ? "not-allowed" : "pointer", fontSize: "0.875rem" }}
              >
                {ivaSaving ? "Guardando..." : "Guardar IVA"}
              </button>
            </div>
          </div>

          {/* Envío por provincia */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Costo de envío por provincia</h2>
              <button
                onClick={handleSaveEnvios}
                disabled={enviosSaving}
                style={{ background: "#0B2C5F", color: "white", border: "none", borderRadius: "8px", padding: "0.6rem 1.3rem", fontWeight: "700", cursor: enviosSaving ? "not-allowed" : "pointer", fontSize: "0.875rem" }}
              >
                {enviosSaving ? "Guardando..." : "Guardar todos"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
              {envios.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.875rem", color: "#334155", fontWeight: "600" }}>{e.provincia}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ color: "#64748b", fontSize: "0.875rem" }}>$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={envioValues[e.provincia] ?? ""}
                      onChange={(ev) => setEnvioValues((v) => ({ ...v, [e.provincia]: ev.target.value }))}
                      style={{ width: "90px", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
