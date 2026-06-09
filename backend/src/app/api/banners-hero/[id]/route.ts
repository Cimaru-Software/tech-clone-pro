import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { getPublicDir } from "@/lib/paths";
import { v4 as uuidv4 } from "uuid";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

async function deleteBannerFile(path: string) {
  try {
    await unlink(join(getPublicDir(), path));
  } catch {
    // El archivo pudo haberse eliminado manualmente; la base de datos sigue siendo la fuente de verdad.
  }
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
    const current = await prisma.bannerHero.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Banner no encontrado" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const activo = formData.get("activo");
    const orden = formData.get("orden");

    let path = current.path;
    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
      }

      const dir = join(getPublicDir(), "images", "banners-hero");
      await mkdir(dir, { recursive: true });
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      const filepath = join(dir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      await deleteBannerFile(current.path);
      path = `/images/banners-hero/${filename}`;
    }

    const banner = await prisma.bannerHero.update({
      where: { id },
      data: {
        path,
        ...(activo !== null && { activo: activo === "true" }),
        ...(orden !== null && { orden: Number(orden) || 0 }),
      },
    });

    return NextResponse.json({ banner });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el banner" }, { status: 500 });
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
    const banner = await prisma.bannerHero.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: "Banner no encontrado" }, { status: 404 });
    }

    await deleteBannerFile(banner.path);
    await prisma.bannerHero.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el banner" }, { status: 500 });
  }
}
