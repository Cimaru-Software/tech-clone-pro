import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { pedidos: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  const { password: _, ...clienteData } = cliente;
  return NextResponse.json({ cliente: clienteData });
}
