import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { products, categories, brands } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { ChevronRight, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tienda — Laptops, PCs, CCTV y más | La Casa del Computador" },
      { name: "description", content: "Compra computadoras Ecuador, laptops, cámaras de seguridad, biometría y más con envío y garantía. Pago en cuotas sin intereses." },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const [cat, setCat] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sort, setSort] = useState("relevance");

  const filtered = useMemo(() => {
    let r = products.filter((p) => p.price <= maxPrice);
    if (cat) r = r.filter((p) => p.category === cat);
    if (selectedBrands.length) r = r.filter((p) => selectedBrands.includes(p.brand));
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [cat, selectedBrands, maxPrice, sort]);

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
            <h3 className="font-bold text-brand-blue mb-3 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Categorías</h3>
            <ul className="space-y-1 text-sm">
              <li><button onClick={() => setCat(null)} className={`w-full text-left px-2 py-1.5 rounded hover:bg-secondary ${!cat ? "text-brand-red font-bold" : ""}`}>Todas</button></li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <button onClick={() => setCat(c.slug)} className={`w-full text-left px-2 py-1.5 rounded hover:bg-secondary ${cat === c.slug ? "text-brand-red font-bold" : ""}`}>{c.name}</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-bold text-brand-blue mb-3">Precio máximo</h3>
            <input type="range" min={50} max={2000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-brand-red" />
            <div className="text-sm font-semibold mt-1">Hasta ${maxPrice}</div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-bold text-brand-blue mb-3">Marcas</h3>
            <ul className="space-y-1.5 text-sm max-h-56 overflow-auto">
              {brands.map((b) => (
                <li key={b}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-brand-red" />
                    {b}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-blue text-white rounded p-4 text-sm">
            <div className="font-bold mb-1">¿Necesitas asesoría?</div>
            <p className="text-xs opacity-80 mb-3">Nuestros expertos te ayudan a elegir.</p>
            <a href="https://wa.me/593999999999" target="_blank" rel="noreferrer" className="block bg-whatsapp text-center py-2 rounded font-bold">WhatsApp</a>
          </div>
        </aside>

        {/* GRID */}
        <div>
          <div className="bg-white rounded-md p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm"><span className="font-bold">{filtered.length}</span> productos encontrados</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Ordenar:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-md p-12 text-center text-muted-foreground">No se encontraron productos con los filtros seleccionados.</div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              {[1,2,3,4].map((n) => (
                <button key={n} className={`h-9 w-9 rounded text-sm font-semibold ${n === 1 ? "bg-brand-red text-white" : "bg-white border hover:border-brand-red"}`}>{n}</button>
              ))}
              <button className="h-9 px-3 rounded bg-white border text-sm hover:border-brand-red">Siguiente →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
