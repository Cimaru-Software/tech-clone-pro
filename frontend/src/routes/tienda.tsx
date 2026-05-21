import { Link, useNavigate, useSearchParams } from "@/lib/router";
import { useEffect, useState, useMemo } from "react";
import { ChevronRight, ChevronDown, SlidersHorizontal, Search, ShoppingCart, X } from "lucide-react";
import type { Producto, Categoria } from "@/types/product";
import { useCart } from "@/context/CartContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function getImageUrl(producto: Producto): string {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return `${BACKEND}${producto.imagenes[0].path}`;
  }
  return "";
}

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

interface CategoryFilterProps {
  categorias: Categoria[];
  selectedCat: string | null;
  selectedSub: string | null;
  onSelectCat: (slug: string | null) => void;
  onSelectSub: (slug: string | null) => void;
  onClose?: () => void;
}

function CategoryFilter({ categorias, selectedCat, selectedSub, onSelectCat, onSelectSub, onClose }: CategoryFilterProps) {
  const [openCats, setOpenCats] = useState<Set<string>>(() => {
    if (selectedCat) return new Set([selectedCat]);
    return new Set();
  });

  const toggleCat = (slug: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleCatClick = (slug: string) => {
    if (selectedCat === slug && !selectedSub) {
      onSelectCat(null);
      onSelectSub(null);
    } else {
      onSelectCat(slug);
      onSelectSub(null);
      toggleCat(slug);
    }
    onClose?.();
  };

  const handleSubClick = (catSlug: string, subSlug: string) => {
    onSelectCat(catSlug);
    if (selectedSub === subSlug) {
      onSelectSub(null);
    } else {
      onSelectSub(subSlug);
    }
    onClose?.();
  };

  return (
    <ul className="space-y-0.5 text-sm">
      <li>
        <button
          onClick={() => { onSelectCat(null); onSelectSub(null); onClose?.(); }}
          className={`w-full text-left px-2 py-1.5 rounded hover:bg-secondary transition-colors ${!selectedCat ? "text-brand-red font-bold" : ""}`}
        >
          Todas las categorías
        </button>
      </li>
      {categorias.map((c) => {
        const hasSubs = c.subcategorias && c.subcategorias.length > 0;
        const isOpen = openCats.has(c.slug);
        const isCatActive = selectedCat === c.slug;

        return (
          <li key={c.slug}>
            <div className="flex items-center">
              <button
                onClick={() => handleCatClick(c.slug)}
                className={`flex-1 text-left px-2 py-1.5 rounded-l hover:bg-secondary transition-colors font-semibold ${isCatActive && !selectedSub ? "text-brand-red" : "text-foreground"}`}
              >
                {c.nombre}
              </button>
              {hasSubs && (
                <button
                  onClick={() => toggleCat(c.slug)}
                  className="px-1.5 py-1.5 rounded-r hover:bg-secondary transition-colors text-muted-foreground"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            {hasSubs && isOpen && (
              <ul className="ml-3 border-l border-border pl-2 space-y-0.5 mt-0.5 mb-1">
                {c.subcategorias!.map((sub) => (
                  <li key={sub.slug}>
                    <button
                      onClick={() => handleSubClick(c.slug, sub.slug)}
                      className={`w-full text-left px-2 py-1 rounded hover:bg-secondary transition-colors text-xs ${selectedSub === sub.slug ? "text-brand-red font-bold" : "text-muted-foreground"}`}
                    >
                      {sub.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Tienda() {
  const [searchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState<string | null>(() => searchParams.get("cat"));
  const [selectedSub, setSelectedSub] = useState<string | null>(() => searchParams.get("sub"));
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sort, setSort] = useState("relevance");
  const [search, setSearch] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  useEffect(() => {
    let active = true;

    async function loadStore() {
      setIsLoading(true);
      try {
        const [productosRes, categoriasRes] = await Promise.all([
          fetch(`${BACKEND}/api/productos?estado=ACTIVO`),
          fetch(`${BACKEND}/api/categorias`),
        ]);
        const productosData = await productosRes.json();
        const categoriasData = await categoriasRes.json();
        if (!active) return;
        setProductos(productosData.productos || []);
        setCategorias(categoriasData.categorias || []);
      } catch {
        if (!active) return;
        setProductos([]);
        setCategorias([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadStore();
    return () => { active = false; };
  }, []);

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
    if (selectedSub) {
      r = r.filter((p) => p.subcategoria?.slug === selectedSub);
    } else if (selectedCat) {
      r = r.filter((p) => p.categoria?.slug === selectedCat);
    }
    if (selectedBrands.length) r = r.filter((p) => selectedBrands.includes(p.marca));
    if (search.trim()) r = r.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase()));
    if (sort === "price-asc") r = [...r].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (sort === "price-desc") r = [...r].sort((a, b) => Number(b.precio) - Number(a.precio));
    if (sort === "descuento") r = [...r].sort((a, b) => b.descuento - a.descuento);
    return r;
  }, [productos, selectedCat, selectedSub, selectedBrands, maxPrice, sort, search]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedCat, selectedSub, selectedBrands, maxPrice, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page, PAGE_SIZE]
  );

  const toggleBrand = (b: string) =>
    setSelectedBrands((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]);

  const activeLabel = useMemo(() => {
    if (selectedSub) {
      for (const c of categorias) {
        const sub = c.subcategorias?.find((s) => s.slug === selectedSub);
        if (sub) return `${c.nombre} › ${sub.nombre}`;
      }
    }
    if (selectedCat) {
      return categorias.find((c) => c.slug === selectedCat)?.nombre ?? null;
    }
    return null;
  }, [selectedCat, selectedSub, categorias]);

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-brand-blue mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Categorías
        </h3>
        <CategoryFilter
          categorias={categorias}
          selectedCat={selectedCat}
          selectedSub={selectedSub}
          onSelectCat={setSelectedCat}
          onSelectSub={setSelectedSub}
          onClose={onClose}
        />
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
    </div>
  );

  return (
    <div className="bg-secondary min-h-screen">
      <div className="bg-white border-b">
        <div className="container-x py-3 text-xs flex items-center gap-1 text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-brand-red">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Tienda</span>
          {activeLabel && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{activeLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="container-x py-6 grid lg:grid-cols-[260px_1fr] gap-6">

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 bg-white border rounded-md px-4 py-2.5 text-sm font-semibold hover:border-brand-blue transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtros
            {activeLabel && <span className="bg-brand-red text-white text-[10px] px-1.5 py-0.5 rounded">{activeLabel}</span>}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-[85vw] max-w-xs bg-white shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
                <span className="font-bold text-brand-blue flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filtros</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-secondary"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4">
                <SidebarContent onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR – desktop */}
        <aside className="hidden lg:block bg-white rounded-md p-4 h-fit lg:sticky lg:top-32 max-h-[calc(100vh-9rem)] overflow-y-auto">
          <SidebarContent />
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
            {activeLabel && (
              <button
                onClick={() => { setSelectedCat(null); setSelectedSub(null); }}
                className="flex items-center gap-1 bg-brand-blue/10 text-brand-blue text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-blue/20 transition-colors"
              >
                {activeLabel} <X className="h-3 w-3" />
              </button>
            )}
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="font-bold text-foreground">{filtered.length}</span> productos
              {totalPages > 1 && <span className="ml-1">· pág. {page}/{totalPages}</span>}
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
              {paginatedProducts.map((p) => <ProductCardBackend key={p.id} producto={p} />)}
            </div>
          )}

          {/* Paginador */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-md border text-sm font-semibold disabled:opacity-30 hover:bg-secondary transition-colors"
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border text-sm font-semibold disabled:opacity-30 hover:bg-secondary transition-colors"
              >‹</button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const num = start + i;
                return num <= totalPages ? (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-semibold transition-colors ${num === page ? "bg-brand-blue text-white border-brand-blue" : "hover:bg-secondary"}`}
                  >{num}</button>
                ) : null;
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md border text-sm font-semibold disabled:opacity-30 hover:bg-secondary transition-colors"
              >›</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 rounded-md border text-sm font-semibold disabled:opacity-30 hover:bg-secondary transition-colors"
              >»</button>
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
