import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const schema = z.object({
    nombre: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    orden: z.number().int().optional(),
    categoriaId: z.string().min(1).optional(),
  });

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const subcategoria = await prisma.subcategoria.update({
      where: { id: params.id },
      data,
      include: { categoria: true },
    });
    return NextResponse.json({ subcategoria });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.subcategoria.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
