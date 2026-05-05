import { Link } from "@/lib/router";
import { useState } from "react";
import cctvImg from "@/assets/cat-cctv.jpg";
import netImg from "@/assets/cat-network.jpg";
import bioImg from "@/assets/cat-biometric.jpg";
import deskImg from "@/assets/cat-desktop.jpg";
import { Quote, ArrowRight } from "lucide-react";

const projects = [
  { cat: "cctv", t: "Centro Comercial Mall del Sur", d: "120 cámaras IP 4K + central de monitoreo", img: cctvImg },
  { cat: "redes", t: "Edificio Corporativo Trade Center", d: "Cableado Cat 6A · 8 pisos · 450 puntos", img: netImg },
  { cat: "biometria", t: "Hospital Clínica Kennedy", d: "Control de acceso biométrico 12 áreas", img: bioImg },
  { cat: "cctv", t: "Conjunto Residencial Los Ceibos", d: "Sistema perimetral + 32 cámaras", img: cctvImg },
  { cat: "corporativo", t: "Banco Pichincha Sucursal Norte", d: "Infraestructura TI completa", img: deskImg },
  { cat: "biometria", t: "Universidad Estatal", d: "Asistencia biométrica 800 colaboradores", img: bioImg },
];
const cats = [
  { k: "all", l: "Todos" },
  { k: "cctv", l: "CCTV" },
  { k: "redes", l: "Redes" },
  { k: "biometria", l: "Biometría" },
  { k: "corporativo", l: "Corporativo" },
];

export default function Proyectos() {
  const [tab, setTab] = useState("all");
  const list = tab === "all" ? projects : projects.filter((p) => p.cat === tab);
  return (
    <div>
      <section className="gradient-hero text-white py-16">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">CASOS DE ÉXITO</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Proyectos realizados</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">Más de 500 instalaciones a nivel nacional. Conoce nuestros principales proyectos.</p>
        </div>
      </section>

      {/* KPIs */}
      <section className="container-x py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: "500+", l: "Proyectos ejecutados" },
            { n: "15", l: "Años de experiencia" },
            { n: "98%", l: "Clientes satisfechos" },
            { n: "24/7", l: "Soporte garantizado" },
          ].map((k) => (
            <div key={k.l} className="bg-white border-t-4 border-brand-red rounded-lg p-6 text-center shadow-card">
              <div className="text-4xl font-black text-brand-blue">{k.n}</div>
              <div className="text-xs uppercase font-semibold text-muted-foreground mt-1">{k.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="container-x pb-12">
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {cats.map((c) => (
            <button key={c.k} onClick={() => setTab(c.k)} className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === c.k ? "border-brand-red text-brand-red" : "border-transparent text-muted-foreground hover:text-brand-blue"}`}>{c.l}</button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p, i) => (
            <div key={i} className="group bg-white rounded-lg overflow-hidden border hover:shadow-card-hover transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.img} alt={p.t} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-4">
                <div className="text-xs uppercase font-bold text-brand-red">{p.cat}</div>
                <h3 className="font-bold text-brand-blue mt-1">{p.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process timeline */}
      <section className="bg-secondary py-12">
        <div className="container-x">
          <h2 className="text-3xl font-black text-brand-blue text-center mb-10">Nuestro proceso</h2>
          <div className="grid md:grid-cols-5 gap-2">
            {["Levantamiento", "Diseño", "Cotización", "Ejecución", "Mantenimiento"].map((s, i) => (
              <div key={s} className="bg-white p-5 rounded-lg text-center relative">
                <div className="h-10 w-10 rounded-full bg-brand-red text-white grid place-items-center font-black mx-auto mb-2">{i + 1}</div>
                <div className="font-bold text-sm">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x py-12">
        <h2 className="text-3xl font-black text-brand-blue text-center mb-8">Lo que dicen nuestros clientes</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "Ing. María Vega", c: "Mall del Sur", q: "Implementación impecable. El equipo técnico demostró total profesionalismo." },
            { n: "Lic. Carlos Mora", c: "Clínica Kennedy", q: "El sistema biométrico ha optimizado completamente nuestro control de acceso." },
            { n: "Arq. Juan Pérez", c: "Trade Center", q: "Cableado certificado y entregado en tiempo récord. Altamente recomendados." },
          ].map((t) => (
            <div key={t.n} className="bg-white border rounded-lg p-6">
              <Quote className="h-8 w-8 text-brand-red opacity-30" />
              <p className="text-sm mt-3">{t.q}</p>
              <div className="mt-4 pt-4 border-t">
                <div className="font-bold">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.c}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/contacto" className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded font-bold">Iniciar tu proyecto <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
