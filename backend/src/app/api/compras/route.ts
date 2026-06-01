import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, verifyClientToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { purchasePendingAdminEmail, purchasePendingCustomerEmail, sendMailSafe } from "@/lib/email";

const itemSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().int().positive(),
  precio: z.number().positive(),
});

function getPrecioFinal(precio: unknown, descuento: number) {
  const base = Number(precio);
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(descuento) || descuento <= 0) return base;
  return Number((base * (1 - Math.min(descuento, 100) / 100)).toFixed(2));
}

function getTotal(subtotal: number) {
  const envio = subtotal > 500 ? 0 : 8;
  const iva = subtotal * 0.15;
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
      const dir = join(process.cwd(), "public", "images", "comprobantes");
      await mkdir(dir, { recursive: true });
      const ext = comprobante.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      await writeFile(join(dir, filename), Buffer.from(await comprobante.arrayBuffer()));
      comprobantePath = `/images/comprobantes/${filename}`;
    }

    const subtotal = itemsConPrecio.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const total = getTotal(subtotal);

    const compra = await prisma.compra.create({
      data: {
        clienteId: payload.id,
        total,
        metodoPago,
        direccion,
        ciudad,
        provincia,
        notas,
        ...(comprobantePath ? { comprobantePath } : {}),
        ...(pluxTransaccion ? { pluxTransaccion } : {}),
        ...(pluxToken ? { pluxToken } : {}),
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

    return NextResponse.json({ compra }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Producto inválido") {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
