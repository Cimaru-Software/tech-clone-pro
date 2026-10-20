import type { Compra, Prisma } from "@prisma/client";
import { buildDocumentoFromPedido, crearDocumento, crearMovimientoEgreso, resolveBodegaEcommerceId } from "@/lib/contifico";
import type { ContificoCliente } from "@/lib/contifico";
import { prisma } from "@/lib/prisma";

type CompraFacturable = Compra & {
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  };
  items: Array<{
    id: string;
    productoId: string;
    cantidad: number;
    precio: Prisma.Decimal;
    producto: {
      nombre: string;
      contificoId: string | null;
      ivaContificoPorc: string | null;
    };
    seriales: Array<{ serial: string }>;
  }>;
};

function toNumber(value: Prisma.Decimal | number | string) {
  return Number(value.toString());
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function todayEc() {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date());
}

function buildNumeroDocumento(compraId: string) {
  const establecimiento = (process.env.CONTIFICO_BILLING_ESTABLECIMIENTO || "001").padStart(3, "0").slice(-3);
  const puntoEmision = (process.env.CONTIFICO_BILLING_PUNTO_EMISION || "002").padStart(3, "0").slice(-3);
  const numeric = compraId
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), Date.now());
  const secuencial = String(numeric % 1_000_000_000).padStart(9, "0");
  return `${establecimiento}-${puntoEmision}-${secuencial}`;
}

function buildAutorizacion(compraId: string) {
  const numeric = compraId
    .split("")
    .map((char) => char.charCodeAt(0) % 10)
    .join("");
  return `${Date.now()}${numeric}`.slice(0, 49).padEnd(10, "0");
}

function buildCliente(compra: CompraFacturable): ContificoCliente {
  if (
    !compra.facturaTipoIdentificacion ||
    !compra.facturaIdentificacion ||
    !compra.facturaRazonSocial ||
    !compra.facturaEmail ||
    !compra.facturaTelefono ||
    !compra.facturaDireccion
  ) {
    throw new Error("Compra sin datos completos de facturación");
  }

  const identificacion = compra.facturaIdentificacion.trim();
  const tipoIdentificacion = compra.facturaTipoIdentificacion;
  const tipo: ContificoCliente["tipo"] =
    tipoIdentificacion === "ruc" ? "J" : tipoIdentificacion === "pasaporte" ? "P" : "N";

  return {
    ruc: tipoIdentificacion === "ruc" ? identificacion : "",
    cedula: tipoIdentificacion !== "ruc" ? identificacion : "",
    razon_social: compra.facturaRazonSocial.trim(),
    telefonos: compra.facturaTelefono.trim(),
    direccion: compra.facturaDireccion.trim(),
    tipo,
    email: compra.facturaEmail.trim(),
    es_extranjero: tipoIdentificacion === "pasaporte",
  };
}

function buildItems(compra: CompraFacturable) {
  const fallbackProductId = process.env.CONTIFICO_BILLING_FALLBACK_PRODUCT_ID;
  const fallbackIvaPorc = Number(process.env.CONTIFICO_BILLING_FALLBACK_IVA_PORC || "15");
  const totalCompra = toNumber(compra.total);

  if (fallbackProductId) {
    const base = money(totalCompra / (1 + fallbackIvaPorc / 100));
    return [{
      contificoId: fallbackProductId,
      cantidad: 1,
      precio: base,
      ivaPorc: fallbackIvaPorc,
    }];
  }

  const items: Array<{ contificoId: string; cantidad: number; precio: number; ivaPorc: number; serie?: string }> = compra.items.map((item) => {
    if (!item.producto.contificoId) {
      throw new Error(`Producto ${item.productoId} no tiene contificoId sincronizado`);
    }

    const serie = item.seriales.length > 0 ? item.seriales[0].serial : undefined;
    const ivaPorc = Number(item.producto.ivaContificoPorc || "15");

    // El precio guardado ya incluye IVA; Contífico espera el precio unitario sin IVA.
    return {
      contificoId: item.producto.contificoId,
      cantidad: item.cantidad,
      precio: Math.round((toNumber(item.precio) / (1 + ivaPorc / 100)) * 1e6) / 1e6,
      ivaPorc,
      serie,
    };
  });

  const totalItems = items.reduce((sum, item) => {
    const base = item.precio * item.cantidad;
    return sum + base + (base * item.ivaPorc) / 100;
  }, 0);
  const diferencia = money(totalCompra - totalItems);

  if (diferencia > 0.01) {
    const shippingProductId = process.env.CONTIFICO_BILLING_SHIPPING_PRODUCT_ID;
    if (!shippingProductId) {
      throw new Error("CONTIFICO_BILLING_SHIPPING_PRODUCT_ID no configurado para facturar envío/ajustes");
    }

    const shippingIvaPorc = Number(process.env.CONTIFICO_BILLING_SHIPPING_IVA_PORC || "15");
    items.push({
      contificoId: shippingProductId,
      cantidad: 1,
      precio: money(diferencia / (1 + shippingIvaPorc / 100)),
      ivaPorc: shippingIvaPorc,
    });
  }

  return items;
}

async function logContifico(compraId: string, estado: "ok" | "error", mensaje: string, detalle?: string) {
  await prisma.contificoSyncLog.create({
    data: {
      tipo: "factura",
      estado,
      mensaje,
      detalle,
      compraId,
    },
  });
}

export async function emitirFacturaContifico(compraId: string) {
  const existing = await prisma.contificoFactura.findUnique({ where: { compraId } });
  if (existing) return existing;

  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: {
      cliente: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      items: {
        include: {
          producto: { select: { nombre: true, contificoId: true, ivaContificoPorc: true } },
          seriales: { select: { serial: true } },
        },
      },
    },
  });

  if (!compra) throw new Error("Compra no encontrada para facturación");
  if (!["card", "transfer"].includes(compra.metodoPago)) {
    throw new Error(`Método de pago no facturable: ${compra.metodoPago}`);
  }

  const items = buildItems(compra);

  try {
    const doc = buildDocumentoFromPedido({
      fechaEmision: todayEc(),
      documento: buildNumeroDocumento(compra.id),
      autorizacion: buildAutorizacion(compra.id),
      descripcion: `Compra e-commerce #${compra.id} | BODEGA: BODEGA ECOMMERCE`,
      cliente: buildCliente(compra),
      items,
    });

    const resp = await crearDocumento(doc);
    const factura = await prisma.contificoFactura.create({
      data: {
        compraId: compra.id,
        contificoDocId: resp.id,
        contificoSecuencial: resp.secuencial ?? null,
        estado: "emitida",
      },
    });

    await logContifico(compra.id, "ok", `Factura emitida: ${resp.id}`);
    await descontarStockBodegaEcommerce(compra.id, items);
    return factura;
  } catch (err) {
    await logContifico(compra.id, "error", "Error al emitir factura", String(err));
    throw err;
  }
}

// Crea un movimiento EGR en Contífico para descontar de BODEGA ECOMMERCE el
// stock de los productos vendidos. La factura ya fue emitida en este punto;
// un fallo aquí no debe revertir la factura, solo queda registrado en el log
// para revisión manual (el stock local ya se descuenta por separado al aprobar la compra).
async function descontarStockBodegaEcommerce(
  compraId: string,
  items: Array<{ contificoId: string; cantidad: number; serie?: string }>
) {
  try {
    const bodegaId = await resolveBodegaEcommerceId();
    await crearMovimientoEgreso({
      bodega_id: bodegaId,
      fecha: todayEc(),
      descripcion: `Venta e-commerce #${compraId}`,
      detalles: items.map((item) => ({
        producto_id: item.contificoId,
        cantidad: item.cantidad,
        ...(item.serie ? { serie: item.serie } : {}),
      })),
    });
    await logContifico(compraId, "ok", "Movimiento EGR de inventario creado en BODEGA ECOMMERCE");
  } catch (err) {
    await logContifico(compraId, "error", "Error al crear movimiento EGR de inventario", String(err));
  }
}
