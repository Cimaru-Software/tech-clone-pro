import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { EstadoCompra } from "@prisma/client";
import { receiptApprovedEmail, receiptRejectedEmail, sendMailSafe } from "@/lib/email";
import { buildDocumentoFromPedido, crearDocumento } from "@/lib/contifico";

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

    if (estado === "APROBADO") {
      // Emitir factura en Contífico (no bloqueante: si falla, la compra ya fue aprobada)
      emitirFacturaContifico(compra).catch(() => {});

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

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al validar la compra" }, { status: 500 });
  }
}

async function emitirFacturaContifico(compra: {
  id: string;
  items: Array<{ productoId: string; cantidad: number; precio: { toString(): string } }>;
  createdAt: Date;
}) {
  const personaId = process.env.CONTIFICO_PERSONA_ID;
  if (!personaId) return; // Si no está configurado, no intentamos emitir

  // Obtener contificoId de cada producto
  const productosDb = await prisma.producto.findMany({
    where: { id: { in: compra.items.map((i) => i.productoId) } },
    select: { id: true, contificoId: true, ivaContificoPorc: true },
  });

  const itemsMapeados = compra.items.flatMap((item) => {
    const prod = productosDb.find((p) => p.id === item.productoId);
    if (!prod?.contificoId) return []; // producto sin vínculo a Contífico, lo omitimos
    return [
      {
        contificoId: prod.contificoId,
        cantidad: item.cantidad,
        precio: parseFloat(item.precio.toString()),
        ivaPorc: parseFloat(prod.ivaContificoPorc ?? "12"),
      },
    ];
  });

  if (itemsMapeados.length === 0) return;

  const fecha = compra.createdAt.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const doc = buildDocumentoFromPedido({
    fecha,
    personaId,
    descripcion: `Pedido e-commerce #${compra.id}`,
    items: itemsMapeados,
  });

  try {
    const resp = await crearDocumento(doc);
    await prisma.contificoFactura.create({
      data: {
        compraId: compra.id,
        contificoDocId: resp.id,
        contificoSecuencial: resp.secuencial ?? null,
        estado: "emitida",
      },
    });
    await prisma.contificoSyncLog.create({
      data: {
        tipo: "factura",
        estado: "ok",
        mensaje: `Factura emitida: ${resp.id}`,
        compraId: compra.id,
      },
    });
  } catch (err) {
    await prisma.contificoSyncLog.create({
      data: {
        tipo: "factura",
        estado: "error",
        mensaje: String(err),
        compraId: compra.id,
      },
    });
  }
}
