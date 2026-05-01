import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SlidersHorizontal, Search, ShoppingCart } from "lucide-react";
import type { Producto, Categoria } from "@/types/product";
import { useCart } from "@/context/CartContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function getImageUrl(producto: Producto): string {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return `${BACKEND}${producto.imagenes[0].path}`;
  }
  return "";
}

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tienda — Laptops, PCs, CCTV y más | La Casa del Computador" },
      { name: "description", content: "Compra computadoras Ecuador, laptops, cámaras de seguridad, biometría y más con envío y garantía." },
    ],
  }),
  component: Tienda,
});

function ProductCardBackend({ producto }: { producto: Producto }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const precio = Number(producto.precio);
  const precioFinal = producto.descuento > 0 ? precio * (1 - producto.descuento / 100) : precio;
  const imgUrl = getImageUrl(producto);

  return (
    <div
      className="group bg-white border rounded-md overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow cursor-pointer"
      onClick={() => navigate({ to: "/producto/$id", params: { id: producto.id } })}
    >
      <div className="relative aspect-square bg-secondary p-4">
        {producto.descuento > 0 && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded z-10">
            -{producto.descuento}%
          </span>
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
          {producto.descuento > 0 && (
            <div className="text-xs text-muted-foreground line-through">${precio.toFixed(2)}</div>
          )}
          <div className="text-xl font-black text-brand-blue">${precioFinal.toFixed(2)}</div>
          <div className="text-[11px] text-success font-medium">12 cuotas de ${(precioFinal / 12).toFixed(2)} sin intereses</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); add(producto); }}
          className="mt-3 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" /> Agregar
        </button>
      </div>
    </div>
  );
}

function Tienda() {
  const [cat, setCat] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sort, setSort] = useState("relevance");
  const [search, setSearch] = useState("");

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/productos?estado=ACTIVO`);
      const data = await res.json();
      return data.productos || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/categorias`);
      const data = await res.json();
      return data.categorias || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Derive unique brands from real products
  const marcasDisponibles = useMemo(() => {
    const set = new Set(productos.map((p) => p.marca));
    return Array.from(set).sort();
  }, [productos]);

  const maxPrecioReal = useMemo(() => {
    if (productos.length === 0) return 5000;
    return Math.ceil(Math.max(...productos.map((p) => Number(p.precio))) / 100) * 100;
  }, [productos]);

  const filtered = useMemo(() => {
    let r = productos.filter((p) => Number(p.precio) * (1 - p.descuento / 100) <= maxPrice);
    if (cat) r = r.filter((p) => p.categoria?.slug === cat);
    if (selectedBrands.length) r = r.filter((p) => selectedBrands.includes(p.marca));
    if (search.trim()) r = r.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase()));
    if (sort === "price-asc") r = [...r].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (sort === "price-desc") r = [...r].sort((a, b) => Number(b.precio) - Number(a.precio));
    if (sort === "descuento") r = [...r].sort((a, b) => b.descuento - a.descuento);
    return r;
  }, [productos, cat, selectedBrands, maxPrice, sort, search]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]);

  return (
    <div className="bg-secondary min-h-screen">
      <div className="bg-white border-b">
        <div className="container-x py-3 text-xs flex items-center gap-1 text-muted-foreground">
          <Link to="/" className="hover:text-brand-red">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Tienda</span>
        </div>
      </div>

      <div className="container-x py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="bg-white rounded-md p-4 h-fit lg:sticky lg:top-32 space-y-5">
          <div>
            <h3 className="font-bold text-brand-blue mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Categorías
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <button onClick={() => setCat(null)} className={`w-full text-left px-2 py-1.5 rounded hover:bg-secondary ${!cat ? "text-brand-red font-bold" : ""}`}>
                  Todas
                </button>
              </li>
              {categorias.map((c) => (
                <li key={c.slug}>
                  <button onClick={() => setCat(c.slug)} className={`w-full text-left px-2 py-1.5 rounded hover:bg-secondary ${cat === c.slug ? "text-brand-red font-bold" : ""}`}>
                    {c.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-brand-blue mb-3">Precio máximo</h3>
            <input
              type="range" min={50} max={maxPrecioReal} step={50}
              value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-red"
            />
            <div className="text-sm font-semibold mt-1">Hasta ${maxPrice.toLocaleString()}</div>
          </div>

          {marcasDisponibles.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-brand-blue mb-3">Marcas</h3>
              <ul className="space-y-1.5 text-sm max-h-56 overflow-auto">
                {marcasDisponibles.map((b) => (
                  <li key={b}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-brand-red" />
                      {b}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-brand-blue text-white rounded p-4 text-sm">
            <div className="font-bold mb-1">¿Necesitas asesoría?</div>
            <p className="text-xs opacity-80 mb-3">Nuestros expertos te ayudan a elegir.</p>
            <a href="https://wa.me/593999999999" target="_blank" rel="noreferrer" className="block bg-whatsapp text-center py-2 rounded font-bold">WhatsApp</a>
          </div>
        </aside>

        {/* GRID */}
        <div>
          {/* Search + Sort bar */}
          <div className="bg-white rounded-md p-4 mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="font-bold text-foreground">{filtered.length}</span> productos
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Ordenar:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-3 py-1.5 text-sm outline-none">
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="descuento">Mayor descuento</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-md overflow-hidden animate-pulse">
                  <div className="aspect-square bg-secondary" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-secondary rounded w-1/3" />
                    <div className="h-4 bg-secondary rounded w-full" />
                    <div className="h-4 bg-secondary rounded w-2/3" />
                    <div className="h-8 bg-secondary rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((p) => <ProductCardBackend key={p.id} producto={p} />)}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="bg-white rounded-md p-12 text-center text-muted-foreground">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold">No se encontraron productos</div>
              <div className="text-sm mt-1">Intenta con otros filtros o términos de búsqueda</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
