import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, ChevronLeft, ShoppingCart, Tag, Layers } from "lucide-react";
import type { Producto } from "@/types/product";
import { useCart } from "@/context/CartContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const Route = createFileRoute("/producto/$id")({
  component: ProductoDetalle,
});

function ProductoDetalle() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: producto, isLoading, isError } = useQuery<Producto>({
    queryKey: ["producto", id],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/productos/${id}`);
      if (!res.ok) throw new Error("Producto no encontrado");
      const data = await res.json();
      return data.producto;
    },
  });

  if (isLoading) {
    return (
      <div className="container-x py-10">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-secondary rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 bg-secondary rounded w-1/4" />
            <div className="h-7 bg-secondary rounded w-3/4" />
            <div className="h-7 bg-secondary rounded w-1/2" />
            <div className="h-10 bg-secondary rounded w-1/3" />
            <div className="h-12 bg-secondary rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="container-x py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2">Producto no encontrado</h2>
        <Link to="/tienda" className="text-brand-red hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  const imagenes = producto.imagenes || [];
  const hasImages = imagenes.length > 0;
  const precio = Number(producto.precio);
  const precioFinal = producto.descuento > 0 ? precio * (1 - producto.descuento / 100) : precio;

  function prev() { setImgIdx((i) => (i === 0 ? imagenes.length - 1 : i - 1)); }
  function next() { setImgIdx((i) => (i === imagenes.length - 1 ? 0 : i + 1)); }

  function handleAdd() {
    add(producto, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="bg-secondary min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-x py-3 text-xs flex items-center gap-1 text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-brand-red">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/tienda" className="hover:text-brand-red">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          {producto.categoria && (
            <>
              <span className="hover:text-brand-red cursor-pointer">{producto.categoria.nombre}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">{producto.nombre}</span>
        </div>
      </div>

      <div className="container-x py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
          {/* IMAGE GALLERY */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative bg-white rounded-xl aspect-square overflow-hidden border shadow-sm">
              {producto.descuento > 0 && (
                <span className="absolute top-4 left-4 z-10 bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded">
                  -{producto.descuento}%
                </span>
              )}
              {hasImages ? (
                <img
                  src={`${BACKEND}${imagenes[imgIdx].path}`}
                  alt={producto.nombre}
                  className="w-full h-full object-contain p-6 transition-opacity duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-muted-foreground/20">📷</div>
              )}
              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 hover:bg-white shadow rounded-full flex items-center justify-center border transition-all hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 hover:bg-white shadow rounded-full flex items-center justify-center border transition-all hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imagenes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`h-2 rounded-full transition-all ${i === imgIdx ? "w-6 bg-brand-red" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagenes.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImgIdx(i)}
                    className={`shrink-0 h-16 w-16 rounded-lg border-2 overflow-hidden bg-white transition-all ${i === imgIdx ? "border-brand-red shadow-sm" : "border-transparent hover:border-gray-300"}`}
                  >
                    <img src={`${BACKEND}${img.path}`} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="flex flex-col">
            {/* Brand + category badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded">{producto.marca}</span>
              {producto.categoria && (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded">{producto.categoria.nombre}</span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">{producto.nombre}</h1>

            {/* Price */}
            <div className="mt-5 pb-5 border-b">
              {producto.descuento > 0 && (
                <div className="text-sm text-muted-foreground line-through">${precio.toFixed(2)}</div>
              )}
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-brand-blue">${precioFinal.toFixed(2)}</span>
                {producto.descuento > 0 && (
                  <span className="text-sm font-bold text-green-600 mb-1">Ahorras ${(precio - precioFinal).toFixed(2)}</span>
                )}
              </div>
              <div className="text-sm text-success font-medium mt-1">12 cuotas de ${(precioFinal / 12).toFixed(2)} sin intereses</div>
            </div>

            {/* Description */}
            <div className="mt-5 pb-5 border-b">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" /> Descripción
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{producto.descripcion}</p>
            </div>

            {/* Meta info */}
            <div className="mt-4 pb-4 border-b text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                <span>Marca: <span className="font-semibold text-foreground">{producto.marca}</span></span>
              </div>
            </div>

            {/* Add to cart */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold">Cantidad:</label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors text-lg font-bold"
                  >−</button>
                  <span className="h-10 w-12 flex items-center justify-center text-sm font-bold border-x">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(producto.stock, q + 1))}
                    className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors text-lg font-bold"
                    disabled={qty >= producto.stock}
                  >+</button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={producto.estado !== "ACTIVO" || producto.stock === 0}
                className={`w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  added
                    ? "bg-green-600 text-white"
                    : producto.estado === "ACTIVO" && producto.stock > 0
                    ? "bg-brand-red hover:bg-brand-red-dark text-white shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {added ? "✓ Agregado al carrito" : producto.stock === 0 ? "Sin stock" : "Agregar al carrito"}
              </button>

              <a
                href="https://wa.me/593999999999"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
              >
                <span>💬</span> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
