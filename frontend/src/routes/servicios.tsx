import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, Camera, Zap, Fingerprint, Cable, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios Técnicos — Reparación PC, CCTV, Biometría | LCDC" },
      { name: "description", content: "Servicio técnico computadoras, instalación de cámaras CCTV, cercos eléctricos, biometría y cableado estructurado en Guayaquil y todo Ecuador." },
    ],
  }),
  component: Servicios,
});

const services = [
  { i: Wrench, t: "Reparación de PC y Laptops", d: "Diagnóstico gratuito, mantenimiento preventivo y correctivo, recuperación de datos y actualización de hardware.", color: "bg-brand-blue" },
  { i: Camera, t: "Instalación de CCTV", d: "Sistemas de videovigilancia HD, IP y 4K. Diseño, instalación y configuración remota.", color: "bg-brand-red" },
  { i: Zap, t: "Cercos Eléctricos", d: "Perimetrales con central de monitoreo, certificados y con instalación profesional.", color: "bg-brand-blue" },
  { i: Fingerprint, t: "Sistemas Biométricos", d: "Control de acceso por huella, rostro y RFID. Integración con software de asistencia.", color: "bg-brand-red" },
  { i: Cable, t: "Cableado Estructurado", d: "Redes de datos certificadas Cat 6 / 6A, fibra óptica, racks y switches administrables.", color: "bg-brand-blue" },
  { i: ShieldCheck, t: "Soporte Corporativo", d: "Mantenimiento de TI para empresas, soporte remoto y on-site con SLA garantizado.", color: "bg-brand-red" },
];

function Servicios() {
  return (
    <div>
      <section className="gradient-hero text-white py-16">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">SERVICIOS PROFESIONALES</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Soluciones tecnológicas integrales</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">Más de 15 años brindando servicios técnicos certificados a hogares y empresas.</p>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.t} className="bg-white border rounded-lg p-6 hover:shadow-card-hover transition-shadow">
              <div className={`h-14 w-14 rounded ${s.color} text-white grid place-items-center mb-4`}><s.i className="h-7 w-7" /></div>
              <h3 className="font-bold text-lg text-brand-blue">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
              <Link to="/contacto" className="inline-flex items-center gap-1 mt-4 text-brand-red font-bold text-sm hover:underline">Solicitar cotización <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-secondary py-12">
        <div className="container-x">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-brand-blue">Nuestro proceso</h2>
            <p className="text-muted-foreground">Trabajamos con metodología certificada</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Diagnóstico", d: "Evaluación gratuita en sitio" },
              { n: "02", t: "Cotización", d: "Propuesta detallada sin compromiso" },
              { n: "03", t: "Instalación", d: "Ejecución profesional certificada" },
              { n: "04", t: "Soporte", d: "Garantía y soporte continuo" },
            ].map((p) => (
              <div key={p.n} className="bg-white rounded-lg p-6 border-t-4 border-brand-red">
                <div className="text-3xl font-black text-brand-blue/30">{p.n}</div>
                <h3 className="font-bold mt-2">{p.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certs */}
      <section className="container-x py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-black text-brand-blue">Certificaciones</h2>
            <p className="text-muted-foreground mt-2">Personal técnico certificado por las principales marcas del mercado.</p>
            <ul className="mt-5 space-y-2">
              {["Hikvision Certified Engineer", "Dahua Certified Partner", "Cisco Networking Academy", "ZKTeco Certified Installer", "Cableado Cat 6A certificado"].map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-success" /> {c}</li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-blue text-white rounded-lg p-8">
            <h3 className="text-2xl font-black">¿Necesitas un servicio?</h3>
            <p className="text-white/85 mt-2 text-sm">Diagnóstico gratuito y cotización sin compromiso.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Link to="/contacto" className="bg-brand-red hover:bg-brand-red-dark text-center py-3 rounded font-bold">Contactar</Link>
              <a href="https://wa.me/593999999999" target="_blank" rel="noreferrer" className="bg-whatsapp hover:opacity-90 text-center py-3 rounded font-bold">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
