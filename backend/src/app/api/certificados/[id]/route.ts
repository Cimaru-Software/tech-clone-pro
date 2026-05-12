import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

async function deleteFile(path: string) {
  try {
    await unlink(join(process.cwd(), "public", path));
  } catch {}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const current = await prisma.certificado.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    const formData = await request.formData();
    const nombre = (formData.get("nombre") as string)?.trim();
    const orden = formData.get("orden");
    const file = formData.get("image") as File | null;

    let path = current.path;
    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
      }
      const dir = join(process.cwd(), "public", "images", "certificados");
      await mkdir(dir, { recursive: true });
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(dir, filename), buffer);
      await deleteFile(current.path);
      path = `/images/certificados/${filename}`;
    }

    const certificado = await prisma.certificado.update({
      where: { id },
      data: {
        path,
        ...(nombre && { nombre }),
        ...(orden !== null && { orden: Number(orden) || 0 }),
      },
    });

    return NextResponse.json({ certificado });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el certificado" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const certificado = await prisma.certificado.findUnique({ where: { id } });
    if (!certificado) return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    await deleteFile(certificado.path);
    await prisma.certificado.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el certificado" }, { status: 500 });
  }
}
