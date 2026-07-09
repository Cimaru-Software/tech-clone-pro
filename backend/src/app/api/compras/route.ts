import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, verifyClientToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getPublicDir } from "@/lib/paths";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  purchasePendingAdminEmail,
  purchasePendingCustomerEmail,
  cardPurchaseConfirmedCustomerEmail,
  cardPurchaseConfirmedAdminEmail,
  sendMailSafe,
} from "@/lib/email";
import { emitirFacturaContifico } from "@/lib/contifico-facturacion";

const itemSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().int().positive(),
  precio: z.number().positive(),
});

const facturaSchema = z.object({
  tipoIdentificacion: z.enum(["cedula", "ruc", "pasaporte"]),
  identificacion: z.string().trim().min(4),
  razonSocial: z.string().trim().min(1),
  email: z.string().trim().email(),
  telefono: z.string().trim().min(7),
  direccion: z.string().trim().min(1),
}).superRefine((data, ctx) => {
  if (data.tipoIdentificacion === "cedula" && data.identificacion.length !== 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identificacion"], message: "La cédula debe tener 10 dígitos" });
  }
  if (data.tipoIdentificacion === "ruc" && data.identificacion.length !== 13) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identificacion"], message: "El RUC debe tener 13 dígitos" });
  }
});

function getPrecioFinal(precio: unknown, descuento: number) {
  const base = Number(precio);
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(descuento) || descuento <= 0) return base;
  return Number((base * (1 - Math.min(descuento, 100) / 100)).toFixed(2));
}

async function getTotal(subtotal: number, provincia: string) {
  const [ivaConfig, envioConfig] = await Promise.all([
    prisma.configuracionIva.findFirst(),
    prisma.envioProvincia.findUnique({ where: { provincia } }),
  ]);
  const ivaPorcentaje = ivaConfig?.porcentaje ?? 15;
  const envio = envioConfig?.costo ?? 8;
  const iva = subtotal * (ivaPorcentaje / 100);
  return Number((subtotal + envio + iva).toFixed(2));
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const compras = await prisma.compra.findMany({
    include: {
      cliente: { select: { nombre: true, apellido: true, email: true } },
      pedido: { select: { id: true, estado: true } },
      items: { include: { producto: { include: { imagenes: { take: 1 } } } } },
      facturaContifico: { select: { contificoDocId: true, contificoSecuencial: true, estado: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ compras });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("cliente_token")?.value;
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión para comprar" }, { status: 401 });

  const payload = await verifyClientToken(token);
  if (!payload || typeof payload.id !== "string") {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  try {
    let metodoPago: string;
    let direccion: string;
    let ciudad: string;
    let provincia: string;
    let notas: string;
    let items: z.infer<typeof itemSchema>[];
    let factura: z.infer<typeof facturaSchema>;
    let comprobante: File | null = null;
    let pluxTransaccion: string | null = null;
    let pluxToken: string | null = null;

    if (isJson) {
      const body = await request.json();
      metodoPago = String(body.metodoPago || "");
      direccion = String(body.direccion || "").trim();
      ciudad = String(body.ciudad || "").trim();
      provincia = String(body.provincia || "").trim();
      notas = String(body.notas || "").trim();
      items = itemSchema.array().parse(body.items);
      factura = facturaSchema.parse(body.factura || {});
      pluxTransaccion = body.pluxTransaccion ? String(body.pluxTransaccion) : null;
      pluxToken = body.pluxToken ? String(body.pluxToken) : null;
    } else {
      const formData = await request.formData();
      metodoPago = String(formData.get("metodoPago") || "");
      direccion = String(formData.get("direccion") || "").trim();
      ciudad = String(formData.get("ciudad") || "").trim();
      provincia = String(formData.get("provincia") || "").trim();
      notas = String(formData.get("notas") || "").trim();
      items = itemSchema.array().parse(JSON.parse(String(formData.get("items") || "[]")));
      factura = facturaSchema.parse({
        tipoIdentificacion: String(formData.get("facturaTipoIdentificacion") || ""),
        identificacion: String(formData.get("facturaIdentificacion") || ""),
        razonSocial: String(formData.get("facturaRazonSocial") || ""),
        email: String(formData.get("facturaEmail") || ""),
        telefono: String(formData.get("facturaTelefono") || ""),
        direccion: String(formData.get("facturaDireccion") || ""),
      });
      const comprobanteField = formData.get("comprobante");
      comprobante = comprobanteField instanceof File ? comprobanteField : null;
    }

    if (!["transfer", "card"].includes(metodoPago)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }
    if (!direccion || !ciudad || !provincia || !notas) {
      return NextResponse.json({ error: "Completa los datos de envío" }, { status: 400 });
    }

    if (metodoPago === "transfer") {
      if (!comprobante || comprobante.size === 0) {
        return NextResponse.json({ error: "Debes cargar el comprobante de pago" }, { status: 400 });
      }
      if (!comprobante.type.startsWith("image/")) {
        return NextResponse.json({ error: "El comprobante debe ser una imagen" }, { status: 400 });
      }
    }

    if (metodoPago === "card") {
      if (!pluxTransaccion || !pluxToken) {
        return NextResponse.json({ error: "Datos de transacción incompletos" }, { status: 400 });
      }
    }

    const productos = await prisma.producto.findMany({
      where: { id: { in: items.map((item) => item.productoId) } },
      select: { id: true, precio: true, descuento: true },
    });
    const precios = new Map(productos.map((producto) => [
      producto.id,
      getPrecioFinal(producto.precio, producto.descuento),
    ]));

    const itemsConPrecio = items.map((item) => {
      const precio = precios.get(item.productoId);
      if (!precio) throw new Error("Producto inválido");
      return { ...item, precio };
    });

    let comprobantePath: string | null = null;
    if (metodoPago === "transfer" && comprobante) {
      const dir = join(getPublicDir(), "images", "comprobantes");
      await mkdir(dir, { recursive: true });
      const ext = comprobante.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      await writeFile(join(dir, filename), Buffer.from(await comprobante.arrayBuffer()));
      comprobantePath = `/images/comprobantes/${filename}`;
    }

    const subtotal = itemsConPrecio.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const total = await getTotal(subtotal, provincia);

    // Para pago con tarjeta: compra APROBADO + pedido PENDIENTE creado automáticamente
    // Para transferencia: compra PENDIENTE, sin pedido (admin valida el comprobante)
    const compra = await prisma.compra.create({
      data: {
        clienteId: payload.id,
        total,
        metodoPago,
        direccion,
        ciudad,
        provincia,
        notas,
        estado: metodoPago === "card" ? "APROBADO" : "PENDIENTE",
        ...(comprobantePath ? { comprobantePath } : {}),
        ...(pluxTransaccion ? { pluxTransaccion } : {}),
        ...(pluxToken ? { pluxToken } : {}),
        facturaTipoIdentificacion: factura.tipoIdentificacion,
        facturaIdentificacion: factura.identificacion,
        facturaRazonSocial: factura.razonSocial,
        facturaEmail: factura.email,
        facturaTelefono: factura.telefono,
        facturaDireccion: factura.direccion,
        items: {
          create: itemsConPrecio.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        },
      },
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
        items: { include: { producto: true } },
      },
    });

    if (metodoPago === "card") {
      // Crear pedido directamente en estado PENDIENTE
      const pedido = await prisma.pedido.create({
        data: {
          clienteId: payload.id,
          compraId: compra.id,
          estado: "PENDIENTE",
          metodoPago: "card",
          total,
          direccion,
          ciudad,
          provincia,
          notas,
          items: {
            create: itemsConPrecio.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precio: item.precio,
            })),
          },
        },
      });

      await Promise.all([
        sendMailSafe(cardPurchaseConfirmedCustomerEmail({
          pedidoId: pedido.id,
          compraId: compra.id,
          cliente: compra.cliente,
          total: compra.total,
          items: compra.items,
        })),
        sendMailSafe(cardPurchaseConfirmedAdminEmail({
          pedidoId: pedido.id,
          compraId: compra.id,
          cliente: compra.cliente,
          total: compra.total,
        })),
      ]);

      const facturaContifico = await emitirFacturaContifico(compra.id).catch((err) => ({
        estado: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
      return NextResponse.json({ compra, facturaContifico }, { status: 201 });
    } else {
      // Transferencia: notificar al admin y al cliente que está pendiente de validación
      await Promise.all([
        sendMailSafe(purchasePendingAdminEmail({
          compraId: compra.id,
          cliente: compra.cliente,
          total: compra.total,
          comprobantePath: comprobantePath ?? undefined,
        })),
        sendMailSafe(purchasePendingCustomerEmail({
          compraId: compra.id,
          cliente: compra.cliente,
          total: compra.total,
          items: compra.items,
        })),
      ]);
    }

    return NextResponse.json({ compra }, { status: 201 });
  } catch (error) {
    console.error("[compras POST]", error);
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Datos inválidos", details: error instanceof z.ZodError ? error.errors : undefined }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Producto inválido") {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }
    return NextResponse.json({
      error: process.env.NODE_ENV === "production" ? "Error interno" : error instanceof Error ? error.message : "Error interno",
    }, { status: 500 });
  }
}
