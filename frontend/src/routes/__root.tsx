import { Outlet } from "react-router-dom";
import { Link } from "@/lib/router";
import { Header } from "@/components/site/Header";
import { TopBar } from "@/components/site/TopBar";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthProvider } from "@/contexts/AuthContext";

export function NotFoundPage() {
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

export function AppLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <TopBar />
        <Header />
        <main className="min-h-[60vh]"><Outlet /></main>
        <Footer />
        <WhatsAppFab />
        <CartDrawer />
      </CartProvider>
    </AuthProvider>
  );
}
