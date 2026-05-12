import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

// Endpoint usado por Tiptap para insertar imágenes dentro del cuerpo
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
    }
    const dir = join(process.cwd(), "public", "images", "noticias-contenido");
    await mkdir(dir, { recursive: true });
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/images/noticias-contenido/${filename}` });
  } catch (e) {
    console.error("[upload-image]", e);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
