import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { getProductos, getSeriales } from "@/lib/contifico";

const BATCH_SIZE = 10;

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return new Response("No autorizado", { status: 401 });
  }

  const categoriaDefaultId = await getOrCreateCategoriaDefault();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send({ fase: "cargando", mensaje: "Obteniendo catálogo de Contífico..." });

        const todosProductos = await getProductos((traidos, total) => {
          send({
            fase: "cargando",
            mensaje: `Descargando catálogo de Contífico... ${traidos} de ${total}`,
          });
        });
        const activos = todosProductos.filter(
          (p) => p.estado === "A" || p.estado === "ACTIVO"
        );

        send({
          fase: "procesando",
          mensaje: `${activos.length} productos encontrados. Verificando stock en Bodega Ecommerce...`,
          total: activos.length,
          procesados: 0,
          sincronizados: 0,
          omitidos: 0,
          errores: 0,
        });

        let procesados = 0;
        let sincronizados = 0;
        let omitidos = 0;
        let errores = 0;
        const detallesError: string[] = [];

        // Procesar en lotes paralelos
        for (let i = 0; i < activos.length; i += BATCH_SIZE) {
          const lote = activos.slice(i, i + BATCH_SIZE);

          await Promise.all(
            lote.map(async (cp) => {
              try {
                const precioStr = cp.pvp1 ?? cp.precio_unitario ?? "0";
                if (!precioStr || precioStr === "0") {
                  omitidos++;
                  return;
                }

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
                    ...(cp.marca_nombre &&
                      cp.marca_nombre !== "-" && { marca: cp.marca_nombre }),
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
                    categoriaId: categoriaDefaultId,
                    estado: "ACTIVO",
                  },
                });

                sincronizados++;
              } catch (err) {
                errores++;
                detallesError.push(`${cp.nombre}: ${String(err)}`);
              } finally {
                procesados++;
              }
            })
          );

          // Enviar progreso después de cada lote
          send({
            fase: "procesando",
            total: activos.length,
            procesados,
            sincronizados,
            omitidos,
            errores,
            mensaje: `Procesando... ${procesados} de ${activos.length}`,
          });
        }

        // Sincronizar seriales
        send({ fase: "procesando", mensaje: "Sincronizando seriales desde Contífico..." });
        const serialesSync = await sincronizarSeriales();

        // Guardar log
        await prisma.contificoSyncLog.create({
          data: {
            tipo: "productos",
            estado: errores === 0 ? "ok" : "parcial",
            mensaje: `Sincronizados: ${sincronizados}, Omitidos: ${omitidos}, Errores: ${errores}, Seriales: ${serialesSync.sincronizados}`,
            detalle: detallesError.length ? detallesError.join("\n") : null,
          },
        });

        send({
          fase: "completo",
          total: activos.length,
          procesados,
          sincronizados,
          omitidos,
          errores,
          seriales: serialesSync.sincronizados,
          mensaje: `Sincronización completada. ${serialesSync.nuevos} seriales nuevos (${serialesSync.sincronizados} en Contífico).`,
        });
      } catch (err) {
        send({
          fase: "error",
          mensaje: `Error fatal: ${String(err)}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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
  const cat = await prisma.categoria.findFirst({ orderBy: { orden: "asc" } });
  if (cat) return cat.id;
  const nueva = await prisma.categoria.create({
    data: { nombre: "General", slug: "general", orden: 0 },
  });
  return nueva.id;
}
