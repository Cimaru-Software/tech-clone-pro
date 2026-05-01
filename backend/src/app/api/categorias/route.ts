import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json({ categorias });
}
