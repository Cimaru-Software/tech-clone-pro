import { Link } from "@/lib/router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-banner.jpg";
import brandHp from "@/assets/brands/hp.png";
import brandLenovo from "@/assets/brands/lenovo.png";
import brandDell from "@/assets/brands/dell.png";
import brandHikvision from "@/assets/brands/hikvision.png";
import brandDahua from "@/assets/brands/dahua.png";
import brandEpson from "@/assets/brands/epson.png";
import brandTplink from "@/assets/brands/tplink.png";
import brandZkteco from "@/assets/brands/zkteco.png";
import brandCisco from "@/assets/brands/cisco.png";
import { useCart } from "@/context/CartContext";
import type { Producto } from "@/types/product";
import { ShieldCheck, Truck, Headphones, CreditCard, Wrench, Camera, Fingerprint, Cable, Cpu, Wind, Tv, CircuitBoard, ArrowRight, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface BannerHero {
  id: string;
  path: string;
  orden: number;
}

function getImageUrl(producto: Producto): string {
  if (producto.imagenes && producto.imagenes.length > 0) return `${BACKEND}${producto.imagenes[0].path}`;
  return "";
}

function FeaturedProductCard({ producto }: { producto: Producto }) {
  const { add } = useCart();
  const precio = Number(producto.precio);
  const precioFinal = producto.descuento > 0 ? precio * (1 - producto.descuento / 100) : precio;
  const imgUrl = getImageUrl(producto);

  return (
    <Link to="/producto/$id" params={{ id: producto.id }} className="group bg-white border rounded-md overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow">
      <div className="relative aspect-square bg-secondary p-4">
        {producto.descuento > 0 && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded z-10">-{producto.descuento}%</span>
        )}
        {imgUrl ? (
          <img src={imgUrl} alt={producto.nombre} loading="lazy" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30">📷</div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] uppercase font-semibold text-brand-blue tracking-wide">{producto.marca}</div>
        <h3 className="text-sm font-medium line-clamp-2 mt-0.5 min-h-[2.5rem]">{producto.nombre}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{producto.descripcion}</p>
        <div className="mt-2">
          {producto.descuento > 0 && <div className="text-xs text-muted-foreground line-through">${precio.toFixed(2)}</div>}
          <div className="text-xl font-black text-brand-blue">${precioFinal.toFixed(2)}</div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); add(producto); }}
          className="mt-3 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" /> Agregar
        </button>
      </div>
    </Link>
  );
}

const CATEGORIA_ICONS: Record<string, string> = {
  "computadoras-laptops": "💻",
  "impresoras-suministros": "🖨️",
  "sillas-escritorios": "🪑",
  "celulares-tablets-smartwatch": "📱",
  "domotica": "🏠",
  "audio-video": "🔊",
  "seguridad-videovigilancia": "📷",
  "energia-respaldo": "🔋",
  "redes-conectividad": "🌐",
  "hogar": "❄️",
};

interface CategoriaConImagen {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
}

export default function Home() {
  const [featured, setFeatured] = useState<Producto[]>([]);
  const [offers, setOffers] = useState<Producto[]>([]);
  const [heroBanners, setHeroBanners] = useState<BannerHero[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [bannerPromo, setBannerPromo] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CategoriaConImagen[]>([]);

  useEffect(() => {
    fetch(`${BACKEND}/api/categorias`)
      .then((r) => r.json())
      .then((d) => setCategorias(d.categorias || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const res = await fetch(`${BACKEND}/api/productos?estado=ACTIVO&destacado=true`);
        const data = await res.json();
        if (active) setFeatured(data.productos || []);
      } catch {
        if (active) setFeatured([]);
      }

      try {
        const res = await fetch(`${BACKEND}/api/productos?estado=ACTIVO&conDescuento=true`);
        const data = await res.json();
        if (active) setOffers(data.productos || []);
      } catch {
        if (active) setOffers([]);
      }
    }

    loadProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBanners() {
      try {
        const res = await fetch(`${BACKEND}/api/banners-hero`);
        const data = await res.json();
        if (active) setHeroBanners(data.banners || []);
      } catch {
        if (active) setHeroBanners([]);
      }
    }

    loadBanners();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    fetch(`${BACKEND}/api/banner-promocion`)
      .then((r) => r.json())
      .then((d) => { if (d.banner) setBannerPromo(`${BACKEND}${d.banner.path}`); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % heroBanners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroIndex >= heroBanners.length) setHeroIndex(0);
  }, [heroBanners.length, heroIndex]);

  const hasMultipleHeroBanners = heroBanners.length > 1;
  const currentHeroBanner = heroBanners[heroIndex];
  const heroImageSrc = currentHeroBanner ? `${BACKEND}${currentHeroBanner.path}` : heroImg;

  function previousHeroBanner() {
    if (!hasMultipleHeroBanners) return;
    setHeroIndex((idx) => (idx === 0 ? heroBanners.length - 1 : idx - 1));
  }

  function nextHeroBanner() {
    if (!hasMultipleHeroBanners) return;
    setHeroIndex((idx) => (idx + 1) % heroBanners.length);
  }

  return (
    <div>
      {/* HERO */}
      <section className="gradient-hero text-white relative overflow-hidden">
        <div className="container-x py-8 md:py-14 relative">
          {/* Mobile: stacked. Desktop: side by side */}
          <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-6 lg:gap-7 items-center">
            <div className="text-center md:text-left">
              <span className="inline-block bg-brand-red text-white text-xs font-bold px-3 py-1 rounded mb-3">OFERTAS DE TEMPORADA</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05]">
                Todo<br /><span className="text-brand-yellow">en un solo lugar</span>
              </h1>
              <p className="mt-3 text-white/85 max-w-md mx-auto md:mx-0 text-sm sm:text-base">
                Laptops, PCs, cámaras de seguridad, biometría y soluciones empresariales. Hasta 30% de descuento + 12 cuotas sin intereses.
              </p>
              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3">
                <Link to="/tienda" className="bg-brand-red hover:bg-brand-red-dark px-5 py-2.5 rounded font-bold flex items-center gap-2 text-sm sm:text-base">
                  Comprar ahora <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/servicios" className="bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-2.5 rounded font-bold text-sm sm:text-base">
                  Ver servicios
                </Link>
              </div>
            </div>

            <div className="relative md:-mr-1 lg:-mr-2 mt-4 md:mt-0">
              <div className="relative overflow-hidden rounded-lg shadow-card-hover bg-white/5 aspect-[16/8] md:aspect-[16/7.3] lg:min-h-[300px] xl:min-h-[360px]">
                <img
                  key={heroImageSrc}
                  src={heroImageSrc}
                  alt="Promociones tecnología"
                  width={1600}
                  height={640}
                  className="h-full w-full object-cover transition-opacity duration-500"
                />
                {hasMultipleHeroBanners && (
                  <>
                    <button
                      type="button"
                      onClick={previousHeroBanner}
                      aria-label="Banner anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/35 hover:bg-black/55 text-white grid place-items-center transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextHeroBanner}
                      aria-label="Siguiente banner"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/35 hover:bg-black/55 text-white grid place-items-center transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                      {heroBanners.map((banner, idx) => (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => setHeroIndex(idx)}
                          aria-label={`Ver banner ${idx + 1}`}
                          className={`h-2 rounded-full transition-all ${idx === heroIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-b">
        <div className="container-x grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 text-sm">
          {[
            { icon: Truck, t: "Envío nacional", s: "A todo Ecuador" },
            { icon: ShieldCheck, t: "Garantía oficial", s: "Productos originales" },
            { icon: CreditCard, t: "12 cuotas", s: "Sin intereses" },
            { icon: Headphones, t: "Soporte 24/7", s: "Servicio técnico" },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded bg-secondary text-brand-blue grid place-items-center shrink-0">
                <b.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">{b.t}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">{b.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* CERTIFICATIONS */}
      <section className="bg-white border-y py-10">
        <div className="container-x text-center">
          <h3 className="font-bold text-brand-blue mb-6">Distribuidores autorizados</h3>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            {[
              { name: "HP", src: brandHp },
              { name: "Lenovo", src: brandLenovo },
              { name: "Dell", src: brandDell },
              { name: "Hikvision", src: brandHikvision },
              { name: "Dahua", src: brandDahua },
              { name: "Epson", src: brandEpson },
              { name: "TP-Link", src: brandTplink },
              { name: "ZKTeco", src: brandZkteco },
              { name: "Cisco", src: brandCisco },
            ].map((b) => (
              <img key={b.name} src={b.src} alt={b.name} className="h-8 md:h-10 w-auto object-contain" />
            ))}
          </div>
        </div>
      </section>

      {/* PROMO STRIP */}
      {bannerPromo && (
        <section>
          <Link to="/promociones">
            <img src={bannerPromo} alt="Promoción" className="w-full object-cover max-h-64 md:max-h-96" />
          </Link>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x py-8 md:py-10">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-3xl font-black text-brand-blue">Productos destacados</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Seleccionados por nuestro equipo</p>
            </div>
            <Link to="/tienda" className="text-xs md:text-sm font-bold text-brand-red hover:underline shrink-0 ml-2">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featured.map((p) => <FeaturedProductCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      {/* OFFERS BANNER */}
      <section className="container-x py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-brand-blue text-white rounded-lg p-6 md:p-8 overflow-hidden relative">
            <div className="text-xs font-bold opacity-80">SEGURIDAD</div>
            <h3 className="text-xl md:text-2xl font-black mt-1">Kits de cámaras CCTV</h3>
            <p className="text-sm opacity-80 mt-1">Instalación incluida en Guayaquil</p>
            <Link to="/tienda" className="inline-block mt-4 bg-brand-red px-5 py-2 rounded font-bold text-sm">Cotizar</Link>
          </div>
          <div className="bg-brand-red text-white rounded-lg p-6 md:p-8 overflow-hidden relative">
            <div className="text-xs font-bold opacity-80">CORPORATIVO</div>
            <h3 className="text-xl md:text-2xl font-black mt-1">Soluciones empresariales</h3>
            <p className="text-sm opacity-80 mt-1">Redes, cableado y biometría</p>
            <Link to="/proyectos" className="inline-block mt-4 bg-white text-brand-red px-5 py-2 rounded font-bold text-sm">Ver proyectos</Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary py-10 md:py-12">
        <div className="container-x">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-black text-brand-blue">Nuestros Servicios</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Soluciones integrales para tu hogar y empresa</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { i: Wrench, t: "Reparación PC", s: "Diagnóstico gratuito" },
              { i: Camera, t: "CCTV", s: "Instalación llave en mano" },
              { i: Cpu, t: "Cercos eléctricos", s: "Perimetrales certificados" },
              { i: Fingerprint, t: "Biometría", s: "Control de acceso" },
              { i: Cable, t: "Cableado", s: "Estructurado certificado" },
              { i: Wind, t: "Aires acondicionado", s: "Instalación y mantenimiento" },
              { i: Tv, t: "Mantenimiento de TVs", s: "Todas las marcas" },
              { i: CircuitBoard, t: "Microelectrónica", s: "Reparación de placas" },
            ].map((s) => (
              <Link key={s.t} to="/servicios" className="bg-white rounded-md p-4 md:p-5 hover:shadow-card-hover transition-shadow text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded bg-brand-blue text-white grid place-items-center mx-auto mb-2 md:mb-3">
                  <s.i className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="font-bold text-xs md:text-sm">{s.t}</div>
                <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{s.s}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="container-x py-8 md:py-10">
          <h2 className="text-xl md:text-3xl font-black text-brand-blue mb-4 md:mb-6">Ofertas relámpago</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {offers.map((p) => <FeaturedProductCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      
    </div>
  );
}
