import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { getProductos, getSeriales } from "@/lib/contifico";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let sincronizados = 0;
  let errores = 0;
  const detalles: string[] = [];

  try {
    const productos = await getProductos();

    for (const cp of productos) {
      // Solo productos activos con precio (v2 usa estado "A")
      if (cp.estado !== "A" && cp.estado !== "ACTIVO") continue;

      // v2 usa pvp1, v1 usaba precio_unitario
      const precioStr = cp.pvp1 ?? cp.precio_unitario ?? "0";
      if (!precioStr || precioStr === "0") continue;

      try {
        // getProductos calculó el kardex únicamente de Bodega Ecommerce.
        const stockActual = cp.cantidad_stock ?? 0;

        const precio = parseFloat(precioStr) || 0;
        const ivaPorc = String(cp.porcentaje_iva ?? "15");

        await prisma.producto.upsert({
          where: { contificoId: cp.id },
          update: {
            nombre: cp.nombre,
            descripcion: cp.descripcion || cp.nombre,
            precio,
            stock: stockActual,
            ivaContificoPorc: ivaPorc,
            // actualizar marca si viene en v2
            ...(cp.marca_nombre && cp.marca_nombre !== "-" && { marca: cp.marca_nombre }),
            lastSyncedAt: new Date(),
          },
          create: {
            contificoId: cp.id,
            contificoCode: cp.codigo,
            nombre: cp.nombre,
            marca: cp.marca_nombre || "-",
            descripcion: cp.descripcion || cp.nombre,
            precio,
            stock: stockActual,
            ivaContificoPorc: ivaPorc,
            lastSyncedAt: new Date(),
            categoriaId: await getOrCreateCategoriaDefault(),
            estado: "ACTIVO",
          },
        });

        sincronizados++;
      } catch (err) {
        errores++;
        detalles.push(`Producto ${cp.id} (${cp.nombre}): ${String(err)}`);
      }
    }

    // Sincronizar seriales
    const serialesSync = await sincronizarSeriales();

    await prisma.contificoSyncLog.create({
      data: {
        tipo: "productos",
        estado: errores === 0 ? "ok" : "parcial",
        mensaje: `Sincronizados: ${sincronizados}, Errores: ${errores}, Seriales: ${serialesSync.sincronizados}`,
        detalle: detalles.length ? detalles.join("\n") : null,
      },
    });

    return NextResponse.json({ sincronizados, errores, detalles, seriales: serialesSync });
  } catch (err) {
    await prisma.contificoSyncLog.create({
      data: {
        tipo: "productos",
        estado: "error",
        mensaje: String(err),
      },
    });
    return NextResponse.json(
      { error: "Error al sincronizar productos", detalle: String(err) },
      { status: 500 }
    );
  }
}

async function sincronizarSeriales() {
  const serialesContifico = await getSeriales();
  let nuevos = 0;

  for (const s of serialesContifico) {
    const producto = await prisma.producto.findUnique({
      where: { contificoId: s.productoId },
      select: { id: true },
    });
    if (!producto) continue;

    // Solo crear si no existe — nunca pisar el estado de uno ya asignado a una compra
    const existe = await prisma.serialProducto.findUnique({
      where: { contificoProductoId_serial: { contificoProductoId: s.productoId, serial: s.serial } },
    });
    if (existe) continue;

    await prisma.serialProducto.create({
      data: {
        serial: s.serial,
        contificoProductoId: s.productoId,
        productoId: producto.id,
        estado: "disponible",
      },
    });
    nuevos++;
  }

  return { sincronizados: serialesContifico.length, nuevos };
}

async function getOrCreateCategoriaDefault(): Promise<string> {
  const cat = await prisma.categoria.findFirst({
    orderBy: { orden: "asc" },
  });
  if (cat) return cat.id;

  const nueva = await prisma.categoria.create({
    data: {
      nombre: "General",
      slug: "general",
      orden: 0,
    },
  });
  return nueva.id;
}
