import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SubsubDef = { nombre: string; slug: string; orden: number };
type SubDef = { nombre: string; slug: string; orden: number; subsubcategorias?: SubsubDef[] };
type CatDef = { nombre: string; slug: string; orden: number; subcategorias: SubDef[] };

const CATEGORIAS: CatDef[] = [
  {
    nombre: "Computadoras y Laptops", slug: "computadoras-laptops", orden: 1,
    subcategorias: [
      {
        nombre: "Laptops", slug: "laptops", orden: 1,
        subsubcategorias: [
          { nombre: "Laptops para hogar/oficina", slug: "laptops-hogar-oficina", orden: 1 },
          { nombre: "Laptops gamers", slug: "laptops-gamers", orden: 2 },
        ],
      },
      {
        nombre: "Desktop", slug: "desktop", orden: 2,
        subsubcategorias: [
          { nombre: "Desktop para hogar/oficina", slug: "desktop-hogar-oficina", orden: 1 },
          { nombre: "Desktop gamers", slug: "desktop-gamers", orden: 2 },
        ],
      },
      { nombre: "All in One", slug: "all-in-one", orden: 3 },
      {
        nombre: "Monitores", slug: "monitores", orden: 4,
        subsubcategorias: [
          { nombre: "Monitores sencillos", slug: "monitores-sencillos", orden: 1 },
          { nombre: "Monitores gamers", slug: "monitores-gamers", orden: 2 },
        ],
      },
      {
        nombre: "Componentes", slug: "componentes", orden: 5,
        subsubcategorias: [
          { nombre: "RAMs", slug: "rams", orden: 1 },
          { nombre: "SSDs", slug: "ssds", orden: 2 },
          { nombre: "Procesadores", slug: "procesadores", orden: 3 },
          { nombre: "Mainboards", slug: "mainboards", orden: 4 },
          { nombre: "Tarjetas Gráficas", slug: "tarjetas-graficas", orden: 5 },
          { nombre: "Fuentes de Poder", slug: "fuentes-poder", orden: 6 },
          { nombre: "Enfriamiento líquido", slug: "enfriamiento-liquido", orden: 7 },
          { nombre: "Ventiladores RGB", slug: "ventiladores-rgb", orden: 8 },
          { nombre: "Cases sencillos", slug: "cases-sencillos", orden: 9 },
          { nombre: "Cases gamers", slug: "cases-gamers", orden: 10 },
        ],
      },
      {
        nombre: "Almacenamiento", slug: "almacenamiento", orden: 6,
        subsubcategorias: [
          { nombre: "Discos Externos", slug: "discos-externos", orden: 1 },
          { nombre: "Microsd", slug: "microsd", orden: 2 },
          { nombre: "USB", slug: "usb", orden: 3 },
          { nombre: "Pendrive", slug: "pendrive", orden: 4 },
        ],
      },
      {
        nombre: "Accesorios de computación", slug: "accesorios-computacion", orden: 7,
        subsubcategorias: [
          { nombre: "Teclados", slug: "teclados", orden: 1 },
          { nombre: "Mouses", slug: "mouses", orden: 2 },
          { nombre: "Cámaras Web", slug: "camaras-web", orden: 3 },
          { nombre: "Micrófono", slug: "microfono", orden: 4 },
          { nombre: "Mouse Pad", slug: "mouse-pad", orden: 5 },
        ],
      },
      { nombre: "Repuestos de laptops", slug: "repuestos-laptops", orden: 8 },
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
    subcategorias: [],
  },
  {
    nombre: "Celulares, Tablets y Smartwatch", slug: "celulares-tablets-smartwatch", orden: 4,
    subcategorias: [],
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
      {
        nombre: "Cerco eléctrico", slug: "cerco-electrico", orden: 8,
        subsubcategorias: [
          { nombre: "Electrificador", slug: "electrificador", orden: 1 },
          { nombre: "Templadores", slug: "templadores", orden: 2 },
          { nombre: "Tubería galvanizada", slug: "tuberia-galvanizada", orden: 3 },
          { nombre: "Letreros", slug: "letreros", orden: 4 },
        ],
      },
      { nombre: "Sirenas", slug: "sirenas", orden: 9 },
      { nombre: "Control de acceso", slug: "control-acceso", orden: 10 },
      { nombre: "Video portero", slug: "video-portero", orden: 11 },
      { nombre: "Accesorios de Instalación", slug: "accesorios-instalacion", orden: 12 },
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

  // Colectar todos los slugs
  const slugsSubsub = CATEGORIAS.flatMap((c) =>
    c.subcategorias.flatMap((s) => (s.subsubcategorias ?? []).map((ss) => ss.slug))
  );
  const slugsSub = CATEGORIAS.flatMap((c) => c.subcategorias.map((s) => s.slug));
  const slugsCat = CATEGORIAS.map((c) => c.slug);

  // Limpiar los que ya no existen (sin productos)
  await prisma.subsubcategoria.deleteMany({
    where: { slug: { notIn: slugsSubsub }, productos: { none: {} } },
  });
  await prisma.subcategoria.deleteMany({
    where: { slug: { notIn: slugsSub }, productos: { none: {} } },
  });
  await prisma.categoria.deleteMany({
    where: { slug: { notIn: slugsCat }, productos: { none: {} } },
  });

  for (const cat of CATEGORIAS) {
    const { subcategorias, ...catData } = cat;
    const categoria = await prisma.categoria.upsert({
      where: { slug: catData.slug },
      update: { nombre: catData.nombre, orden: catData.orden },
      create: catData,
    });

    for (const sub of subcategorias) {
      const { subsubcategorias, ...subData } = sub;
      const subcategoria = await prisma.subcategoria.upsert({
        where: { slug: subData.slug },
        update: { nombre: subData.nombre, orden: subData.orden, categoriaId: categoria.id },
        create: { ...subData, categoriaId: categoria.id },
      });

      for (const subsub of subsubcategorias ?? []) {
        await prisma.subsubcategoria.upsert({
          where: { slug: subsub.slug },
          update: { nombre: subsub.nombre, orden: subsub.orden, subcategoriaId: subcategoria.id },
          create: { ...subsub, subcategoriaId: subcategoria.id },
        });
      }
    }
  }

  console.log("✅ Seed completado: 10 categorías con subcategorías y subsubcategorías.");
  console.log("   admin@lacasadelcomputador.com / 4dm1n*Computador");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
