import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Delete old admin and create new one
  await prisma.admin.deleteMany({ where: { email: "admin@techclone.com" } });

  const hashedPassword = await bcrypt.hash("4dm1n*Computador", 10);
  await prisma.admin.upsert({
    where: { email: "admin@lacasadelcomputador.com" },
    update: { password: hashedPassword, nombre: "Administrador" },
    create: {
      email: "admin@lacasadelcomputador.com",
      password: hashedPassword,
      nombre: "Administrador",
    },
  });

  const categories = [
    { nombre: "Laptops", slug: "laptops" },
    { nombre: "Desktops", slug: "desktops" },
    { nombre: "Componentes", slug: "componentes" },
    { nombre: "Impresoras", slug: "impresoras" },
    { nombre: "CCTV", slug: "cctv" },
    { nombre: "Redes", slug: "redes" },
    { nombre: "Biometría", slug: "biometria" },
    { nombre: "Accesorios", slug: "accesorios" },
  ];

  for (const cat of categories) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Seed completado: admin@lacasadelcomputador.com / 4dm1n*Computador");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
