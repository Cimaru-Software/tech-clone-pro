import { Link } from "@/lib/router";
import { products } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";

export default function Promos() {
  const offers = products.filter((p) => p.oldPrice);
  return (
    <div>
      <section className="gradient-promo text-white py-14">
        <div className="container-x text-center">
          <span className="bg-white/20 backdrop-blur text-xs font-bold px-3 py-1 rounded">PROMOCIONES</span>
          <h1 className="text-4xl md:text-6xl font-black mt-3">Hasta 30% OFF</h1>
          <p className="mt-3 opacity-90 text-lg">+ 12 cuotas sin intereses en toda la tienda</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {offers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-8">
          <Link to="/tienda" className="inline-block bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3 rounded font-bold">Ver todos los productos</Link>
        </div>
      </section>
    </div>
  );
}
