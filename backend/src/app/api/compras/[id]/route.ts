import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { EstadoCompra } from "@prisma/client";
import { receiptApprovedEmail, receiptRejectedEmail, sendMailSafe } from "@/lib/email";
import { emitirFacturaContifico } from "@/lib/contifico-facturacion";

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
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
        items: true,
        pedido: true,
      },
    });
    if (!compra) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    if (compra.estado !== "PENDIENTE") {
      return NextResponse.json({ error: "Esta compra ya fue validada" }, { status: 400 });
    }

    const motivoRechazo = String(body.motivoRechazo || "Comprobante rechazado");
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.compra.update({
        where: { id },
        data: {
          estado,
          motivoRechazo: estado === "RECHAZADO" ? motivoRechazo : null,
        },
      });

      if (estado === "RECHAZADO") return { compra: updated, pedido: null };

      // Asignar seriales disponibles a cada item de la compra
      for (const item of compra.items) {
        const serialesDisponibles = await tx.serialProducto.findMany({
          where: { productoId: item.productoId, estado: "disponible", itemCompraId: null },
          take: item.cantidad,
          orderBy: { createdAt: "asc" },
        });

        if (serialesDisponibles.length > 0) {
          await tx.serialProducto.updateMany({
            where: { id: { in: serialesDisponibles.map((s) => s.id) } },
            data: { estado: "vendido", itemCompraId: item.id },
          });
        }
      }

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

    let facturaContifico: unknown = null;
    if (estado === "APROBADO") {
      facturaContifico = await emitirFacturaContifico(compra.id).catch((err) => ({
        estado: "error",
        error: err instanceof Error ? err.message : String(err),
      }));

      await sendMailSafe(receiptApprovedEmail({
        compraId: compra.id,
        pedidoId: result.pedido?.id,
        cliente: compra.cliente,
        total: compra.total,
      }));
    } else {
      await sendMailSafe(receiptRejectedEmail({
        compraId: compra.id,
        cliente: compra.cliente,
        total: compra.total,
        motivo: motivoRechazo,
      }));
    }

    return NextResponse.json({ ...result, facturaContifico });
  } catch {
    return NextResponse.json({ error: "Error al validar la compra" }, { status: 500 });
  }
}
