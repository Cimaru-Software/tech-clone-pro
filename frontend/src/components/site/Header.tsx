import { Link, useNavigate } from "@/lib/router";
import {
  Search, ShoppingCart, User, MapPin, Menu, MessageCircle,
  ChevronDown, LogOut, LogIn, UserPlus, Package, X, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Categoria } from "@/types/product";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda" },
  { to: "/servicios", label: "Servicios" },
  { to: "/promociones", label: "Promociones" },
  { to: "/proyectos", label: "Proyectos" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/noticias", label: "Noticias" },
  { to: "/contacto", label: "Contacto" },
];

export function Header() {
  const { count, setOpen } = useCart();
  const { cliente, isAuthenticated, logout } = useAuth();
  const [q, setQ] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaActiveCat, setMegaActiveCat] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileOpenCats, setMobileOpenCats] = useState<Set<string>>(new Set());
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const navigate = useNavigate();
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/categorias`)
      .then((r) => r.json())
      .then((d) => {
        const cats: Categoria[] = d.categorias || [];
        setCategorias(cats);
        if (cats.length > 0) setMegaActiveCat(cats[0].slug);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    closeMobile();
    navigate({ to: "/" });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/tienda", search: { q } as any });
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileCatOpen(false);
  };

  const toggleMobileCat = (slug: string) => {
    setMobileOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [megaOpen]);

  const activeCatData = categorias.find((c) => c.slug === megaActiveCat);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* MAIN ROW */}
      <div className="bg-white text-foreground border-b">
        <div className="container-x flex items-center gap-3 h-16 md:h-20">

          {/* Burger button - mobile only */}
          <button
            className="md:hidden p-2 -ml-1 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="LA CASA DEL COMPUTADOR">
            <img src="/images/logo.png" alt="LA CASA DEL COMPUTADOR" className="h-10 w-auto sm:h-12 md:h-14" />
          </Link>

          {/* Search */}
          <form onSubmit={onSearch} className="flex-1 min-w-0 max-w-2xl mx-auto hidden sm:flex">
            <div className="flex w-full bg-white rounded-lg overflow-hidden border border-slate-300 shadow-sm focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15 transition">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar laptops, cámaras, impresoras..."
                className="flex-1 min-w-0 px-4 py-2.5 text-sm text-foreground outline-none"
              />
              <button className="bg-brand-red hover:bg-brand-red-dark px-5 grid place-items-center transition-colors shrink-0">
                <Search className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>

          {/* Envío – desktop only */}
          <div className="hidden lg:flex items-center gap-1 text-xs shrink-0">
            <MapPin className="h-4 w-4 text-brand-yellow" />
            <div className="leading-tight">
              <div className="opacity-80">Envío a</div>
              <div className="font-semibold">todo Ecuador</div>
            </div>
          </div>

          {/* Cart */}
          <button onClick={() => setOpen(true)} className="relative flex items-center gap-2 hover:text-brand-yellow shrink-0">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 grid place-items-center">
                  {count}
                </span>
              )}
            </div>
            <span className="hidden md:inline text-sm font-semibold">Carrito</span>
          </button>

          {/* Account – desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-brand-blue hover:bg-secondary/70 transition-colors shrink-0">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-blue/10 text-brand-blue shrink-0">
                  <User className="h-5 w-5" />
                </span>
                <span className="min-w-0 leading-tight text-left">
                  <span className="block text-[11px] text-muted-foreground">
                    {isAuthenticated && cliente ? "Bienvenido" : "Hola, ingresa"}
                  </span>
                  <span className="block max-w-[92px] truncate font-bold text-brand-blue">
                    {isAuthenticated && cliente ? cliente.nombre : "Mi cuenta"}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              {isAuthenticated && cliente ? (
                <>
                  <DropdownMenuLabel className="px-3 py-2">
                    <span className="block text-sm font-bold text-foreground">{cliente.nombre} {cliente.apellido}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{cliente.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: "/mi-cuenta" })} className="cursor-pointer rounded-md px-3 py-2.5">
                    <User className="h-4 w-4 text-brand-blue" /> Mi perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/mi-cuenta/pedidos" })} className="cursor-pointer rounded-md px-3 py-2.5">
                    <Package className="h-4 w-4 text-brand-blue" /> Mis pedidos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer rounded-md px-3 py-2.5 text-brand-red focus:text-brand-red">
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel className="px-3 py-2">
                    <span className="block text-sm font-bold text-foreground">Mi cuenta</span>
                    <span className="block text-xs font-normal text-muted-foreground">Accede para ver tus pedidos.</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: "/login" })} className="cursor-pointer rounded-md px-3 py-2.5">
                    <LogIn className="h-4 w-4 text-brand-blue" /> Iniciar sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/registro" })} className="cursor-pointer rounded-md px-3 py-2.5">
                    <UserPlus className="h-4 w-4 text-brand-red" /> Registrarse
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden border-t px-3 py-2">
          <form onSubmit={onSearch}>
            <div className="flex bg-white rounded-lg overflow-hidden border border-slate-300 shadow-sm focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15 transition">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="flex-1 min-w-0 px-3 py-2 text-sm text-foreground outline-none"
              />
              <button className="bg-brand-red hover:bg-brand-red-dark px-4 grid place-items-center transition-colors shrink-0">
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* NAV ROW – desktop */}
      <div className="hidden md:block bg-white border-b">
        <div className="container-x flex items-center h-12 gap-1">

          {/* Categorías mega-menu – dos columnas: lista + subcategorías */}
          <div className="relative" ref={megaRef}>
            <button
              onClick={() => setMegaOpen((v) => !v)}
              onMouseEnter={() => setMegaOpen(true)}
              className="bg-brand-red text-white font-bold text-sm px-4 h-12 flex items-center gap-2 hover:bg-brand-red-dark transition-colors"
            >
              <Menu className="h-4 w-4" /> CATEGORÍAS <ChevronDown className={`h-3 w-3 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
            </button>

            {megaOpen && (
              <div
                onMouseLeave={() => setMegaOpen(false)}
                className="absolute left-0 top-full bg-white border shadow-card-hover z-50 rounded-b-md overflow-hidden flex"
                style={{ minWidth: "580px" }}
              >
                {/* Columna izquierda: categorías */}
                <div className="w-56 border-r bg-slate-50 overflow-y-auto max-h-[420px]">
                  {categorias.map((c) => (
                    <button
                      key={c.slug}
                      onMouseEnter={() => setMegaActiveCat(c.slug)}
                      onClick={() => {
                        navigate({ to: "/tienda", search: { cat: c.slug } as any });
                        setMegaOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border-b last:border-0 transition-colors text-left ${
                        megaActiveCat === c.slug
                          ? "bg-brand-blue text-white font-bold"
                          : "hover:bg-secondary hover:text-brand-red"
                      }`}
                    >
                      {c.nombre}
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>

                {/* Columna derecha: subcategorías de la categoría activa */}
                <div className="flex-1 p-4 max-h-[420px] overflow-y-auto">
                  {activeCatData ? (
                    <>
                      <div className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-3 border-b pb-2">
                        {activeCatData.nombre}
                      </div>
                      {activeCatData.subcategorias && activeCatData.subcategorias.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {activeCatData.subcategorias.map((s) => (
                            <Link
                              key={s.slug}
                              to="/tienda"
                              search={{ cat: activeCatData.slug, sub: s.slug } as any}
                              onClick={() => setMegaOpen(false)}
                              className="flex items-center gap-1.5 py-1.5 text-sm text-foreground hover:text-brand-red transition-colors"
                            >
                              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              {s.nombre}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Sin subcategorías</div>
                      )}
                      <Link
                        to="/tienda"
                        search={{ cat: activeCatData.slug } as any}
                        onClick={() => setMegaOpen(false)}
                        className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-brand-red hover:underline"
                      >
                        Ver todo en {activeCatData.nombre} <ChevronRight className="h-3 w-3" />
                      </Link>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Selecciona una categoría</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-1 ml-2 text-sm font-medium">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-brand-red" }}
                className="px-3 py-2 hover:text-brand-red transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <a
            href="https://wa.me/593999999999"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-2 bg-whatsapp text-white px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobile} />

          <div className="absolute top-0 left-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 bg-brand-blue text-white shrink-0">
              <img src="/images/logo.png" alt="Logo" className="h-9 w-auto brightness-0 invert" />
              <button onClick={closeMobile} className="p-1.5 rounded-md hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Account section */}
            <div className="bg-brand-blue/5 border-b px-4 py-3 shrink-0">
              {isAuthenticated && cliente ? (
                <div>
                  <button
                    onClick={() => setMobileUserOpen((v) => !v)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-brand-blue/10 text-brand-blue grid place-items-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">{cliente.nombre} {cliente.apellido}</div>
                      <div className="text-xs text-muted-foreground truncate">{cliente.email}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${mobileUserOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileUserOpen && (
                    <div className="mt-2 ml-13 border-t pt-2 space-y-1">
                      <Link to="/mi-cuenta" onClick={closeMobile} className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors">
                        <User className="h-4 w-4 text-brand-blue" /> Mi perfil
                      </Link>
                      <Link to="/mi-cuenta/pedidos" onClick={closeMobile} className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors">
                        <Package className="h-4 w-4 text-brand-blue" /> Mis pedidos
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={closeMobile} className="flex-1 text-center bg-brand-blue text-white text-sm font-bold py-2 rounded-md">
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" onClick={closeMobile} className="flex-1 text-center border border-brand-red text-brand-red text-sm font-bold py-2 rounded-md">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Navigation links */}
              <nav className="py-2">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={closeMobile}
                    activeOptions={{ exact: l.to === "/" }}
                    activeProps={{ className: "text-brand-red font-bold bg-brand-red/5" }}
                    className="flex items-center px-4 py-3 text-sm font-medium border-b border-slate-100 hover:bg-secondary transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Categories accordion – mobile */}
              <div className="border-b">
                <button
                  onClick={() => setMobileCatOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold text-brand-red bg-brand-red/5 hover:bg-brand-red/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Menu className="h-4 w-4" /> CATEGORÍAS
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileCatOpen ? "rotate-180" : ""}`} />
                </button>

                {mobileCatOpen && (
                  <div className="bg-white">
                    {categorias.map((c) => (
                      <div key={c.slug}>
                        {/* Fila de categoría */}
                        <div className="flex items-stretch border-b border-slate-100 last:border-0">
                          <Link
                            to="/tienda"
                            search={{ cat: c.slug } as any}
                            onClick={closeMobile}
                            className="flex-1 flex items-center pl-8 pr-2 py-2.5 text-sm font-semibold hover:bg-secondary hover:text-brand-red transition-colors"
                          >
                            {c.nombre}
                          </Link>
                          {c.subcategorias && c.subcategorias.length > 0 && (
                            <button
                              onClick={() => toggleMobileCat(c.slug)}
                              className="px-3 hover:bg-secondary transition-colors text-muted-foreground"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileOpenCats.has(c.slug) ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>

                        {/* Subcategorías */}
                        {c.subcategorias && c.subcategorias.length > 0 && mobileOpenCats.has(c.slug) && (
                          <div className="bg-slate-50 border-b border-slate-100">
                            {c.subcategorias.map((s) => (
                              <Link
                                key={s.slug}
                                to="/tienda"
                                search={{ cat: c.slug, sub: s.slug } as any}
                                onClick={closeMobile}
                                className="flex items-center gap-2 pl-12 pr-4 py-2 text-sm text-muted-foreground hover:text-brand-red hover:bg-secondary transition-colors border-b border-slate-100 last:border-0"
                              >
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                {s.nombre}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div className="p-4">
                <a
                  href="https://wa.me/593999999999"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-2 bg-whatsapp text-white w-full py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4" /> Chatear por WhatsApp
                </a>
              </div>
            </div>

            {/* Logout pinned to bottom */}
            {isAuthenticated && (
              <div className="shrink-0 border-t px-4 py-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-brand-red text-sm font-medium w-full py-2 hover:underline"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
