"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccesoAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e2e8f0",
    borderRadius: "10px", fontSize: "0.9rem", boxSizing: "border-box",
    background: "white", color: "#0f172a", outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Brand panel */}
      <div style={{
        flex: isMobile ? "none" : "0 0 45%",
        background: "linear-gradient(145deg, #0B2C5F 0%, #0d3872 60%, #0a2550 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: isMobile ? "2rem 1.5rem" : "3rem 2.5rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(215,25,32,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-100px", left: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "1rem 1.5rem", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxWidth: "260px", width: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="La Casa del Computador" style={{ maxWidth: "200px", width: "100%", height: "auto", maxHeight: "60px", objectFit: "contain", display: "block" }} />
          </div>
          <h1 style={{ color: "white", fontSize: "1.35rem", fontWeight: "700", margin: "0 0 0.4rem" }}>Panel Administrativo</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", margin: 0 }}>Gestiona tu tienda en un solo lugar</p>

          {!isMobile && (
            <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {[{ icon: "📦", label: "Gestión de productos" }, { icon: "👥", label: "Base de clientes" }, { icon: "🛒", label: "Control de pedidos" }].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.7rem 1rem", color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                  <span>{item.icon}</span>{item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.65rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.4rem" }}>Iniciar sesión</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#374151", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Correo electrónico
              </label>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="admin@lacasadelcomputador.com"
                onFocus={e => (e.target.style.borderColor = "#0B2C5F")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
            </div>

            <div style={{ marginBottom: "1.6rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#374151", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inp, paddingRight: "3rem" }} type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••••••"
                  onFocus={e => (e.target.style.borderColor = "#0B2C5F")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1rem", padding: 0, lineHeight: 1 }}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.8rem 1rem", borderRadius: "10px", fontSize: "0.875rem", marginBottom: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "0.875rem", color: "white", border: "none", borderRadius: "10px",
              fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #D71920 0%, #b91c1c 100%)",
              boxShadow: loading ? "none" : "0 4px 14px rgba(215,25,32,0.35)", fontFamily: "inherit",
            }}>
              {loading ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.775rem", color: "#94a3b8" }}>
            © {new Date().getFullYear()} La Casa del Computador · Acceso restringido
          </p>
        </div>
      </div>
    </div>
  );
}
