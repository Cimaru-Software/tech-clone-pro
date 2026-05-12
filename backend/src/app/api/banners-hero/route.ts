import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

function isImage(file: File) {
  return file.type.startsWith("image/");
}

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const banners = await prisma.bannerHero.findMany({
      where: includeInactive ? undefined : { activo: true },
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los banners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Debes subir al menos una imagen" }, { status: 400 });
    }

    if (files.some((file) => !isImage(file))) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const dir = join(process.cwd(), "public", "images", "banners-hero");
    await mkdir(dir, { recursive: true });

    const existing = await prisma.bannerHero.count();
    const banners = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      const filepath = join(dir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      const banner = await prisma.bannerHero.create({
        data: {
          path: `/images/banners-hero/${filename}`,
          orden: existing + i,
        },
      });
      banners.push(banner);
    }

    return NextResponse.json({ banners }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudieron guardar los banners" }, { status: 500 });
  }
}
