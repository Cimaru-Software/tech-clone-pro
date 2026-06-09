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

async function deleteFile(path: string) {
  try { await unlink(join(getPublicDir(), path)); } catch {}
}

export async function GET() {
  try {
    const banner = await prisma.bannerPromocion.findFirst();
    return NextResponse.json({ banner });
  } catch (e) {
    console.error("[banner-promocion GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el banner" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Debes subir una imagen válida" }, { status: 400 });
    }

    const dir = join(getPublicDir(), "images", "banner-promocion");
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    // Solo existe 1 banner — reemplaza el anterior si existe
    const existing = await prisma.bannerPromocion.findFirst();
    if (existing) {
      await deleteFile(existing.path);
      const banner = await prisma.bannerPromocion.update({
        where: { id: existing.id },
        data: { path: `/images/banner-promocion/${filename}` },
      });
      return NextResponse.json({ banner });
    }

    const banner = await prisma.bannerPromocion.create({
      data: { path: `/images/banner-promocion/${filename}` },
    });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (e) {
    console.error("[banner-promocion POST]", e);
    return NextResponse.json({ error: "No se pudo guardar el banner" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const banner = await prisma.bannerPromocion.findFirst();
    if (!banner) return NextResponse.json({ error: "No hay banner" }, { status: 404 });

    await deleteFile(banner.path);
    await prisma.bannerPromocion.delete({ where: { id: banner.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[banner-promocion DELETE]", e);
    return NextResponse.json({ error: "No se pudo eliminar el banner" }, { status: 500 });
  }
}
