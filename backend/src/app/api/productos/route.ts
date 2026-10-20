import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const subcategoria = searchParams.get("subcategoria");
  const subsubcategoria = searchParams.get("subsubcategoria");
  const estado = searchParams.get("estado");
  const search = searchParams.get("search") || searchParams.get("q");
  const destacado = searchParams.get("destacado");
  const conDescuento = searchParams.get("conDescuento");

  const todos = searchParams.get("todos");

  const productos = await prisma.producto.findMany({
    where: {
      ...(categoria && { categoria: { slug: categoria } }),
      ...(subcategoria && { subcategoria: { slug: subcategoria } }),
      ...(subsubcategoria && { subsubcategoria: { slug: subsubcategoria } }),
      // Si se pasa ?todos=1 (admin) no filtra por estado. Si se pasa ?estado=X filtra por ese valor. Si no, filtra ACTIVO por defecto.
      ...(todos === "1" ? {} : estado ? { estado: estado as "ACTIVO" | "INACTIVO" } : { estado: "ACTIVO" }),
      ...(destacado === "true" && { destacado: true }),
      ...(destacado === "false" && { destacado: false }),
      ...(conDescuento === "true" && { descuento: { gt: 0 } }),
      ...(search && {
        AND: search
          .trim()
          .split(/\s+/)
          .map((word) => ({
            OR: [
              { nombre: { contains: word, mode: "insensitive" as const } },
              { marca: { contains: word, mode: "insensitive" as const } },
              { descripcion: { contains: word, mode: "insensitive" as const } },
            ],
          })),
      }),
    },
    include: {
      categoria: true,
      subcategoria: true,
      subsubcategoria: true,
      imagenes: { orderBy: { orden: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ productos });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const productoSchema = z.object({
    nombre: z.string().min(1),
    marca: z.string().min(1),
    categoriaId: z.string().min(1),
    subcategoriaId: z.string().optional().nullable(),
    subsubcategoriaId: z.string().optional().nullable(),
    descripcion: z.string().min(1),
    precio: z.number().positive(),
    descuento: z.number().min(0).max(100).default(0),
    precioTransferencia: z.number().positive().nullable().optional(),
    destacado: z.boolean().default(false),
    stock: z.number().int().min(0).default(0),
    estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
  });

  try {
    const body = await request.json();
    const data = productoSchema.parse(body);

    const producto = await prisma.producto.create({
      data,
      include: { categoria: true, subcategoria: true, subsubcategoria: true, imagenes: true },
    });

    return NextResponse.json({ producto }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
