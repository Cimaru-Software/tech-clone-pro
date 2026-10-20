import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientToken, verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

const pedidoSchema = z.object({
  items: z.array(z.object({
    productoId: z.string(),
    cantidad: z.number().int().positive(),
    precio: z.number().positive(),
  })),
  metodoPago: z.string().min(1),
  direccion: z.string().min(1),
  ciudad: z.string().min(1),
  provincia: z.string().optional(),
  notas: z.string().optional(),
});

function getPrecioFinal(precio: unknown, descuento: number) {
  const base = Number(precio);
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(descuento) || descuento <= 0) return base;
  return Number((base * (1 - Math.min(descuento, 100) / 100)).toFixed(2));
}

// Con transferencia se usa el precio de transferencia si existe y es menor al precio normal.
function getPrecioSegunPago(producto: { precio: unknown; descuento: number; precioTransferencia: unknown }, metodoPago: string) {
  const precioNormal = getPrecioFinal(producto.precio, producto.descuento);
  if (metodoPago !== "transfer" || producto.precioTransferencia == null) return precioNormal;
  const transferencia = Number(producto.precioTransferencia);
  if (!Number.isFinite(transferencia) || transferencia <= 0 || transferencia >= precioNormal) return precioNormal;
  return Number(transferencia.toFixed(2));
}

export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get("admin_token")?.value;
  const clienteToken = request.cookies.get("cliente_token")?.value;
  const scope = request.nextUrl.searchParams.get("scope");

  if (scope === "admin" && adminToken && await verifyAdminToken(adminToken)) {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
        items: { include: { producto: { include: { imagenes: { take: 1 } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pedidos });
  }

  if (clienteToken) {
    const payload = await verifyClientToken(clienteToken);
    if (payload && typeof payload.id === "string") {
      const [pedidos, compras] = await Promise.all([
        prisma.pedido.findMany({
          where: { clienteId: payload.id },
          include: { items: { include: { producto: { include: { imagenes: { take: 1 } } } } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.compra.findMany({
          where: { clienteId: payload.id },
          include: {
            pedido: { select: { id: true } },
            items: { include: { producto: { include: { imagenes: { take: 1 } } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const comprasSinPedido = compras
        .filter((compra) => !(compra.estado === "APROBADO" && compra.pedido))
        .map((compra) => ({
          id: compra.id,
          clienteId: compra.clienteId,
          total: compra.total,
          estado: compra.estado === "RECHAZADO"
            ? "COMPROBANTE_RECHAZADO"
            : compra.estado === "APROBADO"
              ? "COMPRA_APROBADA"
              : "PENDIENTE_VALIDACION",
          metodoPago: compra.metodoPago,
          direccion: compra.direccion,
          ciudad: compra.ciudad,
          provincia: compra.provincia,
          notas: compra.notas,
          motivoRechazo: compra.motivoRechazo,
          items: compra.items,
          createdAt: compra.createdAt,
          tipo: "compra",
        }));

      const pedidosConTipo = pedidos.map((pedido) => ({ ...pedido, tipo: "pedido" }));
      const historial = [...pedidosConTipo, ...comprasSinPedido].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ pedidos: historial });
    }
  }

  if (adminToken && await verifyAdminToken(adminToken)) {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
        items: { include: { producto: { include: { imagenes: { take: 1 } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pedidos });
  }

  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("cliente_token")?.value;
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión para comprar" }, { status: 401 });

  const payload = await verifyClientToken(token);
  if (!payload || typeof payload.id !== "string") {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = pedidoSchema.parse(body);
    const productos = await prisma.producto.findMany({
      where: { id: { in: data.items.map((item) => item.productoId) } },
      select: { id: true, precio: true, descuento: true, precioTransferencia: true },
    });
    const precios = new Map(productos.map((producto) => [
      producto.id,
      getPrecioSegunPago(producto, data.metodoPago),
    ]));
    const itemsConPrecio = data.items.map((item) => {
      const precio = precios.get(item.productoId);
      if (!precio) throw new Error("Producto inválido");
      return { ...item, precio };
    });
    const total = itemsConPrecio.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: payload.id,
        total,
        metodoPago: data.metodoPago,
        direccion: data.direccion,
        ciudad: data.ciudad,
        provincia: data.provincia || "",
        notas: data.notas,
        items: {
          create: itemsConPrecio.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        },
      },
      include: { items: { include: { producto: true } } },
    });

    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Producto inválido") {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
