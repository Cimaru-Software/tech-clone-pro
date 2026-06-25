import { Link } from "@/lib/router";
import { Facebook, Instagram, Phone, MapPin, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-blue-dark text-white mt-16">
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="inline-flex mb-4" aria-label="LA CASA DEL COMPUTADOR">
            <img
              src="/images/logo.png"
              alt="LA CASA DEL COMPUTADOR"
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <p className="text-sm text-white/70 mb-4">Tecnología para tu vida. Más de 15 años brindando soluciones tecnológicas a empresas y hogares en Ecuador.</p>
          <div className="flex gap-3">
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="https://www.facebook.com/lacasadelcomputador.se/" target="_blank" rel="noreferrer"><Facebook className="h-4 w-4" /></a>
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="https://www.instagram.com/lacasadelcomputador_se/" target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" /></a>
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="https://www.tiktok.com/@lacasadelcomputador_se?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/></svg>
            </a>
            <a className="h-9 w-9 rounded bg-white/10 hover:bg-brand-red grid place-items-center" href="https://ec.linkedin.com/company/lacasadelcomputador" target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /></a>
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
          <ul className="space-y-4 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-yellow" />
              <span>
                <span className="font-bold text-white">Sucursal Principal:</span>{" "}
                La Libertad, Av. 9 de Octubre Ignacio Guerra Esq (Edificio Ruiz,
                Cerca de Almacenes Tía y Academia Naval “Capitán Leonardo Abada
                Astrudillo”)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-yellow" />
              <span>
                <span className="font-bold text-white">Sucursal PALAU:</span>{" "}
                La Libertad, diagonal al edificio de la Judicatura en las
                antiguas oficinas de la “Agencia Palau”
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 shrink-0 text-brand-yellow" />
              <span>
                <span className="font-bold text-white">Números telefónicos.-</span>{" "}
                0989955400 / 0968716845
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-4 text-xs text-white/60 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center text-center md:text-left">
            <span>© {new Date().getFullYear()} La Casa del Computador. Todos los derechos reservados.</span>
            <span>Términos y condiciones · Política de privacidad · Garantías</span>
          </div>
          <a
            href="https://www.nivusoftware.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 self-center text-sm text-white/80 hover:text-white transition-colors"
            aria-label="Desarrollado por Nivusoftware"
          >
            <img src="/images/nube.png" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            <span>
              Desarrollado por <span className="font-semibold">Nivusoftware</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
