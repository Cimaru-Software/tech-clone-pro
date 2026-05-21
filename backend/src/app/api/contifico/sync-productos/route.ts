import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { getProductos, getStock } from "@/lib/contifico";

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
        // cantidad_stock ya viene filtrado por Bodega Ecommerce desde getProductos()
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

    await prisma.contificoSyncLog.create({
      data: {
        tipo: "productos",
        estado: errores === 0 ? "ok" : "parcial",
        mensaje: `Sincronizados: ${sincronizados}, Errores: ${errores}`,
        detalle: detalles.length ? detalles.join("\n") : null,
      },
    });

    return NextResponse.json({ sincronizados, errores, detalles });
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
