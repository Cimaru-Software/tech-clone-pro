import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CLIENT_SELECT = { id: true, nombre: true, apellido: true, email: true, telefono: true, direccion: true, ciudad: true } as const;

async function getAuthenticatedId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("cliente_token")?.value;
  if (!token) return null;
  const payload = await verifyClientToken(token);
  if (!payload || typeof payload.id !== "string") return null;
  return payload.id;
}

export async function GET(request: NextRequest) {
  const id = await getAuthenticatedId(request);
  if (!id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cliente = await prisma.cliente.findUnique({ where: { id }, select: CLIENT_SELECT });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ cliente });
}

const updateProfileSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
});

const updatePasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: z.string().min(6),
});

export async function PATCH(request: NextRequest) {
  const id = await getAuthenticatedId(request);
  if (!id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const body = await request.json();

    if ("passwordActual" in body) {
      const { passwordActual, passwordNueva } = updatePasswordSchema.parse(body);
      const clienteDB = await prisma.cliente.findUnique({ where: { id } });
      if (!clienteDB) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

      const valid = await bcrypt.compare(passwordActual, clienteDB.password);
      if (!valid) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });

      const hash = await bcrypt.hash(passwordNueva, 10);
      await prisma.cliente.update({ where: { id }, data: { password: hash } });
      return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
    }

    const data = updateProfileSchema.parse(body);
    const cliente = await prisma.cliente.update({ where: { id }, data, select: CLIENT_SELECT });
    return NextResponse.json({ ok: true, cliente });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
