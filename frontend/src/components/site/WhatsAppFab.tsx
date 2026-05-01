import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/593999999999?text=Hola%2C%20necesito%20información"
      target="_blank"
      rel="noreferrer"
      aria-label="Chatea por WhatsApp"
      className="fixed bottom-5 right-5 z-50 bg-whatsapp text-white h-14 w-14 rounded-full grid place-items-center shadow-card-hover hover:scale-105 transition-transform"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute inline-flex h-full w-full rounded-full bg-whatsapp opacity-40 animate-ping" />
    </a>
  );
}
