import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const categorias = await prisma.categoria.findMany({
    where: { orden: { gt: 0 } },
    orderBy: { orden: "asc" },
    include: {
      subcategorias: {
        orderBy: { orden: "asc" },
        include: { subsubcategorias: { orderBy: { orden: "asc" } } },
      },
    },
  });
  return NextResponse.json({ categorias });
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
  });

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const categoria = await prisma.categoria.create({ data, include: { subcategorias: true } });
    return NextResponse.json({ categoria }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
