import { Link } from "@/lib/router";
import { useState, useEffect } from "react";
import img1 from "@/assets/projects/1.jpeg";
import img2 from "@/assets/projects/2.png";
import img3 from "@/assets/projects/3.png";
import img4 from "@/assets/projects/4.png";
import img5 from "@/assets/projects/5.png";
import img6 from "@/assets/projects/6.png";
import { ArrowRight, ClipboardList, Pencil, FileText, Wrench, ShieldCheck } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
}

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
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [googleRatingCount, setGoogleRatingCount] = useState<number | null>(null);
  const [googleReviewsError, setGoogleReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${BACKEND}/api/google-reviews`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setGoogleReviews(d.reviews || []);
        setGoogleRating(typeof d.rating === "number" ? d.rating : null);
        setGoogleRatingCount(typeof d.userRatingCount === "number" ? d.userRatingCount : null);
        setGoogleReviewsError(d.error || null);
      })
      .catch(() => {
        if (!active) return;
        setGoogleReviews([]);
        setGoogleRating(null);
        setGoogleRatingCount(null);
        setGoogleReviewsError("No se pudo conectar con Google Places.");
      });
    return () => { active = false; };
  }, []);
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
            {[
              { label: "Levantamiento", Icon: ClipboardList },
              { label: "Diseño", Icon: Pencil },
              { label: "Cotización", Icon: FileText },
              { label: "Ejecución", Icon: Wrench },
              { label: "Mantenimiento", Icon: ShieldCheck },
            ].map(({ label, Icon }, i) => (
              <div key={label} className="bg-white p-5 rounded-lg text-center relative">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <Icon className="h-14 w-14 text-brand-blue" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-red text-white text-[10px] font-black grid place-items-center leading-none">{i + 1}</span>
                </div>
                <div className="font-bold text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <section className="bg-[#f6f8fc] py-12 md:py-16">
        <div className="container-x text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
            <span className="text-lg leading-none">G</span>
            <span>Reseñas verificadas de Google</span>
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-black text-slate-900">Lo que dicen nuestros clientes</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Opiniones reales de clientes que confían en nosotros, directo desde Google Maps.
          </p>
        </div>

        <div className="container-x mt-10">
          {googleReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {googleReviews.slice(0, 4).map((review, idx) => (
                <article key={`${review.author_name}-${idx}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 text-left min-h-[260px] flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5 text-amber-400 text-base">
                      {"★★★★★".split("").map((s, i) => (
                        <span key={i}>{s}</span>
                      ))}
                    </div>
                    <span className="text-lg font-black text-slate-400">G</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700 flex-1">"{review.text}"</p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-blue text-white grid place-items-center font-bold overflow-hidden shrink-0">
                      {review.profile_photo_url ? (
                        <img src={review.profile_photo_url} alt={review.author_name} className="h-full w-full object-cover" />
                      ) : (
                        review.author_name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{review.author_name}</div>
                      <div className="text-xs text-slate-500">{review.relative_time_description}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500">
              Aún no hay reseñas disponibles.
              {googleReviewsError ? <div className="mt-2 text-xs text-rose-500">{googleReviewsError}</div> : null}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-6 text-center min-w-[280px]">
              <div className="text-xs font-bold tracking-[0.2em] text-slate-500">RESEÑAS DE GOOGLE</div>
              <div className="mt-3 flex justify-center gap-1 text-amber-400 text-2xl">★★★★★</div>
              <div className="mt-2 text-4xl font-black text-slate-900">{googleRating ? googleRating.toFixed(1) : "5.0"}</div>
              <div className="mt-2 text-sm text-slate-500">
                Basado en {googleRatingCount ?? googleReviews.length ?? 0} reseñas verificadas
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="/contacto" className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded font-bold">Iniciar tu proyecto <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
