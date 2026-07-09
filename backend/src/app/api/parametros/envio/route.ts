import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

export async function GET() {
  try {
    const envios = await prisma.envioProvincia.findMany({ orderBy: { provincia: "asc" } });
    return NextResponse.json({ envios });
  } catch (e) {
    console.error("[parametros/envio GET]", e);
    return NextResponse.json({ error: "No se pudieron cargar los envíos" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const items: unknown = Array.isArray(body.envios) ? body.envios : [body];

    const updates: { provincia: string; costo: number }[] = [];
    for (const item of items as Array<{ provincia?: unknown; costo?: unknown }>) {
      const provincia = String(item.provincia || "").trim();
      const costo = Number(item.costo);
      if (!provincia || !Number.isFinite(costo) || costo < 0) {
        return NextResponse.json({ error: "Datos de envío inválidos" }, { status: 400 });
      }
      updates.push({ provincia, costo });
    }

    const envios = await prisma.$transaction(
      updates.map((u) =>
        prisma.envioProvincia.upsert({
          where: { provincia: u.provincia },
          update: { costo: u.costo },
          create: { provincia: u.provincia, costo: u.costo },
        })
      )
    );

    return NextResponse.json({ envios });
  } catch (e) {
    console.error("[parametros/envio PUT]", e);
    return NextResponse.json({ error: "No se pudieron guardar los envíos" }, { status: 500 });
  }
}
