import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signClientToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.cliente.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const cliente = await prisma.cliente.create({
      data: { ...data, password: hashed },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true },
    });

    const token = await signClientToken({ id: cliente.id, email: cliente.email, role: "cliente" });

    const response = NextResponse.json({ ok: true, cliente }, { status: 201 });
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
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
