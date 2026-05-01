import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const imagen = await prisma.productoImagen.findUnique({ where: { id } });
  if (!imagen) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filepath = join(process.cwd(), "public", imagen.path);
    await unlink(filepath);
  } catch {
    // File may not exist on disk, continue anyway
  }

  await prisma.productoImagen.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
