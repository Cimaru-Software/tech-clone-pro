import { prisma } from "@/lib/prisma";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      ciudad: true,
      createdAt: true,
      _count: { select: { pedidos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1.5rem" }}>Clientes ({clientes.length})</h1>
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Nombre", "Email", "Teléfono", "Ciudad", "Pedidos", "Registro"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0.875rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: "500" }}>{c.nombre} {c.apellido}</td>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.email}</td>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.telefono || "—"}</td>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{c.ciudad || "—"}</td>
                <td style={{ padding: "0.875rem 1rem" }}>
                  <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600" }}>{c._count.pedidos}</span>
                </td>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>{new Date(c.createdAt).toLocaleDateString("es-EC")}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No hay clientes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
