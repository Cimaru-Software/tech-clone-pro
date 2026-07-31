import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMailSafe, passwordResetEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

function getFrontendBaseUrl() {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return apiUrl.replace(":3001", ":5173");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const cliente = await prisma.cliente.findUnique({ where: { email } });

    if (cliente) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, clienteId: cliente.id, expiresAt },
      });

      const resetUrl = `${getFrontendBaseUrl()}/restablecer-password?token=${token}`;

      await sendMailSafe(
        passwordResetEmail({
          cliente: { nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email },
          resetUrl,
        })
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Si el correo existe, te enviaremos un enlace para restablecer tu contraseña.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
