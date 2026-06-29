import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const seriales = await prisma.serialProducto.findMany({
    where: { productoId: id },
    orderBy: { createdAt: "asc" },
    include: {
      itemCompra: {
        select: {
          compraId: true,
          compra: { select: { createdAt: true } },
        },
      },
    },
  });

  return NextResponse.json({ seriales });
}
