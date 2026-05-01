import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("cliente_token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const payload = await verifyClientToken(token);
  if (!payload || typeof payload.id !== "string") {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: payload.id },
    select: { id: true, nombre: true, apellido: true, email: true, telefono: true, direccion: true, ciudad: true },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ cliente });
}
