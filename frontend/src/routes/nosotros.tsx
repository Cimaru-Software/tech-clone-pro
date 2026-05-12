import { Link } from "@/lib/router";
import { Target, Eye, Heart, Award, Users, Building2, ShieldCheck } from "lucide-react";

export default function Nosotros() {
  return (
    <div>
      <section className="gradient-hero text-white py-16">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">SOBRE NOSOTROS</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Tecnología que transforma vidas</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">Desde 2007 acompañamos a hogares y empresas con soluciones tecnológicas confiables.</p>
        </div>
      </section>

      <section className="container-x py-12 grid md:grid-cols-3 gap-5">
        {[
          { i: Target, t: "Misión", d: "Ofrecer soluciones tecnológicas de calidad, accesibles y respaldadas, mejorando la productividad y seguridad de nuestros clientes." },
          { i: Eye, t: "Visión", d: "Ser la empresa líder en tecnología y seguridad electrónica del Ecuador para 2030, reconocida por la excelencia y servicio." },
          { i: Heart, t: "Valores", d: "Integridad, innovación, compromiso, servicio al cliente y trabajo en equipo guían cada una de nuestras decisiones." },
        ].map((b) => (
          <div key={b.t} className="bg-white border rounded-lg p-7 text-center hover:shadow-card-hover transition-shadow">
            <div className="h-14 w-14 rounded-full bg-brand-red text-white grid place-items-center mx-auto mb-4"><b.i className="h-7 w-7" /></div>
            <h3 className="font-black text-xl text-brand-blue">{b.t}</h3>
            <p className="text-sm text-muted-foreground mt-2">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="bg-brand-blue text-white py-12">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { i: Building2, n: "5,000+", l: "Empresas atendidas" },
            { i: Users, n: "50,000+", l: "Clientes felices" },
            { i: Award, n: "19", l: "Años de experiencia" },
            { i: ShieldCheck, n: "100%", l: "Garantía oficial" },
          ].map((k) => (
            <div key={k.l}>
              <k.i className="h-8 w-8 mx-auto text-brand-yellow" />
              <div className="text-4xl font-black mt-2">{k.n}</div>
              <div className="text-xs uppercase opacity-80">{k.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="text-3xl font-black text-brand-blue text-center mb-2">Distribuidores autorizados</h2>
        <p className="text-center text-muted-foreground mb-8">Trabajamos con las marcas más confiables del mercado</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {["HP", "Lenovo", "Dell", "Hikvision", "Dahua", "Epson", "TP-Link", "ZKTeco", "Cisco", "Apple", "Asus", "Brother"].map((b) => (
            <div key={b} className="bg-white border rounded-lg p-6 text-center font-black text-brand-blue hover:border-brand-red transition-colors">{b}</div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-12">
        <div className="container-x text-center">
          <h2 className="text-3xl font-black text-brand-blue">¿Listo para trabajar con nosotros?</h2>
          <p className="text-muted-foreground mt-2">Contáctanos hoy y recibe una asesoría sin compromiso.</p>
          <Link to="/contacto" className="inline-block mt-5 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded font-bold">Contactar</Link>
        </div>
      </section>
    </div>
  );
}
