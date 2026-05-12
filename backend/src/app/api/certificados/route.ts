import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

export async function GET() {
  try {
    const certificados = await prisma.certificado.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ certificados });
  } catch (e) {
    console.error("[certificados GET]", e);
    return NextResponse.json({ error: "No se pudieron cargar los certificados" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const nombre = (formData.get("nombre") as string)?.trim();
    const file = formData.get("image") as File | null;

    if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Debes subir una imagen válida" }, { status: 400 });
    }

    const dir = join(process.cwd(), "public", "images", "certificados");
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    const existing = await prisma.certificado.count();
    const certificado = await prisma.certificado.create({
      data: { nombre, path: `/images/certificados/${filename}`, orden: existing },
    });

    return NextResponse.json({ certificado }, { status: 201 });
  } catch (e) {
    console.error("[certificados POST]", e);
    return NextResponse.json({ error: "No se pudo guardar el certificado" }, { status: 500 });
  }
}
