import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIAS: { nombre: string; slug: string; orden: number; subcategorias: { nombre: string; slug: string; orden: number }[] }[] = [
  {
    nombre: "Computadoras y Laptops", slug: "computadoras-laptops", orden: 1,
    subcategorias: [
      { nombre: "Laptops para hogar/oficina", slug: "laptops-hogar-oficina", orden: 1 },
      { nombre: "Laptops gamers", slug: "laptops-gamers", orden: 2 },
      { nombre: "Desktop para hogar/oficina", slug: "desktop-hogar-oficina", orden: 3 },
      { nombre: "Desktop gamers", slug: "desktop-gamers", orden: 4 },
      { nombre: "All in One", slug: "all-in-one", orden: 5 },
      { nombre: "Monitores sencillos", slug: "monitores-sencillos", orden: 6 },
      { nombre: "Monitores gamers", slug: "monitores-gamers", orden: 7 },
      { nombre: "RAMs", slug: "rams", orden: 8 },
      { nombre: "SSDs", slug: "ssds", orden: 9 },
      { nombre: "Procesadores", slug: "procesadores", orden: 10 },
      { nombre: "Mainboards", slug: "mainboards", orden: 11 },
      { nombre: "Tarjetas Gráficas", slug: "tarjetas-graficas", orden: 12 },
      { nombre: "Fuentes de Poder", slug: "fuentes-poder", orden: 13 },
      { nombre: "Enfriamiento líquido", slug: "enfriamiento-liquido", orden: 14 },
      { nombre: "Ventiladores RGB", slug: "ventiladores-rgb", orden: 15 },
      { nombre: "Cases sencillos", slug: "cases-sencillos", orden: 16 },
      { nombre: "Cases gamers", slug: "cases-gamers", orden: 17 },
      { nombre: "Discos Externos", slug: "discos-externos", orden: 18 },
      { nombre: "Microsd", slug: "microsd", orden: 19 },
      { nombre: "USB", slug: "usb", orden: 20 },
      { nombre: "Pendrive", slug: "pendrive", orden: 21 },
      { nombre: "Teclados", slug: "teclados", orden: 22 },
      { nombre: "Mouses", slug: "mouses", orden: 23 },
      { nombre: "Cámaras Web", slug: "camaras-web", orden: 24 },
      { nombre: "Micrófono", slug: "microfono", orden: 25 },
      { nombre: "Mouse Pad", slug: "mouse-pad", orden: 26 },
      { nombre: "Repuestos de laptops", slug: "repuestos-laptops", orden: 27 },
    ],
  },
  {
    nombre: "Impresoras, Suministros y Accesorios", slug: "impresoras-suministros", orden: 2,
    subcategorias: [
      { nombre: "Impresoras", slug: "impresoras", orden: 1 },
      { nombre: "Copiadoras", slug: "copiadoras", orden: 2 },
      { nombre: "Escáner", slug: "escaner", orden: 3 },
      { nombre: "Lectores de código de barra", slug: "lectores-codigo-barra", orden: 4 },
      { nombre: "Impresoras matriciales", slug: "impresoras-matriciales", orden: 5 },
      { nombre: "Impresoras térmicas", slug: "impresoras-termicas", orden: 6 },
      { nombre: "Tintas", slug: "tintas", orden: 7 },
      { nombre: "Toners", slug: "toners", orden: 8 },
      { nombre: "Cartuchos", slug: "cartuchos", orden: 9 },
      { nombre: "Accesorios/Repuestos", slug: "accesorios-impresoras", orden: 10 },
    ],
  },
  {
    nombre: "Sillas y Escritorios", slug: "sillas-escritorios", orden: 3,
    subcategorias: [
      { nombre: "Accesorios/Repuestos", slug: "accesorios-sillas-escritorios", orden: 1 },
    ],
  },
  {
    nombre: "Celulares, Tablets y Smartwatch", slug: "celulares-tablets-smartwatch", orden: 4,
    subcategorias: [
      { nombre: "Accesorios/Repuestos", slug: "accesorios-celulares", orden: 1 },
    ],
  },
  {
    nombre: "Domótica", slug: "domotica", orden: 5,
    subcategorias: [
      { nombre: "Asistentes virtuales", slug: "asistentes-virtuales", orden: 1 },
      { nombre: "Cerraduras inteligentes", slug: "cerraduras-inteligentes", orden: 2 },
      { nombre: "Interruptores/tomacorrientes", slug: "interruptores-tomacorrientes", orden: 3 },
      { nombre: "Luces", slug: "luces", orden: 4 },
    ],
  },
  {
    nombre: "Audio y Video", slug: "audio-video", orden: 6,
    subcategorias: [
      { nombre: "Parlantes", slug: "parlantes", orden: 1 },
      { nombre: "Audífonos y Earbuds", slug: "audifonos-earbuds", orden: 2 },
      { nombre: "TVs", slug: "tvs", orden: 3 },
      { nombre: "Proyectores", slug: "proyectores", orden: 4 },
      { nombre: "Consolas de Juego", slug: "consolas-juego", orden: 5 },
      { nombre: "Cables y adaptadores", slug: "cables-adaptadores", orden: 6 },
    ],
  },
  {
    nombre: "Seguridad y Videovigilancia", slug: "seguridad-videovigilancia", orden: 7,
    subcategorias: [
      { nombre: "Cámaras inalámbricas", slug: "camaras-inalambricas", orden: 1 },
      { nombre: "Cámaras fijas interior/exterior", slug: "camaras-fijas", orden: 2 },
      { nombre: "Cámaras PTZ", slug: "camaras-ptz", orden: 3 },
      { nombre: "DVR/NVR", slug: "dvr-nvr", orden: 4 },
      { nombre: "Discos 24/7", slug: "discos-247", orden: 5 },
      { nombre: "Sensores", slug: "sensores", orden: 6 },
      { nombre: "Biométricos", slug: "biometricos", orden: 7 },
      { nombre: "Cerco eléctrico", slug: "cerco-electrico", orden: 8 },
      { nombre: "Electrificador", slug: "electrificador", orden: 9 },
      { nombre: "Templadores", slug: "templadores", orden: 10 },
      { nombre: "Tubería galvanizada", slug: "tuberia-galvanizada", orden: 11 },
      { nombre: "Letreros", slug: "letreros", orden: 12 },
      { nombre: "Sirenas", slug: "sirenas", orden: 13 },
      { nombre: "Control de acceso", slug: "control-acceso", orden: 14 },
      { nombre: "Video portero", slug: "video-portero", orden: 15 },
      { nombre: "Accesorios de Instalación", slug: "accesorios-instalacion", orden: 16 },
    ],
  },
  {
    nombre: "Energía y Respaldo", slug: "energia-respaldo", orden: 8,
    subcategorias: [
      { nombre: "UPS", slug: "ups", orden: 1 },
      { nombre: "Reguladores de Voltaje", slug: "reguladores-voltaje", orden: 2 },
      { nombre: "Protectores eléctricos", slug: "protectores-electricos", orden: 3 },
      { nombre: "Estación de energía portátil", slug: "estacion-energia-portatil", orden: 4 },
      { nombre: "Generadores eléctricos", slug: "generadores-electricos", orden: 5 },
      { nombre: "Pilas y Baterías", slug: "pilas-baterias", orden: 6 },
    ],
  },
  {
    nombre: "Redes y Conectividad", slug: "redes-conectividad", orden: 9,
    subcategorias: [
      { nombre: "Routers", slug: "routers", orden: 1 },
      { nombre: "Antenas", slug: "antenas", orden: 2 },
      { nombre: "Extensor/Repetidor", slug: "extensor-repetidor", orden: 3 },
      { nombre: "Switch", slug: "switch", orden: 4 },
      { nombre: "Patch Cord", slug: "patch-cord", orden: 5 },
      { nombre: "Rack", slug: "rack", orden: 6 },
      { nombre: "Servidores y almacenamiento", slug: "servidores-almacenamiento", orden: 7 },
      { nombre: "Fibra Óptica", slug: "fibra-optica", orden: 8 },
      { nombre: "Bobina de Cable UTP", slug: "cable-utp", orden: 9 },
      { nombre: "Patch Panel", slug: "patch-panel", orden: 10 },
      { nombre: "Conectores", slug: "conectores", orden: 11 },
      { nombre: "Canalización y Protección", slug: "canalizacion-proteccion", orden: 12 },
    ],
  },
  {
    nombre: "Hogar", slug: "hogar", orden: 10,
    subcategorias: [
      { nombre: "Aires Acondicionados", slug: "aires-acondicionados", orden: 1 },
      { nombre: "Accesorios", slug: "accesorios-hogar", orden: 2 },
    ],
  },
];

async function main() {
  await prisma.admin.deleteMany({ where: { email: "admin@techclone.com" } });

  const hashedPassword = await bcrypt.hash("4dm1n*Computador", 10);
  await prisma.admin.upsert({
    where: { email: "admin@lacasadelcomputador.com" },
    update: { password: hashedPassword, nombre: "Administrador" },
    create: { email: "admin@lacasadelcomputador.com", password: hashedPassword, nombre: "Administrador" },
  });

  // Eliminar subcategorías que ya no existen en la lista definitiva (no tienen productos)
  const slugsSubcategoria = CATEGORIAS.flatMap((c) => c.subcategorias.map((s) => s.slug));
  await prisma.subcategoria.deleteMany({
    where: { slug: { notIn: slugsSubcategoria }, productos: { none: {} } },
  });

  // Eliminar categorías viejas sin productos (slugs que no están en la lista)
  const slugsCategoria = CATEGORIAS.map((c) => c.slug);
  await prisma.categoria.deleteMany({
    where: { slug: { notIn: slugsCategoria }, productos: { none: {} } },
  });

  for (const cat of CATEGORIAS) {
    const { subcategorias, ...catData } = cat;
    const categoria = await prisma.categoria.upsert({
      where: { slug: catData.slug },
      update: { nombre: catData.nombre, orden: catData.orden },
      create: catData,
    });

    for (const sub of subcategorias) {
      await prisma.subcategoria.upsert({
        where: { slug: sub.slug },
        update: { nombre: sub.nombre, orden: sub.orden, categoriaId: categoria.id },
        create: { ...sub, categoriaId: categoria.id },
      });
    }
  }

  console.log("✅ Seed completado: 10 categorías con sus subcategorías.");
  console.log("   admin@lacasadelcomputador.com / 4dm1n*Computador");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
