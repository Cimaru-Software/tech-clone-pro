import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, verifyClientToken } from "@/lib/auth";
import { orderDeliveredEmail, sendMailSafe } from "@/lib/email";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminToken = request.cookies.get("admin_token")?.value;
  const clienteToken = request.cookies.get("cliente_token")?.value;
  const { id } = await params;

  if (adminToken && await verifyAdminToken(adminToken)) {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { cliente: true, items: { include: { producto: { include: { imagenes: { take: 1 } } } } } },
    });
    if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    return NextResponse.json({ pedido });
  }

  if (clienteToken) {
    const payload = await verifyClientToken(clienteToken);
    if (payload && typeof payload.id === "string") {
      const pedido = await prisma.pedido.findFirst({
        where: { id, clienteId: payload.id },
        include: { items: { include: { producto: { include: { imagenes: { take: 1 } } } } } },
      });
      if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      return NextResponse.json({ pedido });
    }
  }

  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  if (!["PENDIENTE", "ENTREGADO"].includes(body.estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  try {
    const current = await prisma.pedido.findUnique({
      where: { id },
      select: { estado: true },
    });

    const pedido = await prisma.pedido.update({
      where: { id },
      data: { estado: body.estado },
      include: { cliente: true },
    });

    if (current?.estado !== "ENTREGADO" && pedido.estado === "ENTREGADO") {
      await sendMailSafe(orderDeliveredEmail({
        pedidoId: pedido.id,
        cliente: pedido.cliente,
        total: pedido.total,
      }));
    }

    return NextResponse.json({ pedido });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
