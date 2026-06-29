import { Link, useParams } from "@/lib/router";
import { useEffect, useState } from "react";
import { Calendar, ArrowLeft } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  portada: string;
  cuerpo: string;
  createdAt: string;
}

export default function NoticiaDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BACKEND}/api/noticias/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d?.noticia) setNoticia(d.noticia); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container-x py-20 text-center text-muted-foreground">Cargando noticia...</div>
    );
  }

  if (notFound || !noticia) {
    return (
      <div className="container-x py-20 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-2xl font-black text-brand-blue">Noticia no encontrada</h2>
        <Link to="/noticias" className="inline-flex items-center gap-2 mt-6 bg-brand-red text-white px-5 py-2.5 rounded font-bold hover:bg-brand-red-dark">
          <ArrowLeft className="h-4 w-4" /> Ver todas las noticias
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Portada */}
      <div className="w-full max-h-[480px] overflow-hidden">
        <img
          src={`${BACKEND}${noticia.portada}`}
          alt={noticia.titulo}
          className="w-full h-full object-cover max-h-[480px]"
        />
      </div>

      <div className="container-x py-10">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link to="/noticias" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-red mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Todas las noticias
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            {new Date(noticia.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-black text-brand-blue leading-tight mb-8">{noticia.titulo}</h1>

          {/* Cuerpo HTML */}
          <div
            className="noticia-body prose-content"
            dangerouslySetInnerHTML={{ __html: noticia.cuerpo }}
          />
        </div>
      </div>

      <style>{`
        .noticia-body h1 { font-size:2rem;font-weight:800;margin:1.5rem 0 0.75rem;color:#0B2C5F;line-height:1.2 }
        .noticia-body h2 { font-size:1.5rem;font-weight:700;margin:1.25rem 0 0.6rem;color:#0B2C5F }
        .noticia-body h3 { font-size:1.2rem;font-weight:700;margin:1rem 0 0.5rem;color:#0B2C5F }
        .noticia-body p { margin:0.75rem 0;line-height:1.8;color:#374151 }
        .noticia-body ul { list-style:disc;padding-left:1.75rem;margin:0.75rem 0 }
        .noticia-body ol { list-style:decimal;padding-left:1.75rem;margin:0.75rem 0 }
        .noticia-body li { margin:0.3rem 0;color:#374151 }
        .noticia-body blockquote { border-left:4px solid #D71920;padding-left:1.25rem;margin:1.25rem 0;color:#6b7280;font-style:italic;font-size:1.05rem }
        .noticia-body pre { background:#1e293b;color:#e2e8f0;padding:1.25rem;border-radius:10px;overflow-x:auto;font-size:0.875rem;margin:1rem 0 }
        .noticia-body code { background:#f1f5f9;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.875em;color:#0B2C5F }
        .noticia-body pre code { background:none;color:inherit;padding:0 }
        .noticia-body img { max-width:100%;border-radius:10px;margin:1.25rem auto;display:block;box-shadow:0 4px 16px rgba(0,0,0,0.1) }
        .noticia-body hr { border:none;border-top:2px solid #e2e8f0;margin:2rem 0 }
        .noticia-body a { color:#D71920;text-decoration:underline;font-weight:500 }
        .noticia-body a:hover { color:#0B2C5F }
        .noticia-body strong { font-weight:700;color:#111827 }
        .noticia-body em { font-style:italic }
        .noticia-body u { text-decoration:underline }
        .noticia-body s { text-decoration:line-through }
        .noticia-body mark { background:#fef08a;padding:0.1rem 0.2rem;border-radius:3px }
        .noticia-body [data-image-row] { display:flex;flex-wrap:wrap;gap:8px;margin:1.25rem 0 }
        .noticia-body [data-image-row] img { border-radius:8px;max-width:100%;display:inline-block;vertical-align:top;margin:0;box-shadow:none }
        .noticia-body [data-image-grid] { display:grid;gap:8px;margin:1.25rem 0 }
        .noticia-body [data-image-grid][data-cols="2"] { grid-template-columns:repeat(2,1fr) }
        .noticia-body [data-image-grid][data-cols="3"] { grid-template-columns:repeat(3,1fr) }
        .noticia-body [data-image-grid][data-cols="4"] { grid-template-columns:repeat(4,1fr) }
        .noticia-body [data-image-grid] div { aspect-ratio:4/3;border-radius:8px;overflow:hidden }
        .noticia-body [data-image-grid] img { width:100%;height:100%;object-fit:cover;margin:0;border-radius:0;box-shadow:none }
        @media(max-width:640px){
          .noticia-body [data-image-grid][data-cols="3"],
          .noticia-body [data-image-grid][data-cols="4"] { grid-template-columns:repeat(2,1fr) }
        }
      `}</style>
    </div>
  );
}
