"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

type TipoReporte = "ventas" | "productos-mas-vendidos" | "clientes-top" | "inventario";

const TABS: { id: TipoReporte; label: string }[] = [
  { id: "ventas", label: "📈 Ventas" },
  { id: "productos-mas-vendidos", label: "🏆 Productos más vendidos" },
  { id: "clientes-top", label: "👑 Clientes top" },
  { id: "inventario", label: "📦 Inventario / Stock" },
];

const PAGE_SIZE = 25;

function money(n: number | undefined | null) {
  return (Number(n) || 0).toLocaleString("es-EC", { style: "currency", currency: "USD" });
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const CHART_COLORS = ["#0B2C5F", "#D71920", "#2563eb", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export default function ReportesPage() {
  const [tab, setTab] = useState<TipoReporte>("ventas");
  const [desde, setDesde] = useState(todayISO(-30));
  const [hasta, setHasta] = useState(todayISO());
  const [page, setPage] = useState(1);
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [buscarDebounced, setBuscarDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  // Resetea a página 1 cuando cambian filtros que alteran el conjunto de resultados
  useEffect(() => {
    setPage(1);
  }, [tab, desde, hasta, soloStockBajo, buscarDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setBuscarDebounced(buscar), 350);
    return () => clearTimeout(t);
  }, [buscar]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          tipo: tab,
          desde,
          hasta,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (tab === "inventario") {
          if (soloStockBajo) params.set("soloStockBajo", "1");
          if (buscarDebounced) params.set("buscar", buscarDebounced);
        }
        const res = await fetch(`/api/reportes?${params}`);
        if (!res.ok) throw new Error("Error al cargar el reporte");
        const json = await res.json();
        if (!cancelled) setData(json.data ?? null);
      } catch (e) {
        if (!cancelled) setError("No se pudo cargar el reporte");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, desde, hasta, page, soloStockBajo, buscarDebounced]);

  // Trae todas las páginas del reporte activo (server-side) para exportar el
  // conjunto completo, no solo la página visible en pantalla.
  async function fetchAllPages(): Promise<any[]> {
    const first = new URLSearchParams({ tipo: tab, desde, hasta, page: "1", pageSize: "500" });
    if (tab === "inventario") {
      if (soloStockBajo) first.set("soloStockBajo", "1");
      if (buscarDebounced) first.set("buscar", buscarDebounced);
    }
    const firstRes = await fetch(`/api/reportes?${first}`);
    const firstJson = await firstRes.json();
    const firstData = firstJson.data;

    const totalPages = firstData?.totalPages ?? 1;
    const acumulado = tab === "inventario" ? [...(firstData.detalle ?? [])] : [...(firstData.rows ?? [])];

    for (let p = 2; p <= totalPages; p++) {
      const params = new URLSearchParams({ tipo: tab, desde, hasta, page: String(p), pageSize: "500" });
      if (tab === "inventario") {
        if (soloStockBajo) params.set("soloStockBajo", "1");
        if (buscarDebounced) params.set("buscar", buscarDebounced);
      }
      const res = await fetch(`/api/reportes?${params}`);
      const json = await res.json();
      const pageRows = tab === "inventario" ? json.data?.detalle ?? [] : json.data?.rows ?? [];
      acumulado.push(...pageRows);
    }

    return acumulado;
  }

  async function exportExcel() {
    if (!data) return;
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      if (tab === "ventas") {
        const porDia = Array.isArray(data.porDia) ? data.porDia : [];
        const porMetodoPago = Array.isArray(data.porMetodoPago) ? data.porMetodoPago : [];
        const resumen = [
          { Métrica: "Ingresos totales", Valor: data.totalIngresos ?? 0 },
          { Métrica: "Órdenes", Valor: data.cantidadOrdenes ?? 0 },
          { Métrica: "Ticket promedio", Valor: data.ticketPromedio ?? 0 },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(porDia.map((d: any) => ({ Fecha: d.fecha, Órdenes: d.cantidadOrdenes, Total: d.totalVentas }))),
          "Ventas por día"
        );
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(porMetodoPago.map((m: any) => ({ Método: m.metodoPago, Total: m.total }))),
          "Por método de pago"
        );
      } else if (tab === "productos-mas-vendidos") {
        const rows = await fetchAllPages();
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(
            rows.map((p: any) => ({
              Producto: p.nombre,
              Marca: p.marca,
              "Unidades vendidas": p.unidadesVendidas,
              Ingresos: p.ingresos,
              "Stock actual": p.stockActual,
            }))
          ),
          "Productos más vendidos"
        );
      } else if (tab === "clientes-top") {
        const rows = await fetchAllPages();
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(
            rows.map((c: any) => ({
              Cliente: c.nombre,
              Email: c.email,
              Compras: c.cantidadCompras,
              "Total gastado": c.totalGastado,
            }))
          ),
          "Clientes top"
        );
      } else if (tab === "inventario") {
        const detalle = await fetchAllPages();
        const resumen = [
          { Métrica: "Productos activos", Valor: data.totalProductosActivos ?? 0 },
          { Métrica: "Sin stock", Valor: data.sinStock ?? 0 },
          { Métrica: "Stock bajo (≤5)", Valor: data.bajoStock ?? 0 },
          { Métrica: "Valor de inventario", Valor: data.valorInventario ?? 0 },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(
            detalle.map((p: any) => ({
              Producto: p.nombre,
              Marca: p.marca,
              Categoría: p.categoria,
              Stock: p.stock,
              Precio: p.precio,
              "Valor en línea": p.valorLinea,
            }))
          ),
          "Inventario"
        );
      }

      XLSX.writeFile(wb, `reporte-${tab}-${todayISO()}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0B2C5F" }}>Reportería</h1>
        <button
          onClick={exportExcel}
          disabled={!data || loading || exporting}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: !data || loading || exporting ? "#9ca3af" : "#10b981",
            color: "white",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: !data || loading || exporting ? "not-allowed" : "pointer",
          }}
        >
          {exporting ? "Generando…" : "⬇️ Exportar a Excel"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid #0B2C5F",
              background: tab === t.id ? "#0B2C5F" : "white",
              color: tab === t.id ? "white" : "#0B2C5F",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "end", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tab !== "inventario" && (
          <>
            <label style={{ fontSize: "0.8rem", color: "#374151" }}>
              Desde
              <br />
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ fontSize: "0.8rem", color: "#374151" }}>
              Hasta
              <br />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={inputStyle} />
            </label>
          </>
        )}
        {tab === "inventario" && (
          <>
            <label style={{ fontSize: "0.8rem", color: "#374151" }}>
              Buscar producto o marca
              <br />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Ej. TINTA AZUL"
                style={{ ...inputStyle, minWidth: "240px" }}
              />
            </label>
            <label style={{ fontSize: "0.8rem", color: "#374151", display: "flex", alignItems: "center", gap: "0.4rem", paddingBottom: "0.55rem" }}>
              <input type="checkbox" checked={soloStockBajo} onChange={(e) => setSoloStockBajo(e.target.checked)} />
              Solo stock bajo (≤5)
            </label>
          </>
        )}
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: "#D71920" }}>{error}</p>}

      {!loading && !error && data && tab === "ventas" && <ReporteVentas data={data} />}
      {!loading && !error && data && tab === "productos-mas-vendidos" && (
        <ReporteProductos data={data} page={page} setPage={setPage} />
      )}
      {!loading && !error && data && tab === "clientes-top" && (
        <ReporteClientes data={data} page={page} setPage={setPage} />
      )}
      {!loading && !error && data && tab === "inventario" && (
        <ReporteInventario data={data} page={page} setPage={setPage} />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.85rem",
};

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "white", borderRadius: "10px", padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", minWidth: "180px" }}>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0B2C5F" }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: "10px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 1rem", color: "#374151" }}>{title}</h3>
      <div style={{ height: "300px" }}>{children}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ background: "white", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "0.65rem 1rem", color: "#374151", fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} style={{ padding: "1rem", color: "#9ca3af", textAlign: "center" }}>
                Sin datos en el rango seleccionado
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "0.6rem 1rem" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  setPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  setPage: (p: number) => void;
}) {
  const safePage = Number(page) || 1;
  const safeTotalPages = Number(totalPages) || 1;
  const safeTotal = Number(total) || 0;
  const safePageSize = Number(pageSize) || PAGE_SIZE;

  if (safeTotalPages <= 1) return null;

  const desde = (safePage - 1) * safePageSize + 1;
  const hasta = Math.min(safePage * safePageSize, safeTotal);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
        Mostrando {desde}–{hasta} de {safeTotal.toLocaleString("es-EC")}
      </span>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <button onClick={() => setPage(1)} disabled={safePage === 1} style={pagBtnStyle(safePage === 1)}>
          «
        </button>
        <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} style={pagBtnStyle(safePage === 1)}>
          ‹ Anterior
        </button>
        <span style={{ fontSize: "0.85rem", color: "#374151", padding: "0 0.5rem" }}>
          Página {safePage} de {safeTotalPages}
        </span>
        <button onClick={() => setPage(safePage + 1)} disabled={safePage === safeTotalPages} style={pagBtnStyle(safePage === safeTotalPages)}>
          Siguiente ›
        </button>
        <button onClick={() => setPage(safeTotalPages)} disabled={safePage === safeTotalPages} style={pagBtnStyle(safePage === safeTotalPages)}>
          »
        </button>
      </div>
    </div>
  );
}

function pagBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 0.7rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: disabled ? "#f3f4f6" : "white",
    color: disabled ? "#9ca3af" : "#0B2C5F",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  };
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const } },
};

function ReporteVentas({ data }: { data: any }) {
  const porDia = Array.isArray(data?.porDia) ? data.porDia : [];
  const porMetodoPago = Array.isArray(data?.porMetodoPago) ? data.porMetodoPago : [];

  const lineData = useMemo(
    () => ({
      labels: porDia.map((d: any) => d.fecha),
      datasets: [
        {
          label: "Ventas ($)",
          data: porDia.map((d: any) => d.totalVentas),
          borderColor: "#0B2C5F",
          backgroundColor: "rgba(11,44,95,0.15)",
          fill: true,
          tension: 0.3,
        },
      ],
    }),
    [porDia]
  );

  const doughnutData = useMemo(
    () => ({
      labels: porMetodoPago.map((m: any) => m.metodoPago),
      datasets: [
        {
          data: porMetodoPago.map((m: any) => m.total),
          backgroundColor: CHART_COLORS,
        },
      ],
    }),
    [porMetodoPago]
  );

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Card label="Ingresos totales" value={money(data?.totalIngresos)} />
        <Card label="Órdenes" value={String(data?.cantidadOrdenes ?? 0)} />
        <Card label="Ticket promedio" value={money(data?.ticketPromedio)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        <ChartCard title="Ventas por día">
          <Line data={lineData} options={chartOptions} />
        </ChartCard>
        <ChartCard title="Por método de pago">
          <Doughnut data={doughnutData} options={chartOptions} />
        </ChartCard>
      </div>

      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "1rem 0 0.5rem", color: "#374151" }}>Ventas por día</h3>
      <Table
        headers={["Fecha", "Órdenes", "Total"]}
        rows={porDia.map((d: any) => [d.fecha, d.cantidadOrdenes, money(d.totalVentas)])}
      />
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "1.5rem 0 0.5rem", color: "#374151" }}>Por método de pago</h3>
      <Table headers={["Método", "Total"]} rows={porMetodoPago.map((m: any) => [m.metodoPago, money(m.total)])} />
    </div>
  );
}

function ReporteProductos({ data, page, setPage }: { data: any; page: number; setPage: (p: number) => void }) {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const top10 = rows.slice(0, 10);

  const barData = useMemo(
    () => ({
      labels: top10.map((p: any) => p.nombre),
      datasets: [
        {
          label: "Unidades vendidas",
          data: top10.map((p: any) => p.unidadesVendidas),
          backgroundColor: "#0B2C5F",
        },
      ],
    }),
    [top10]
  );

  return (
    <div>
      {page === 1 && (
        <ChartCard title="Top 10 productos más vendidos (página actual)">
          <Bar data={barData} options={{ ...chartOptions, indexAxis: "y" as const, plugins: { legend: { display: false } } }} />
        </ChartCard>
      )}
      <Table
        headers={["Producto", "Marca", "Unidades vendidas", "Ingresos", "Stock actual"]}
        rows={rows.map((p: any) => [p.nombre, p.marca, p.unidadesVendidas, money(p.ingresos), p.stockActual])}
      />
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} setPage={setPage} />
    </div>
  );
}

function ReporteClientes({ data, page, setPage }: { data: any; page: number; setPage: (p: number) => void }) {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const top10 = rows.slice(0, 10);

  const barData = useMemo(
    () => ({
      labels: top10.map((c: any) => c.nombre),
      datasets: [
        {
          label: "Total gastado ($)",
          data: top10.map((c: any) => c.totalGastado),
          backgroundColor: "#D71920",
        },
      ],
    }),
    [top10]
  );

  return (
    <div>
      {page === 1 && (
        <ChartCard title="Top 10 clientes por gasto (página actual)">
          <Bar data={barData} options={{ ...chartOptions, indexAxis: "y" as const, plugins: { legend: { display: false } } }} />
        </ChartCard>
      )}
      <Table
        headers={["Cliente", "Email", "Compras", "Total gastado"]}
        rows={rows.map((c: any) => [c.nombre, c.email, c.cantidadCompras, money(c.totalGastado)])}
      />
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} setPage={setPage} />
    </div>
  );
}

function ReporteInventario({ data, page, setPage }: { data: any; page: number; setPage: (p: number) => void }) {
  const detalle = Array.isArray(data?.detalle) ? data.detalle : [];

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Card label="Productos activos" value={(data?.totalProductosActivos ?? 0).toLocaleString("es-EC")} />
        <Card label="Sin stock" value={(data?.sinStock ?? 0).toLocaleString("es-EC")} />
        <Card label="Stock bajo (≤5)" value={(data?.bajoStock ?? 0).toLocaleString("es-EC")} />
        <Card label="Valor de inventario" value={money(data?.valorInventario)} />
      </div>

      <Table
        headers={["Producto", "Marca", "Categoría", "Stock", "Precio", "Valor en línea"]}
        rows={detalle.map((p: any) => [
          p.nombre,
          p.marca,
          p.categoria,
          <span
            key={`stock-${p.productoId}`}
            style={{
              fontWeight: 700,
              color: p.stock === 0 ? "#D71920" : p.stock <= 5 ? "#f59e0b" : "#10b981",
            }}
          >
            {p.stock}
          </span>,
          money(p.precio),
          money(p.valorLinea),
        ])}
      />
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} setPage={setPage} />
    </div>
  );
}
