import laptopImg from "@/assets/cat-laptops.jpg";
import desktopImg from "@/assets/cat-desktop.jpg";
import cctvImg from "@/assets/cat-cctv.jpg";
import biometricImg from "@/assets/cat-biometric.jpg";
import printerImg from "@/assets/cat-printers.jpg";
import networkImg from "@/assets/cat-network.jpg";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  specs: string[];
  badge?: string;
  stock: number;
};

export const categories = [
  { slug: "laptops", name: "Laptops", image: laptopImg, icon: "Laptop" },
  { slug: "desktops", name: "Computadoras de Escritorio", image: desktopImg, icon: "Monitor" },
  { slug: "componentes", name: "Componentes", image: desktopImg, icon: "Cpu" },
  { slug: "impresoras", name: "Impresoras", image: printerImg, icon: "Printer" },
  { slug: "cctv", name: "Cámaras CCTV", image: cctvImg, icon: "Camera" },
  { slug: "redes", name: "Redes", image: networkImg, icon: "Network" },
  { slug: "biometria", name: "Biometría", image: biometricImg, icon: "Fingerprint" },
  { slug: "accesorios", name: "Accesorios", image: laptopImg, icon: "Mouse" },
];

export const products: Product[] = [
  { id: "p1", name: "Laptop HP Pavilion 15 Core i7 16GB 512GB SSD", brand: "HP", category: "laptops", price: 899, oldPrice: 1099, image: laptopImg, specs: ["Intel Core i7-1255U", "16GB DDR4", "512GB NVMe SSD", "15.6\" FHD"], badge: "-18%", stock: 12 },
  { id: "p2", name: "Laptop Lenovo IdeaPad 3 Ryzen 5 8GB 256GB", brand: "Lenovo", category: "laptops", price: 549, oldPrice: 649, image: laptopImg, specs: ["AMD Ryzen 5", "8GB RAM", "256GB SSD", "14\" HD"], badge: "OFERTA", stock: 8 },
  { id: "p3", name: "PC Gamer Ryzen 7 RTX 4060 32GB 1TB", brand: "Custom", category: "desktops", price: 1499, oldPrice: 1699, image: desktopImg, specs: ["AMD Ryzen 7 5700X", "RTX 4060 8GB", "32GB DDR4", "1TB NVMe"], badge: "TOP", stock: 5 },
  { id: "p4", name: "PC Oficina Intel i5 8GB 480GB SSD", brand: "Dell", category: "desktops", price: 549, image: desktopImg, specs: ["Intel Core i5", "8GB RAM", "480GB SSD", "Windows 11 Pro"], stock: 20 },
  { id: "p5", name: "Cámara Hikvision Domo 4MP ColorVu", brand: "Hikvision", category: "cctv", price: 89, oldPrice: 115, image: cctvImg, specs: ["4MP Full Color", "Visión nocturna", "IP67", "30m IR"], badge: "-22%", stock: 50 },
  { id: "p6", name: "Kit DVR 8 Cámaras 1080p + Disco 1TB", brand: "Dahua", category: "cctv", price: 459, oldPrice: 549, image: cctvImg, specs: ["DVR 8 canales", "8 cámaras bullet", "Disco 1TB", "App móvil"], badge: "KIT", stock: 7 },
  { id: "p7", name: "Impresora Multifuncional Epson EcoTank L3250", brand: "Epson", category: "impresoras", price: 269, image: printerImg, specs: ["Sistema de tinta", "WiFi Direct", "Imprime/Copia/Escanea", "USB"], stock: 15 },
  { id: "p8", name: "Router TP-Link Archer AX55 WiFi 6 AX3000", brand: "TP-Link", category: "redes", price: 119, oldPrice: 149, image: networkImg, specs: ["WiFi 6 AX3000", "4 Antenas", "Gigabit", "OneMesh"], badge: "-20%", stock: 25 },
  { id: "p9", name: "Control Biométrico ZKTeco F18 Huella + Tarjeta", brand: "ZKTeco", category: "biometria", price: 189, image: biometricImg, specs: ["3000 huellas", "RFID", "TCP/IP", "Software incluido"], stock: 10 },
  { id: "p10", name: "Switch Cisco 24 Puertos Gigabit Administrable", brand: "Cisco", category: "redes", price: 349, image: networkImg, specs: ["24 puertos GbE", "Administrable", "VLAN", "1U Rack"], stock: 6 },
  { id: "p11", name: "Laptop Dell Inspiron 14 Core i3 8GB 256GB", brand: "Dell", category: "laptops", price: 449, oldPrice: 519, image: laptopImg, specs: ["Intel Core i3", "8GB RAM", "256GB SSD", "14\" HD"], badge: "OFERTA", stock: 18 },
  { id: "p12", name: "Cámara IP Bullet 5MP PoE Visión Nocturna", brand: "Hikvision", category: "cctv", price: 109, image: cctvImg, specs: ["5MP", "PoE", "IP67", "Audio bidireccional"], stock: 32 },
];

export const brands = ["HP", "Lenovo", "Dell", "Hikvision", "Dahua", "Epson", "TP-Link", "ZKTeco", "Cisco", "Custom"];
