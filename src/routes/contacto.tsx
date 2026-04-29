import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — La Casa del Computador | Guayaquil, Ecuador" },
      { name: "description", content: "Contáctanos: tienda en Guayaquil, soporte técnico y ventas. WhatsApp, teléfono, email y formulario en línea." },
    ],
  }),
  component: Contacto,
});

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(7, "Teléfono inválido").max(20),
  message: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000),
});

function Contacto() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const m: Record<string, string> = {};
      r.error.issues.forEach((i) => { m[i.path[0] as string] = i.message; });
      setErrs(m);
      return;
    }
    setErrs({});
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div>
      <section className="gradient-hero text-white py-14">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">CONTACTO</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Estamos para ayudarte</h1>
          <p className="mt-3 text-white/85">Resolvemos tus dudas y te asesoramos sin compromiso.</p>
        </div>
      </section>

      <section className="container-x py-10 grid md:grid-cols-4 gap-4">
        {[
          { i: MapPin, t: "Tienda principal", l: "Av. 9 de Octubre 1234\nGuayaquil, Ecuador" },
          { i: Phone, t: "Teléfono", l: "(04) 222-3333\n+593 99 999-9999" },
          { i: Mail, t: "Email", l: "ventas@lacasadelcomputador.ec\nsoporte@lacasadelcomputador.ec" },
          { i: Clock, t: "Horarios", l: "Lun–Vie 9:00–19:00\nSáb 9:00–14:00" },
        ].map((c) => (
          <div key={c.t} className="bg-white border rounded-lg p-5 text-center">
            <div className="h-12 w-12 rounded-full bg-brand-blue text-white grid place-items-center mx-auto mb-3"><c.i className="h-5 w-5" /></div>
            <div className="font-bold text-brand-blue">{c.t}</div>
            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{c.l}</div>
          </div>
        ))}
      </section>

      <section className="container-x pb-12 grid lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-black text-brand-blue">Envíanos un mensaje</h2>
          <p className="text-sm text-muted-foreground mb-5">Te responderemos en menos de 24 horas.</p>

          {sent && (
            <div className="bg-success/10 text-success border border-success/30 rounded p-3 mb-4 flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5" /> ¡Mensaje enviado! Te contactaremos pronto.
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Nombre completo</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 border rounded px-3 py-2 text-sm" maxLength={100} />
              {errs.name && <p className="text-xs text-destructive mt-1">{errs.name}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 border rounded px-3 py-2 text-sm" maxLength={255} />
                {errs.email && <p className="text-xs text-destructive mt-1">{errs.email}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 border rounded px-3 py-2 text-sm" maxLength={20} />
                {errs.phone && <p className="text-xs text-destructive mt-1">{errs.phone}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Mensaje</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full mt-1 border rounded px-3 py-2 text-sm" maxLength={1000} />
              {errs.message && <p className="text-xs text-destructive mt-1">{errs.message}</p>}
            </div>
            <button className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-5 py-2.5 rounded flex items-center gap-2"><Send className="h-4 w-4" /> Enviar mensaje</button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-secondary rounded-lg overflow-hidden h-72">
            <iframe
              title="Mapa tienda"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-79.95%2C-2.18%2C-79.85%2C-2.13&layer=mapnik"
              className="w-full h-full border-0"
            />
          </div>
          <a href="https://wa.me/593999999999" target="_blank" rel="noreferrer" className="block bg-whatsapp text-white rounded-lg p-6 hover:opacity-90">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-10 w-10" />
              <div>
                <div className="font-black text-xl">Chatea por WhatsApp</div>
                <div className="text-sm opacity-90">Respuesta inmediata en horario comercial</div>
              </div>
            </div>
          </a>
          <div className="bg-brand-blue text-white rounded-lg p-6">
            <div className="font-black text-xl">Soporte técnico 24/7</div>
            <div className="text-sm opacity-90 mt-1">Para clientes con contrato de mantenimiento</div>
            <div className="mt-3 font-bold">📞 1800-LCDC-247</div>
          </div>
        </div>
      </section>
    </div>
  );
}
