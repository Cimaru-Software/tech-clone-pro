import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, User, MapPin, Menu, MessageCircle, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { categories } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { count, setOpen } = useCart();
  const { cliente, isAuthenticated, logout } = useAuth();
  const [q, setQ] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/tienda", search: { q } as any });
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* main row */}
      <div className="bg-white text-foreground border-b">
        <div className="container-x flex items-center gap-4 h-20">
          <button className="md:hidden p-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menú">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="flex items-center shrink-0" aria-label="LA CASA DEL COMPUTADOR">
            <img
              src="/images/logo.png"
              alt="LA CASA DEL COMPUTADOR"
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          <form onSubmit={onSearch} className="flex-1 max-w-2xl mx-auto">
            <div className="flex bg-white rounded-lg overflow-hidden border border-slate-300 shadow-sm focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15 transition">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="¿Qué estás buscando? Laptops, cámaras, impresoras..."
                className="flex-1 px-4 py-2.5 text-sm text-foreground outline-none"
              />
              <button className="bg-brand-red hover:bg-brand-red-dark px-5 grid place-items-center transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="hidden lg:flex items-center gap-1 text-xs">
            <MapPin className="h-4 w-4 text-brand-yellow" />
            <div className="leading-tight">
              <div className="opacity-80">Envío a</div>
              <div className="font-semibold">Guayaquil</div>
            </div>
          </div>

          {isAuthenticated && cliente ? (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/mi-cuenta" className="flex items-center gap-2 hover:text-brand-yellow">
                <User className="h-5 w-5" />
                <div className="leading-tight text-left">
                  <div className="text-[10px] opacity-80">Bienvenido</div>
                  <div className="font-semibold">{cliente.nombre}</div>
                </div>
              </Link>
              <button onClick={handleLogout} className="hover:text-brand-red" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/login" className="flex items-center gap-2 hover:text-brand-yellow">
                <User className="h-5 w-5" />
                <div className="leading-tight text-left">
                  <div className="text-[10px] opacity-80">Hola, ingresa</div>
                  <div className="font-semibold">Mi cuenta</div>
                </div>
              </Link>
              <Link to="/registro" className="text-xs text-brand-red font-semibold hover:underline">Registro</Link>
            </div>
          )}

          <button onClick={() => setOpen(true)} className="relative flex items-center gap-2 hover:text-brand-yellow">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 grid place-items-center">{count}</span>
              )}
            </div>
            <span className="hidden md:inline text-sm font-semibold">Carrito</span>
          </button>
        </div>
      </div>

      {/* nav row */}
      <div className="bg-white border-b">
        <div className="container-x flex items-center h-12 gap-1">
          <div className="relative">
            <button
              onClick={() => setMegaOpen((v) => !v)}
              onMouseEnter={() => setMegaOpen(true)}
              className="bg-brand-red text-white font-bold text-sm px-4 h-12 flex items-center gap-2 hover:bg-brand-red-dark"
            >
              <Menu className="h-4 w-4" /> CATEGORÍAS <ChevronDown className="h-3 w-3" />
            </button>
            {megaOpen && (
              <div
                onMouseLeave={() => setMegaOpen(false)}
                className="absolute left-0 top-full bg-white border shadow-card-hover w-72 z-50"
              >
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/tienda"
                    search={{ cat: c.slug } as any}
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary hover:text-brand-red border-b last:border-0"
                  >
                    {c.name}
                    <ChevronDown className="h-3 w-3 -rotate-90" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-1 ml-2 text-sm font-medium">
            {[
              { to: "/", label: "Inicio" },
              { to: "/tienda", label: "Tienda" },
              { to: "/servicios", label: "Servicios" },
              { to: "/promociones", label: "Promociones" },
              { to: "/proyectos", label: "Proyectos" },
              { to: "/nosotros", label: "Nosotros" },
              { to: "/contacto", label: "Contacto" },
            ].map((l) => (
              <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-brand-red" }}
                className="px-3 py-2 hover:text-brand-red">
                {l.label}
              </Link>
            ))}
          </nav>

          <a href="https://wa.me/593999999999" target="_blank" rel="noreferrer"
            className="ml-auto hidden md:flex items-center gap-2 bg-whatsapp text-white px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b">
          <nav className="container-x py-2 flex flex-col">
            {[
              { to: "/", label: "Inicio" },
              { to: "/tienda", label: "Tienda" },
              { to: "/servicios", label: "Servicios" },
              { to: "/promociones", label: "Promociones" },
              { to: "/proyectos", label: "Proyectos" },
              { to: "/nosotros", label: "Nosotros" },
              { to: "/contacto", label: "Contacto" },
            ].map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="py-2 border-b text-sm">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
