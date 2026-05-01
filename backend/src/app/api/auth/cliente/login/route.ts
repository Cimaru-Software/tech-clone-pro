import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signClientToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const cliente = await prisma.cliente.findUnique({ where: { email } });
    if (!cliente) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, cliente.password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await signClientToken({ id: cliente.id, email: cliente.email, role: "cliente" });

    const response = NextResponse.json({
      ok: true,
      cliente: { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email },
    });
    response.cookies.set("cliente_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
