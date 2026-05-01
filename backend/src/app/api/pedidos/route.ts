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
  notas: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get("admin_token")?.value;
  const clienteToken = request.cookies.get("cliente_token")?.value;

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

  if (clienteToken) {
    const payload = await verifyClientToken(clienteToken);
    if (payload && typeof payload.id === "string") {
      const pedidos = await prisma.pedido.findMany({
        where: { clienteId: payload.id },
        include: { items: { include: { producto: { include: { imagenes: { take: 1 } } } } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ pedidos });
    }
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
    const total = data.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: payload.id,
        total,
        metodoPago: data.metodoPago,
        direccion: data.direccion,
        ciudad: data.ciudad,
        notas: data.notas,
        items: {
          create: data.items.map((item) => ({
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
