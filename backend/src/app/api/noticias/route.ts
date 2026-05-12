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

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.noticia.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n++;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Number(searchParams.get("limit") || "12"));
    const soloPublicadas = searchParams.get("publicado") !== "all";

    const where = soloPublicadas ? { publicado: true } : {};
    const [noticias, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, titulo: true, slug: true, portada: true, publicado: true, createdAt: true, updatedAt: true },
      }),
      prisma.noticia.count({ where }),
    ]);
    return NextResponse.json({ noticias, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[noticias GET]", e);
    return NextResponse.json({ error: "Error al cargar noticias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const titulo = (formData.get("titulo") as string)?.trim();
    const cuerpo = (formData.get("cuerpo") as string) || "";
    const publicado = formData.get("publicado") === "true";
    const portadaFile = formData.get("portada") as File | null;

    if (!titulo) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    if (!portadaFile || !portadaFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "La imagen de portada es obligatoria" }, { status: 400 });
    }

    const dir = join(process.cwd(), "public", "images", "noticias");
    await mkdir(dir, { recursive: true });
    const ext = portadaFile.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    await writeFile(join(dir, filename), Buffer.from(await portadaFile.arrayBuffer()));

    const slug = await uniqueSlug(titulo);
    const noticia = await prisma.noticia.create({
      data: { titulo, slug, portada: `/images/noticias/${filename}`, cuerpo, publicado },
    });
    return NextResponse.json({ noticia }, { status: 201 });
  } catch (e) {
    console.error("[noticias POST]", e);
    return NextResponse.json({ error: "Error al crear la noticia" }, { status: 500 });
  }
}
