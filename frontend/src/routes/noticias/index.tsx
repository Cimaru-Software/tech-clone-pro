import { Link } from "@/lib/router";
import { useEffect, useState } from "react";
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const PER_PAGE = 12; // 3 cols × 4 rows

interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  portada: string;
  createdAt: string;
}

function NoticiaCard({ n }: { n: Noticia }) {
  return (
    <Link to={`/noticias/${n.slug}`} className="group bg-white border rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col">
      <div className="aspect-[16/9] overflow-hidden bg-secondary">
        <img
          src={`${BACKEND}${n.portada}`}
          alt={n.titulo}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(n.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
        </div>
        <h3 className="font-bold text-brand-blue leading-snug line-clamp-3 flex-1 group-hover:text-brand-red transition-colors">{n.titulo}</h3>
        <span className="inline-flex items-center gap-1 mt-3 text-brand-red font-bold text-sm">
          Leer más <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function Noticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/api/noticias?page=${page}&limit=${PER_PAGE}`)
      .then((r) => r.json())
      .then((d) => {
        setNoticias(d.noticias || []);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      })
      .catch(() => setNoticias([]))
      .finally(() => setLoading(false));
  }, [page]);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">BLOG & NOTICIAS</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Tecnología con Propósito</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">Descubre cómo conectamos la tecnología con las personas a través de iniciativas que inspiran, alianzas que impulsan y experiencias que generan impacto</p>
        </div>
      </section>

      <section className="container-x py-10">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando noticias...</div>
        ) : noticias.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📰</div>
            <p className="font-semibold text-lg text-foreground">Próximamente publicaremos noticias</p>
            <p className="text-muted-foreground text-sm mt-1">Vuelve pronto para ver novedades.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">{total} artículo{total !== 1 ? "s" : ""}</p>
            </div>

            {/* Grid 3 cols × max 4 rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n) => <NoticiaCard key={n.id} n={n} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="h-9 w-9 rounded-lg border grid place-items-center hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    className={`h-9 w-9 rounded-lg border text-sm font-bold transition-colors ${p === page ? "bg-brand-blue text-white border-brand-blue" : "hover:bg-secondary"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === pages}
                  className="h-9 w-9 rounded-lg border grid place-items-center hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
