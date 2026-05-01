import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const estado = searchParams.get("estado");
  const search = searchParams.get("search");

  const productos = await prisma.producto.findMany({
    where: {
      ...(categoria && { categoria: { slug: categoria } }),
      ...(estado && estado !== "" && { estado: estado as "ACTIVO" | "INACTIVO" }),
      ...(!estado && estado !== "" && { estado: "ACTIVO" }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { marca: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      categoria: true,
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
    descripcion: z.string().min(1),
    precio: z.number().positive(),
    descuento: z.number().min(0).max(100).default(0),
    stock: z.number().int().min(0).default(0),
    estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
  });

  try {
    const body = await request.json();
    const data = productoSchema.parse(body);

    const producto = await prisma.producto.create({
      data,
      include: { categoria: true, imagenes: true },
    });

    return NextResponse.json({ producto }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
