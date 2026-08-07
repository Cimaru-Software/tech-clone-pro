import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExistenciasBodegaEcommerce } from "@/lib/contifico";

// Consulta stock en tiempo real desde Contífico para un producto por ID local
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const producto = await prisma.producto.findUnique({
    where: { id: params.id },
    select: { id: true, contificoId: true, stock: true },
  });

  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  if (!producto.contificoId) {
    // Producto sin vínculo a Contífico: devolvemos stock local
    return NextResponse.json({ stock: producto.stock, bodegas: [], fuente: "local" });
  }

  try {
    const existencias = await getExistenciasBodegaEcommerce();
    const total = Math.max(0, existencias.get(producto.contificoId) ?? 0);

    // Actualizar stock en BD local para mantenerlo fresco
    await prisma.producto.update({
      where: { id: params.id },
      data: { stock: total, lastSyncedAt: new Date() },
    });

    return NextResponse.json({ stock: total, bodegas: [], fuente: "contifico_bodega_ecommerce" });
  } catch (err) {
    // Si Contífico falla devolvemos el stock local como fallback
    return NextResponse.json(
      { stock: producto.stock, bodegas: [], fuente: "local_fallback", error: String(err) },
      { status: 200 }
    );
  }
}
