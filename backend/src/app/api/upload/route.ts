import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getPublicDir } from "@/lib/paths";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const productoId = formData.get("productoId") as string;
  const files = formData.getAll("images") as File[];

  if (!productoId || files.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const existingImages = await prisma.productoImagen.count({ where: { productoId } });
  if (existingImages + files.length > 5) {
    return NextResponse.json({ error: "Máximo 5 imágenes por producto" }, { status: 400 });
  }

  const dir = join(getPublicDir(), "images", "productos", productoId);
  await mkdir(dir, { recursive: true });

  const imagenes = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop();
    const filename = `${uuidv4()}.${ext}`;
    const filepath = join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const imagen = await prisma.productoImagen.create({
      data: {
        productoId,
        path: `/images/productos/${productoId}/${filename}`,
        orden: existingImages + i,
      },
    });
    imagenes.push(imagen);
  }

  return NextResponse.json({ imagenes }, { status: 201 });
}
