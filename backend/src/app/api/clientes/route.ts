import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      ciudad: true,
      createdAt: true,
      _count: { select: { pedidos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clientes });
}
