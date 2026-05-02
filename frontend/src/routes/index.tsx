import { createFileRoute, Link } from "@tanstack/react-router";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import heroImg from "@/assets/hero-banner.jpg";
import { ShieldCheck, Truck, Headphones, CreditCard, Wrench, Camera, Fingerprint, Cable, Cpu, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "La Casa del Computador — Computadoras, CCTV y Servicios | Ecuador" },
      { name: "description", content: "Computadoras Ecuador, laptops, cámaras de seguridad Guayaquil, biometría, cercos eléctricos y servicio técnico. Envío nacional." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = products.slice(0, 8);
  const offers = products.filter((p) => p.oldPrice).slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="gradient-hero text-white relative overflow-hidden">
        <div className="container-x grid md:grid-cols-2 gap-6 items-center py-10 md:py-16 relative">
          <div>
            <span className="inline-block bg-brand-red text-white text-xs font-bold px-3 py-1 rounded mb-4">OFERTAS DE TEMPORADA</span>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05]">Tecnología<br /><span className="text-brand-yellow">para tu vida</span></h1>
            <p className="mt-4 text-white/85 max-w-md">Laptops, PCs, cámaras de seguridad, biometría y soluciones empresariales. Hasta 30% de descuento + 12 cuotas sin intereses.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/tienda" className="bg-brand-red hover:bg-brand-red-dark px-6 py-3 rounded font-bold flex items-center gap-2">Comprar ahora <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/servicios" className="bg-white/10 hover:bg-white/20 border border-white/30 px-6 py-3 rounded font-bold">Ver servicios</Link>
            </div>
          </div>
          <div className="relative">
            <img src={heroImg} alt="Promociones tecnología" width={1600} height={640} className="rounded-lg shadow-card-hover" />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-b">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-4 py-6 text-sm">
          {[
            { icon: Truck, t: "Envío nacional", s: "A todo Ecuador" },
            { icon: ShieldCheck, t: "Garantía oficial", s: "Productos originales" },
            { icon: CreditCard, t: "12 cuotas", s: "Sin intereses" },
            { icon: Headphones, t: "Soporte 24/7", s: "Servicio técnico" },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-3">
              <div className="h-11 w-11 rounded bg-secondary text-brand-blue grid place-items-center"><b.icon className="h-5 w-5" /></div>
              <div><div className="font-bold">{b.t}</div><div className="text-xs text-muted-foreground">{b.s}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="container-x py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-brand-blue">Categorías</h2>
            <p className="text-sm text-muted-foreground">Encuentra lo que necesitas</p>
          </div>
          <Link to="/tienda" className="text-sm font-bold text-brand-red hover:underline">Ver todas →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((c) => (
            <Link key={c.slug} to="/tienda" className="bg-white border rounded-md p-3 text-center hover:shadow-card-hover hover:border-brand-red transition-all group">
              <div className="aspect-square bg-secondary rounded mb-2 overflow-hidden">
                <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="text-xs font-semibold text-brand-blue">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* PROMO STRIP */}
      <section className="gradient-promo text-white py-8">
        <div className="container-x flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-wider opacity-80">PROMO EXCLUSIVA</div>
            <div className="text-2xl md:text-3xl font-black">Hasta 30% OFF en Laptops + Mochila gratis</div>
          </div>
          <Link to="/tienda" className="bg-white text-brand-red px-6 py-3 rounded font-bold hover:bg-brand-yellow">Ver ofertas</Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container-x py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-brand-blue">Productos destacados</h2>
            <p className="text-sm text-muted-foreground">Lo más vendido del mes</p>
          </div>
          <Link to="/tienda" className="text-sm font-bold text-brand-red hover:underline">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* OFFERS BANNER */}
      <section className="container-x py-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-brand-blue text-white rounded-lg p-8 flex items-center justify-between overflow-hidden relative">
            <div>
              <div className="text-xs font-bold opacity-80">SEGURIDAD</div>
              <h3 className="text-2xl font-black mt-1">Kits de cámaras CCTV</h3>
              <p className="text-sm opacity-80 mt-1">Instalación incluida en Guayaquil</p>
              <Link to="/tienda" className="inline-block mt-4 bg-brand-red px-5 py-2 rounded font-bold text-sm">Cotizar</Link>
            </div>
          </div>
          <div className="bg-brand-red text-white rounded-lg p-8 flex items-center justify-between overflow-hidden relative">
            <div>
              <div className="text-xs font-bold opacity-80">CORPORATIVO</div>
              <h3 className="text-2xl font-black mt-1">Soluciones empresariales</h3>
              <p className="text-sm opacity-80 mt-1">Redes, cableado y biometría</p>
              <Link to="/proyectos" className="inline-block mt-4 bg-white text-brand-red px-5 py-2 rounded font-bold text-sm">Ver proyectos</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary py-12">
        <div className="container-x">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-brand-blue">Nuestros Servicios</h2>
            <p className="text-sm text-muted-foreground">Soluciones integrales para tu hogar y empresa</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { i: Wrench, t: "Reparación PC", s: "Diagnóstico gratuito" },
              { i: Camera, t: "CCTV", s: "Instalación llave en mano" },
              { i: Cpu, t: "Cercos eléctricos", s: "Perimetrales certificados" },
              { i: Fingerprint, t: "Biometría", s: "Control de acceso" },
              { i: Cable, t: "Cableado", s: "Estructurado certificado" },
            ].map((s) => (
              <Link key={s.t} to="/servicios" className="bg-white rounded-md p-5 hover:shadow-card-hover transition-shadow text-center">
                <div className="h-12 w-12 rounded bg-brand-blue text-white grid place-items-center mx-auto mb-3"><s.i className="h-6 w-6" /></div>
                <div className="font-bold text-sm">{s.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.s}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* OFFERS */}
      <section className="container-x py-10">
        <h2 className="text-2xl md:text-3xl font-black text-brand-blue mb-6">⚡ Ofertas relámpago</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {offers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="bg-white border-y py-10">
        <div className="container-x text-center">
          <h3 className="font-bold text-brand-blue mb-6">Distribuidores autorizados</h3>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground font-bold text-xl opacity-70">
            {["HP", "Lenovo", "Dell", "Hikvision", "Dahua", "Epson", "TP-Link", "ZKTeco", "Cisco"].map((b) => (
              <span key={b} className="hover:text-brand-blue">{b}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
