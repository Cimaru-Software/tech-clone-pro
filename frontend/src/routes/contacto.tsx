import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";

const locations = [
  {
    name: "Principal",
    address: 'La Libertad, Av. 9 De Octubre Ignacio Guerra Esq. Edificio Ruiz, cerca de Almacenes Tía y Academia Naval "Capitán Leonardo Abad Astudillo".',
    schedule: "Lunes-Viernes 8:30-18:30\nSábado 9:00-15:00\nDomingo 9:00-15:00",
    map: "https://maps.google.com/maps?q=La%20Libertad%20Av.%209%20De%20Octubre%20Ignacio%20Guerra%20Edificio%20Ruiz&t=&z=17&ie=UTF8&iwloc=&output=embed",
  },
  {
    name: "Sucursal",
    address: "La Libertad, diagonal al Edificio de la Judicatura, en las antiguas oficinas de la Agencia Palau.",
    schedule: "Lunes-Viernes 8:30-18:30\nSábados 9:00-15:00",
    map: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15947.241950331194!2d-80.909712!3d-2.2249241!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x902e0f1aa5ce8a1b%3A0x1406419eee7cc318!2sLa%20Casa%20del%20Computador%202!5e0!3m2!1ses!2sec!4v1779896689936!5m2!1ses!2sec",
  },
];

export default function Contacto() {
  return (
    <div>
      <section className="gradient-hero text-white py-14">
        <div className="container-x text-center">
          <span className="bg-brand-red text-xs font-bold px-3 py-1 rounded">CONTACTO</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Estamos para ayudarte</h1>
          <p className="mt-3 text-white/85">Escríbenos o visítanos en nuestras sedes en La Libertad.</p>
        </div>
      </section>

      <section className="container-x py-10 grid md:grid-cols-3 gap-4">
        <a href="https://wa.me/593989955400" target="_blank" rel="noreferrer" className="bg-white border rounded-lg p-5 hover:shadow-card-hover transition-shadow">
          <div className="h-12 w-12 rounded-full bg-whatsapp text-white grid place-items-center mb-3">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="font-bold text-brand-blue">WhatsApp Matriz</div>
          <div className="text-sm text-muted-foreground mt-1">0989955400</div>
        </a>

        <a href="https://wa.me/593968716845" target="_blank" rel="noreferrer" className="bg-white border rounded-lg p-5 hover:shadow-card-hover transition-shadow">
          <div className="h-12 w-12 rounded-full bg-whatsapp text-white grid place-items-center mb-3">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="font-bold text-brand-blue">WhatsApp Sucursal</div>
          <div className="text-sm text-muted-foreground mt-1">0968716845</div>
        </a>

        <a href="mailto:info@lacasadelcomputador.ec" className="bg-white border rounded-lg p-5 hover:shadow-card-hover transition-shadow">
          <div className="h-12 w-12 rounded-full bg-brand-blue text-white grid place-items-center mb-3">
            <Mail className="h-5 w-5" />
          </div>
          <div className="font-bold text-brand-blue">Correo</div>
          <div className="text-sm text-muted-foreground mt-1 break-all">info@lacasadelcomputador.ec</div>
        </a>
      </section>

      <section className="container-x pb-12 grid lg:grid-cols-2 gap-6">
        {locations.map((location) => (
          <article key={location.name} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="text-xs font-black text-brand-red tracking-wide uppercase">Ubicación</div>
              <h2 className="text-2xl font-black text-brand-blue mt-1">{location.name}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-brand-red shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">{location.address}</p>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-brand-red shrink-0 mt-0.5" />
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{location.schedule}</p>
                </div>
              </div>
            </div>
            <div className="h-80 bg-secondary border-t">
              <iframe
                title={`Mapa ${location.name}`}
                src={location.map}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
