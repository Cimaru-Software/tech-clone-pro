import { Link } from "@/lib/router";
import { useState } from "react";
import img1 from "@/assets/projects/1.jpeg";
import img2 from "@/assets/projects/2.png";
import img3 from "@/assets/projects/3.png";
import img4 from "@/assets/projects/4.png";
import img5 from "@/assets/projects/5.png";
import img6 from "@/assets/projects/6.png";
import { Quote, ArrowRight } from "lucide-react";

const projects = [
  { cat: "cctv", t: "Cámaras y paneles solares - Chocolatera (Salinas)", d: "Instalación de sistema de videovigilancia con energía renovable", img: img1, href: "https://www.facebook.com/share/r/1BGDbLW6y2/" },
  { cat: "redes", t: "Reubicación de antenas - Lab Genesis", d: "Instalación y configuración de radio enlace", img: img2, href: "https://www.facebook.com/share/r/1TUGbRpCr7/" },
  { cat: "aire", t: "Revisión y mantenimiento de A/C", d: "Revisión y mantenimiento de A/C", img: img3, href: "https://www.facebook.com/share/r/1ES6mVFCoF/" },
  { cat: "impresoras", t: "Revisión y mantenimiento de impresora", d: "Revisión y mantenimiento de impresora", img: img4, href: "https://www.instagram.com/reel/DBKCH7rPVg1/?utm_source=ig_web_copy_link" },
  { cat: "cerco", t: "Instalación y configuración de cerco eléctrico", d: "Instalación y configuración de cerco eléctrico", img: img5, href: "https://www.instagram.com/reel/DBKCH7rPVg1/?utm_source=ig_web_copy_link" },
  { cat: "cctv", t: "Instalación y configuración de cámara PTZ - Chocolatera (Salinas)", d: "Instalación y configuración de cámara PTZ", img: img6, href: "https://www.instagram.com/reel/DAZZo8-MW20/?utm_source=ig_web_copy_link" },
];
const cats = [
  { k: "all", l: "Todos" },
  { k: "cctv", l: "CCTV" },
  { k: "redes", l: "Redes" },
  { k: "aire", l: "Aire Acondicionado" },
  { k: "impresoras", l: "Impresoras" },
  { k: "cerco", l: "Cerco Eléctrico" },
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
            { n: "19", l: "Años de experiencia" },
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
            <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-lg overflow-hidden border hover:shadow-card-hover hover:border-brand-red transition-all duration-300 cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={p.img} alt={p.t} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-brand-blue/0 group-hover:bg-brand-blue/60 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2 text-white">
                    <div className="bg-brand-red rounded-full p-3">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold tracking-wide">Ver proyecto</span>
                  </div>
                </div>
              </div>
              <div className="p-4 group-hover:bg-brand-red/5 transition-colors duration-300">
                <div className="text-xs uppercase font-bold text-brand-red">{p.cat}</div>
                <h3 className="font-bold text-brand-blue mt-1 group-hover:text-brand-red transition-colors duration-300">{p.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
              </div>
            </a>
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
