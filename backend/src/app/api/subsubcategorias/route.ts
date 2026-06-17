import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subcategoriaId = searchParams.get("subcategoriaId");
  const subcategoriaSlug = searchParams.get("subcategoria");

  const subsubcategorias = await prisma.subsubcategoria.findMany({
    where: {
      ...(subcategoriaId && { subcategoriaId }),
      ...(subcategoriaSlug && { subcategoria: { slug: subcategoriaSlug } }),
    },
    orderBy: { orden: "asc" },
    include: { subcategoria: { include: { categoria: true } } },
  });
  return NextResponse.json({ subsubcategorias });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const schema = z.object({
    nombre: z.string().min(1),
    slug: z.string().min(1),
    orden: z.number().int().default(0),
    subcategoriaId: z.string().min(1),
  });

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const subsubcategoria = await prisma.subsubcategoria.create({
      data,
      include: { subcategoria: { include: { categoria: true } } },
    });
    return NextResponse.json({ subsubcategoria }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
