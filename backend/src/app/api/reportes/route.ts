import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

const ESTADOS_VENTA_VALIDA = ["APROBADO"] as const;
const UMBRAL_STOCK_BAJO = 5;
const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

function parseRange(searchParams: URLSearchParams) {
  const desdeParam = searchParams.get("desde");
  const hastaParam = searchParams.get("hasta");
  const hasta = hastaParam ? new Date(`${hastaParam}T23:59:59.999`) : new Date();
  const desde = desdeParam
    ? new Date(`${desdeParam}T00:00:00.000`)
    : new Date(hasta.getFullYear(), hasta.getMonth() - 1, hasta.getDate());
  return { desde, hasta };
}

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get("pageSize")) || PAGE_SIZE_DEFAULT));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

async function reporteVentas(desde: Date, hasta: Date) {
  const compras = await prisma.compra.findMany({
    where: { estado: { in: [...ESTADOS_VENTA_VALIDA] }, createdAt: { gte: desde, lte: hasta } },
    select: { total: true, createdAt: true, metodoPago: true },
    orderBy: { createdAt: "asc" },
  });

  const porDia = new Map<string, { fecha: string; totalVentas: number; cantidadOrdenes: number }>();
  let totalIngresos = 0;
  const porMetodoPago = new Map<string, number>();

  for (const c of compras) {
    const fecha = c.createdAt.toISOString().slice(0, 10);
    const monto = Number(c.total);
    totalIngresos += monto;

    const dia = porDia.get(fecha) || { fecha, totalVentas: 0, cantidadOrdenes: 0 };
    dia.totalVentas += monto;
    dia.cantidadOrdenes += 1;
    porDia.set(fecha, dia);

    porMetodoPago.set(c.metodoPago, (porMetodoPago.get(c.metodoPago) || 0) + monto);
  }

  return {
    totalIngresos,
    cantidadOrdenes: compras.length,
    ticketPromedio: compras.length ? totalIngresos / compras.length : 0,
    porDia: Array.from(porDia.values()),
    porMetodoPago: Array.from(porMetodoPago.entries()).map(([metodoPago, total]) => ({ metodoPago, total })),
  };
}

// Agrega en SQL (groupBy) en vez de traer todos los ItemCompra a memoria —
// con 10k+ productos y miles de líneas de venta, agregar en JS no escala.
async function reporteProductosMasVendidos(desde: Date, hasta: Date, page: number, pageSize: number) {
  const grouped = await prisma.itemCompra.groupBy({
    by: ["productoId"],
    where: {
      compra: { estado: { in: [...ESTADOS_VENTA_VALIDA] }, createdAt: { gte: desde, lte: hasta } },
    },
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: "desc" } },
  });

  const total = grouped.length;
  const pageSlice = grouped.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const productoIds = pageSlice.map((g) => g.productoId);
  const [productos, ingresosPorProducto] = await Promise.all([
    prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, nombre: true, marca: true, stock: true },
    }),
    prisma.itemCompra.groupBy({
      by: ["productoId"],
      where: {
        productoId: { in: productoIds },
        compra: { estado: { in: [...ESTADOS_VENTA_VALIDA] }, createdAt: { gte: desde, lte: hasta } },
      },
      _sum: { precio: true },
    }),
  ]);

  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  const rows = pageSlice.map((g) => {
    const producto = productoPorId.get(g.productoId);
    const ingresos = ingresosPorProducto.find((i) => i.productoId === g.productoId)?._sum.precio;
    return {
      productoId: g.productoId,
      nombre: producto?.nombre ?? "(producto eliminado)",
      marca: producto?.marca ?? "-",
      unidadesVendidas: g._sum.cantidad ?? 0,
      ingresos: Number(ingresos ?? 0),
      stockActual: producto?.stock ?? 0,
    };
  });

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function reporteClientesTop(desde: Date, hasta: Date, page: number, pageSize: number) {
  const grouped = await prisma.compra.groupBy({
    by: ["clienteId"],
    where: { estado: { in: [...ESTADOS_VENTA_VALIDA] }, createdAt: { gte: desde, lte: hasta } },
    _sum: { total: true },
    _count: { _all: true },
    orderBy: { _sum: { total: "desc" } },
  });

  const total = grouped.length;
  const pageSlice = grouped.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const clientes = await prisma.cliente.findMany({
    where: { id: { in: pageSlice.map((g) => g.clienteId) } },
    select: { id: true, nombre: true, apellido: true, email: true },
  });
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const rows = pageSlice.map((g) => {
    const cliente = clientePorId.get(g.clienteId);
    return {
      clienteId: g.clienteId,
      nombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : "(cliente eliminado)",
      email: cliente?.email ?? "-",
      cantidadCompras: g._count._all,
      totalGastado: Number(g._sum.total ?? 0),
    };
  });

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// Los contadores/resumen usan aggregate/count (SQL) para no traer los 10k+
// productos a memoria; solo la página solicitada del detalle se consulta con findMany.
async function reporteInventario(page: number, pageSize: number, soloStockBajo: boolean, buscar: string) {
  const whereBase = {
    estado: "ACTIVO" as const,
    ...(soloStockBajo ? { stock: { lte: UMBRAL_STOCK_BAJO } } : {}),
    ...(buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: "insensitive" as const } },
            { marca: { contains: buscar, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalProductosActivos, sinStock, bajoStock, agregadoValor, total, productos] = await Promise.all([
    prisma.producto.count({ where: { estado: "ACTIVO" } }),
    prisma.producto.count({ where: { estado: "ACTIVO", stock: 0 } }),
    prisma.producto.count({ where: { estado: "ACTIVO", stock: { lte: UMBRAL_STOCK_BAJO } } }),
    prisma.$queryRaw<
      [{ valor: number | null }]
    >`SELECT SUM(stock * precio)::float AS valor FROM "Producto" WHERE estado = 'ACTIVO'`,
    prisma.producto.count({ where: whereBase }),
    prisma.producto.findMany({
      where: whereBase,
      select: {
        id: true,
        nombre: true,
        marca: true,
        stock: true,
        precio: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { stock: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    totalProductosActivos,
    sinStock,
    bajoStock,
    valorInventario: agregadoValor[0]?.valor ?? 0,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    detalle: productos.map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria.nombre,
      stock: p.stock,
      precio: Number(p.precio),
      valorLinea: p.stock * Number(p.precio),
    })),
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || "ventas";
  const { desde, hasta } = parseRange(searchParams);
  const { page, pageSize } = parsePagination(searchParams);

  try {
    switch (tipo) {
      case "ventas":
        return NextResponse.json({ tipo, desde, hasta, data: await reporteVentas(desde, hasta) });
      case "productos-mas-vendidos":
        return NextResponse.json({
          tipo,
          desde,
          hasta,
          data: await reporteProductosMasVendidos(desde, hasta, page, pageSize),
        });
      case "clientes-top":
        return NextResponse.json({
          tipo,
          desde,
          hasta,
          data: await reporteClientesTop(desde, hasta, page, pageSize),
        });
      case "inventario": {
        const soloStockBajo = searchParams.get("soloStockBajo") === "1";
        const buscar = searchParams.get("buscar") || "";
        return NextResponse.json({
          tipo,
          data: await reporteInventario(page, pageSize, soloStockBajo, buscar),
        });
      }
      default:
        return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error generando reporte:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
