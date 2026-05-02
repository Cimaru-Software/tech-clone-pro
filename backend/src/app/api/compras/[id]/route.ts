import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { EstadoCompra } from "@prisma/client";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const estado = body.estado as EstadoCompra;

  if (!["APROBADO", "RECHAZADO"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    const compra = await prisma.compra.findUnique({
      where: { id },
      include: { items: true, pedido: true },
    });
    if (!compra) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    if (compra.estado !== "PENDIENTE") {
      return NextResponse.json({ error: "Esta compra ya fue validada" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.compra.update({
        where: { id },
        data: {
          estado,
          motivoRechazo: estado === "RECHAZADO" ? String(body.motivoRechazo || "Comprobante rechazado") : null,
        },
      });

      if (estado === "RECHAZADO") return { compra: updated, pedido: null };

      const pedido = await tx.pedido.create({
        data: {
          clienteId: compra.clienteId,
          compraId: compra.id,
          total: compra.total,
          estado: "PENDIENTE",
          metodoPago: compra.metodoPago,
          direccion: compra.direccion,
          ciudad: compra.ciudad,
          provincia: compra.provincia,
          notas: compra.notas,
          items: {
            create: compra.items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precio: item.precio,
            })),
          },
        },
      });

      return { compra: updated, pedido };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al validar la compra" }, { status: 500 });
  }
}
