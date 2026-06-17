import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

const productoUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  categoriaId: z.string().min(1).optional(),
  subcategoriaId: z.string().optional().nullable(),
  subsubcategoriaId: z.string().optional().nullable(),
  descripcion: z.string().min(1).optional(),
  precio: z.number().positive().optional(),
  descuento: z.number().min(0).max(100).optional(),
  destacado: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { categoria: true, subcategoria: true, subsubcategoria: true, imagenes: { orderBy: { orden: "asc" } } },
  });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ producto });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  try {
    const data = productoUpdateSchema.parse(body);
    const producto = await prisma.producto.update({
      where: { id },
      data,
      include: { categoria: true, subcategoria: true, subsubcategoria: true, imagenes: true },
    });
    return NextResponse.json({ producto });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.producto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
