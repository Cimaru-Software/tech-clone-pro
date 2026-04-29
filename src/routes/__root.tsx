import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { TopBar } from "@/components/site/TopBar";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/site/CartDrawer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-brand-blue">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe o fue movida.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-brand-red px-4 py-2 text-sm font-bold text-white hover:bg-brand-red-dark">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "La Casa del Computador — Tecnología para tu vida | Ecuador" },
      { name: "description", content: "Tienda de computadoras, laptops, cámaras CCTV, biometría y servicios técnicos en Ecuador. Envío a todo el país, garantía oficial y soporte 24/7." },
      { name: "author", content: "La Casa del Computador" },
      { property: "og:title", content: "La Casa del Computador" },
      { property: "og:description", content: "Tecnología para tu vida — laptops, PCs, cámaras de seguridad, biometría y más." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  return (
    <CartProvider>
      <TopBar />
      <Header />
      <main className="min-h-[60vh]"><Outlet /></main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
    </CartProvider>
  );
}
