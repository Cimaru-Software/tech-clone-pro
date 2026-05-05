import { Link } from "@/lib/router";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-blue-dark text-white mt-16">
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="inline-flex mb-4" aria-label="LA CASA DEL COMPUTADOR">
            <img
              src="/images/logo.png"
              alt="LA CASA DEL COMPUTADOR"
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-white/70 mb-4">Tecnología para tu vida. Más de 15 años brindando soluciones tecnológicas a empresas y hogares en Ecuador.</p>
          <div className="flex gap-3">
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="#"><Facebook className="h-4 w-4" /></a>
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="#"><Instagram className="h-4 w-4" /></a>
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="#"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Empresa</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/nosotros" className="hover:text-brand-yellow">Nosotros</Link></li>
            <li><Link to="/servicios" className="hover:text-brand-yellow">Servicios</Link></li>
            <li><Link to="/proyectos" className="hover:text-brand-yellow">Proyectos</Link></li>
            <li><Link to="/contacto" className="hover:text-brand-yellow">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Categorías</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/tienda" className="hover:text-brand-yellow">Laptops</Link></li>
            <li><Link to="/tienda" className="hover:text-brand-yellow">Computadoras</Link></li>
            <li><Link to="/tienda" className="hover:text-brand-yellow">Cámaras CCTV</Link></li>
            <li><Link to="/tienda" className="hover:text-brand-yellow">Biometría</Link></li>
            <li><Link to="/tienda" className="hover:text-brand-yellow">Redes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Contacto</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-yellow" /> Av. 9 de Octubre 1234, Guayaquil</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-yellow" /> (04) 222-3333</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-yellow" /> ventas@lacasadelcomputador.ec</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-4 text-xs text-white/60 flex flex-col md:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} La Casa del Computador. Todos los derechos reservados.</span>
          <span>Términos y condiciones · Política de privacidad · Garantías</span>
        </div>
      </div>
    </footer>
  );
}
