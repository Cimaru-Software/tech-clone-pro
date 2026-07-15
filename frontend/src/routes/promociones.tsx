import { Link } from "@/lib/router";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Producto } from "@/types/product";
import { ShoppingCart } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function getImageUrl(producto: Producto) {
  if (producto.imagenes?.length > 0) return `${BACKEND}${producto.imagenes[0].path}`;
  return "";
}

function OfferCard({ producto }: { producto: Producto }) {
  const { add } = useCart();
  const precio = Number(producto.precio);
  const precioFinal = producto.descuento > 0 ? precio * (1 - producto.descuento / 100) : precio;

  return (
    <Link to={`/producto/${producto.id}`} className="bg-white border rounded-lg overflow-hidden hover:shadow-card-hover transition-shadow group flex flex-col">
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {getImageUrl(producto) ? (
          <img src={getImageUrl(producto)} alt={producto.nombre} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">Sin imagen</div>
        )}
        <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded z-10">-{producto.descuento}%</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] uppercase font-semibold text-brand-blue tracking-wide">{producto.marca}</div>
        <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight mt-1 flex-1 line-clamp-2">{producto.nombre}</div>
        <div className="mt-2">
          <div className="text-xs text-muted-foreground line-through">${precio.toFixed(2)}</div>
          <div className="text-lg font-black text-brand-blue">${precioFinal.toFixed(2)}</div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); if (producto.stock > 0) add(producto); }}
          disabled={producto.stock === 0}
          className="mt-3 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4" /> {producto.stock === 0 ? "Sin stock" : "Agregar"}
        </button>
      </div>
    </Link>
  );
}

export default function Promos() {
  const [bannerPromo, setBannerPromo] = useState<string | null>(null);
  const [offers, setOffers] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/api/banner-promocion`)
      .then((r) => r.json())
      .then((d) => { if (d.banner) setBannerPromo(`${BACKEND}${d.banner.path}`); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/api/productos?estado=ACTIVO&conDescuento=true`)
      .then((r) => r.json())
      .then((d) => setOffers(d.productos || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {bannerPromo ? (
        <section>
          <img src={bannerPromo} alt="Banner de promociones" className="w-full object-cover max-h-80 md:max-h-[480px]" />
        </section>
      ) : (
        <section className="gradient-promo text-white py-14">
          <div className="container-x text-center">
            <span className="bg-white/20 backdrop-blur text-xs font-bold px-3 py-1 rounded">PROMOCIONES</span>
            <h1 className="text-4xl md:text-6xl font-black mt-3">¡Aprovecha las promociones!</h1>
            <p className="mt-3 opacity-90 text-lg">Solo por tiempo limitado</p>
          </div>
        </section>
      )}

      <section className="container-x py-10">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Cargando promociones...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏷️</div>
            <p className="font-semibold text-foreground">No hay promociones activas por el momento.</p>
            <Link to="/tienda" className="inline-block mt-4 bg-brand-blue text-white px-6 py-2.5 rounded font-bold hover:bg-brand-blue-dark">Ver todos los productos</Link>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-brand-blue">Ofertas activas</h2>
                <p className="text-sm text-muted-foreground">{offers.length} producto{offers.length !== 1 ? "s" : ""} en promoción</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {offers.map((p) => <OfferCard key={p.id} producto={p} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
