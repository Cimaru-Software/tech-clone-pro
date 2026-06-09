export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [totalProductos, totalClientes, totalPedidos] = await Promise.all([
    prisma.producto.count(),
    prisma.cliente.count(),
    prisma.pedido.count(),
  ]);

  const pedidosRecientes = await prisma.pedido.findMany({
    take: 5,
    include: { cliente: { select: { nombre: true, apellido: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", marginBottom: "1.5rem" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Productos", value: totalProductos, color: "#0B2C5F" },
          { label: "Clientes", value: totalClientes, color: "#059669" },
          { label: "Pedidos", value: totalPedidos, color: "#D71920" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{stat.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Pedidos Recientes</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              {["ID", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidosRecientes.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>#{p.id.slice(-8)}</td>
                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.875rem" }}>{p.cliente.nombre} {p.cliente.apellido}</td>
                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>${Number(p.total).toFixed(2)}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600" }}>{p.estado}</span>
                </td>
                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>{new Date(p.createdAt).toLocaleDateString("es-EC")}</td>
              </tr>
            ))}
            {pedidosRecientes.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No hay pedidos aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
