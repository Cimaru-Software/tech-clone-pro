"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.push("/acceso-admin");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <aside style={{
        width: "240px",
        background: "#0B2C5F",
        color: "white",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image
              src="/images/logo.png"
              alt="La Casa del Computador"
              width={160}
              height={48}
              style={{ objectFit: "contain", display: "block", maxHeight: "48px", width: "auto" }}
              priority
            />
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: "0.6rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Panel Administrativo
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "0.75rem", flex: 1 }}>
          {[
            { href: "/admin", label: "📊  Dashboard" },
            { href: "/admin/productos", label: "📦  Productos" },
            { href: "/admin/clientes", label: "👥  Clientes" },
            { href: "/admin/pedidos", label: "🛒  Pedidos" },
            { href: "/admin/comprobantes", label: "✅  Validación de comprobantes" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "0.7rem 1rem",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                marginBottom: "0.2rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Logout — inside flex flow, no absolute */}
        <div style={{ padding: "1rem 0.75rem 1.25rem" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              background: "rgba(215,25,32,0.85)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#D71920")}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(215,25,32,0.85)")}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem", overflow: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
