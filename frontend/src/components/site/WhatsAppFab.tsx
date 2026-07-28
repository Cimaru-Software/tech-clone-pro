import { MessageCircle, ClipboardCheck } from "lucide-react";

export function WhatsAppFab() {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <a
        href="https://sistema.lacasadelcomputador.ec/consulta-orden"
        target="_blank"
        rel="noreferrer"
        aria-label="Consulta tu orden"
        className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-full shadow-card-hover hover:scale-105 transition-transform text-sm font-bold whitespace-nowrap"
      >
        <ClipboardCheck className="h-5 w-5 shrink-0" />
        CONSULTA TU ORDEN
      </a>
      <a
        href="https://wa.me/593989955400?text=Hola%2C%20necesito%20información"
        target="_blank"
        rel="noreferrer"
        aria-label="Chatea por WhatsApp"
        className="relative bg-whatsapp text-white h-14 w-14 rounded-full grid place-items-center shadow-card-hover hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute inline-flex h-full w-full rounded-full bg-whatsapp opacity-40 animate-ping" />
      </a>
    </div>
  );
}
