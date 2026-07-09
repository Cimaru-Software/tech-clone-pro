import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

export async function GET() {
  try {
    const config = await prisma.configuracionIva.findFirst();
    return NextResponse.json({ porcentaje: config?.porcentaje ?? 15 });
  } catch (e) {
    console.error("[parametros/iva GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el IVA" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const porcentaje = Number(body.porcentaje);
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      return NextResponse.json({ error: "El porcentaje debe estar entre 0 y 100" }, { status: 400 });
    }

    const existing = await prisma.configuracionIva.findFirst();
    const config = existing
      ? await prisma.configuracionIva.update({ where: { id: existing.id }, data: { porcentaje } })
      : await prisma.configuracionIva.create({ data: { porcentaje } });

    return NextResponse.json({ porcentaje: config.porcentaje });
  } catch (e) {
    console.error("[parametros/iva PUT]", e);
    return NextResponse.json({ error: "No se pudo guardar el IVA" }, { status: 500 });
  }
}
