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

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function uniqueSlug(base: string, excludeId: string) {
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slugify(base) : `${slugify(base)}-${n}`;
    const existing = await prisma.noticia.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n++;
  }
}

async function deleteFile(path: string) {
  try { await unlink(join(getPublicDir(), path)); } catch {}
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("admin_token")?.value;
    const isAdmin = Boolean(token && (await verifyAdminToken(token)));

    const noticia = await prisma.noticia.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ...(isAdmin ? {} : { publicado: true }),
      },
    });
    if (!noticia) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ noticia });
  } catch (e) {
    console.error("[noticias/:id GET]", e);
    return NextResponse.json({ error: "Error al cargar la noticia" }, { status: 500 });
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
    const current = await prisma.noticia.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });

    const formData = await request.formData();
    const titulo = (formData.get("titulo") as string)?.trim();
    const cuerpo = formData.get("cuerpo") as string | null;
    const publicado = formData.get("publicado");
    const portadaFile = formData.get("portada") as File | null;

    let portada = current.portada;
    if (portadaFile && portadaFile.size > 0 && portadaFile.type.startsWith("image/")) {
      const dir = join(getPublicDir(), "images", "noticias");
      await mkdir(dir, { recursive: true });
      const ext = portadaFile.name.split(".").pop() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      await writeFile(join(dir, filename), Buffer.from(await portadaFile.arrayBuffer()));
      await deleteFile(current.portada);
      portada = `/images/noticias/${filename}`;
    }

    const slug = titulo && titulo !== current.titulo ? await uniqueSlug(titulo, id) : current.slug;

    const noticia = await prisma.noticia.update({
      where: { id },
      data: {
        ...(titulo && { titulo, slug }),
        ...(cuerpo !== null && { cuerpo }),
        ...(publicado !== null && { publicado: publicado === "true" }),
        portada,
      },
    });
    return NextResponse.json({ noticia });
  } catch (e) {
    console.error("[noticias/:id PUT]", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
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
    const noticia = await prisma.noticia.findUnique({ where: { id } });
    if (!noticia) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await deleteFile(noticia.portada);
    await prisma.noticia.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[noticias/:id DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
