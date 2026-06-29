import { Link } from "@/lib/router";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { gaPurchase } from "@/lib/analytics";
import { CheckCircle2, ChevronRight, Lock, Truck, CreditCard, Upload, Loader2 } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __pluxCallback?: (response: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jQuery?: any;
  }
}

const ECUADOR_PROVINCES = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi",
  "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja",
  "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza",
  "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas",
  "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
];

const PLUX_TRIGGER_DELAY_MS = 900;
const PLUX_VISIBLE_LOADING_MS = 6000;

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { cliente, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [paidByCard, setPaidByCard] = useState(false);
  const [shipping_form, setShippingForm] = useState({ direccion: "", ciudad: "", provincia: "", notas: "" });
  const [billing_form, setBillingForm] = useState({
    tipoIdentificacion: "cedula",
    identificacion: "",
    razonSocial: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [metodoPago, setMetodoPago] = useState("transfer");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningPlux, setIsOpeningPlux] = useState(false);
  const [error, setError] = useState("");
  const pluxLoadingTimeoutRef = useRef<number | null>(null);

  const shipping = subtotal > 500 ? 0 : 8;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    if (!cliente) return;
    setShippingForm((form) => ({
      ...form,
      direccion: form.direccion || cliente.direccion || "",
      ciudad: form.ciudad || cliente.ciudad || "",
    }));
    setBillingForm((form) => ({
      ...form,
      razonSocial: form.razonSocial || `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim(),
      email: form.email || cliente.email || "",
      telefono: form.telefono || cliente.telefono || "",
      direccion: form.direccion || cliente.direccion || "",
    }));
  }, [cliente]);

  useEffect(() => {
    return () => {
      if (pluxLoadingTimeoutRef.current) window.clearTimeout(pluxLoadingTimeoutRef.current);
    };
  }, []);

  const stopPluxLoading = () => {
    if (pluxLoadingTimeoutRef.current) {
      window.clearTimeout(pluxLoadingTimeoutRef.current);
      pluxLoadingTimeoutRef.current = null;
    }
    setIsOpeningPlux(false);
  };

  const keepPluxLoadingVisible = () => {
    if (pluxLoadingTimeoutRef.current) window.clearTimeout(pluxLoadingTimeoutRef.current);
    pluxLoadingTimeoutRef.current = window.setTimeout(() => {
      setIsOpeningPlux(false);
      pluxLoadingTimeoutRef.current = null;
    }, PLUX_VISIBLE_LOADING_MS);
  };


  // __pluxCallback se redefine en cada render para capturar closures actualizados
  useEffect(() => {
    window.__pluxCallback = async (response) => {
      stopPluxLoading();
      if (response?.status !== "succeeded") return; // usuario cerró el modal u otro evento
      const detail = response.detail || {};
      setIsSubmitting(true);
      setError("");
      try {
        const res = await fetch(`${backendUrl}/api/compras`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metodoPago: "card",
            direccion: shipping_form.direccion.trim(),
            ciudad: shipping_form.ciudad.trim(),
            provincia: shipping_form.provincia.trim(),
            notas: shipping_form.notas.trim(),
            factura: {
              tipoIdentificacion: billing_form.tipoIdentificacion,
              identificacion: billing_form.identificacion.trim(),
              razonSocial: billing_form.razonSocial.trim(),
              email: billing_form.email.trim(),
              telefono: billing_form.telefono.trim(),
              direccion: billing_form.direccion.trim(),
            },
            total,
            items: items.map(i => ({ productoId: i.id, cantidad: i.qty, precio: itemPrice(i) })),
            pluxTransaccion: detail.id_transaccion || "",
            pluxToken: detail.token || "",
            pluxEstado: detail.state || "",
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "No se pudo registrar la compra");
        gaPurchase(
          result.compra.id,
          items.map(i => ({ item_id: i.id, item_name: i.nombre, item_brand: i.marca, price: itemPrice(i), quantity: i.qty })),
          total
        );
        setPurchaseId(result.compra.id);
        setPaidByCard(true);
        setStep(4);
        clear();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo registrar la compra");
      } finally {
        setIsSubmitting(false);
      }
    };
  });

  const itemName = (item: typeof items[number] & { name?: string }) => item.nombre || item.name || "Producto";
  const itemImage = (item: typeof items[number] & { image?: string }) => item.imagen || item.image || "/placeholder-product.png";
  const itemPrice = (item: typeof items[number] & { price?: number }) => Number(item.precio ?? item.price ?? 0);
  const itemOriginalPrice = (item: typeof items[number] & { oldPrice?: number }) => Number(item.precioOriginal ?? item.oldPrice ?? itemPrice(item));

  const submitTransferOrder = async (comprobanteFile: File) => {
    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("metodoPago", "transfer");
      formData.append("direccion", shipping_form.direccion.trim());
      formData.append("ciudad", shipping_form.ciudad.trim());
      formData.append("provincia", shipping_form.provincia.trim());
      formData.append("notas", shipping_form.notas.trim());
      formData.append("facturaTipoIdentificacion", billing_form.tipoIdentificacion);
      formData.append("facturaIdentificacion", billing_form.identificacion.trim());
      formData.append("facturaRazonSocial", billing_form.razonSocial.trim());
      formData.append("facturaEmail", billing_form.email.trim());
      formData.append("facturaTelefono", billing_form.telefono.trim());
      formData.append("facturaDireccion", billing_form.direccion.trim());
      formData.append("total", String(total));
      formData.append("items", JSON.stringify(items.map(i => ({ productoId: i.id, cantidad: i.qty, precio: itemPrice(i) }))));
      formData.append("comprobante", comprobanteFile);

      const res = await fetch(`${backendUrl}/api/compras`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo registrar la compra");
      gaPurchase(
        result.compra.id,
        items.map(i => ({ item_id: i.id, item_name: i.nombre, item_brand: i.marca, price: itemPrice(i), quantity: i.qty })),
        total
      );
      setPurchaseId(result.compra.id);
      setStep(4);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerPlux = () => {
    setError("");

    const $ = window.jQuery;
    if (!$) {
      stopPluxLoading();
      setError("Error al cargar la pasarela de pago. Recarga la página.");
      return;
    }

    // Actualizar window.data con los valores del pedido actual antes de abrir el modal.
    // Plux lee window.data en tiempo de ejecución cuando el usuario confirma el pago.
    if (window.data) {
      window.data.PayboxSendmail    = cliente?.email || "";
      window.data.PayboxSendname    = billing_form.razonSocial.trim();
      window.data.PayboxBase0       = "0.00";
      window.data.PayboxBase12      = total.toFixed(2);
      window.data.PayboxDescription = `Compra - ${items.length} producto(s)`;
      window.data.PayboxDirection   = billing_form.direccion.trim();
      window.data.PayBoxClientPhone = billing_form.telefono.trim();
      window.data.PayBoxClientIdentification = billing_form.identificacion.trim();
    }

    // Plux inyecta el botón #pay dentro de #ButtonPaybox durante window.load.
    // Disparar click con jQuery (no con .click() nativo) porque Plux usa jQuery.on().
    const btn = $("#pay");
    if (btn.length) {
      btn.trigger("click");
      keepPluxLoadingVisible();
    } else {
      stopPluxLoading();
      setError("La pasarela de pago no está lista. Recarga la página e inténtalo de nuevo.");
    }
  };

  const finish = () => {
    setError("");
    if (!shipping_form.direccion.trim() || !shipping_form.ciudad.trim() || !shipping_form.provincia.trim() || !shipping_form.notas.trim()) {
      setError("Completa todos los datos de envío.");
      return;
    }
    if (!billing_form.identificacion.trim() || !billing_form.razonSocial.trim() || !billing_form.email.trim() || !billing_form.telefono.trim() || !billing_form.direccion.trim()) {
      setError("Completa todos los datos de facturación.");
      return;
    }
    if (metodoPago === "transfer") {
      if (!comprobante) {
        setError("Debes cargar una imagen del comprobante de transferencia.");
        return;
      }
      submitTransferOrder(comprobante);
    } else {
      setIsOpeningPlux(true);
      window.setTimeout(triggerPlux, PLUX_TRIGGER_DELAY_MS);
    }
  };

  if (isLoading) return <div className="container-x py-20 text-center">Cargando...</div>;

  if (!isAuthenticated && step < 4) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="container-x py-20 text-center">
          <h1 className="text-2xl font-bold text-brand-blue mb-3">Inicia sesión para continuar</h1>
          <p className="text-muted-foreground mb-6">Necesitas una cuenta para finalizar tu compra y hacer seguimiento de tus pedidos.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login" className="bg-brand-red text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-red-dark">Iniciar sesión</Link>
            <Link to="/registro" className="bg-brand-blue text-white font-bold px-6 py-3 rounded-lg hover:opacity-90">Crear cuenta</Link>
          </div>
          <div className="mt-4">
            <Link to="/tienda" className="text-sm text-muted-foreground hover:underline">← Volver a la tienda</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step < 4) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <Link to="/tienda" className="inline-block mt-4 bg-brand-red text-white px-5 py-2.5 rounded font-bold">Ir a la tienda</Link>
      </div>
    );
  }

  const goNext = () => {
    setError("");
    if (step === 2 && (!shipping_form.direccion.trim() || !shipping_form.ciudad.trim() || !shipping_form.provincia.trim() || !shipping_form.notas.trim())) {
      setError("Todos los datos de envío son obligatorios.");
      return;
    }
    if (step === 2 && (!billing_form.identificacion.trim() || !billing_form.razonSocial.trim() || !billing_form.email.trim() || !billing_form.telefono.trim() || !billing_form.direccion.trim())) {
      setError("Todos los datos de facturación son obligatorios.");
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="bg-secondary min-h-screen">
      <div className="container-x py-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 text-xs md:text-sm">
          {["Carrito", "Envío", "Pago", "Confirmación"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full grid place-items-center font-bold ${step > i ? "bg-success text-white" : step === i + 1 ? "bg-brand-red text-white" : "bg-white border text-muted-foreground"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`hidden md:inline font-semibold ${step === i + 1 ? "text-brand-red" : "text-muted-foreground"}`}>{s}</span>
              {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === 4 ? (
          paidByCard ? (
            <div className="bg-white rounded-lg p-10 max-w-xl mx-auto text-center">
              <CheckCircle2 className="h-20 w-20 text-success mx-auto" />
              <h1 className="text-3xl font-black text-brand-blue mt-4">¡Gracias por tu compra!</h1>
              <p className="text-muted-foreground mt-2">Te enviamos los detalles por correo electrónico.</p>
              <p className="text-sm text-muted-foreground mt-1">Pedido <span className="font-bold text-foreground">#{purchaseId?.slice(-8)}</span> registrado y en proceso.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <Link to="/mi-cuenta/pedidos" className="bg-brand-blue text-white py-3 rounded font-bold">Ver tracking</Link>
                <Link to="/tienda" className="bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded font-bold">Seguir comprando</Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-10 max-w-xl mx-auto text-center">
              <CheckCircle2 className="h-20 w-20 text-success mx-auto" />
              <h1 className="text-3xl font-black text-brand-blue mt-4">¡Compra registrada!</h1>
              <p className="text-muted-foreground mt-2">Tu compra <span className="font-bold text-foreground">#{purchaseId?.slice(-8)}</span> quedó pendiente de validación.</p>
              <p className="text-sm text-muted-foreground mt-1">Cuando el pago sea confirmado se procesará tu pedido.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <Link to="/tienda" className="bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded font-bold">Seguir comprando</Link>
                <Link to="/mi-cuenta/pedidos" className="bg-brand-blue text-white py-3 rounded font-bold">Ver mis pedidos</Link>
              </div>
            </div>
          )
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="bg-white rounded-lg p-6">
              {step === 1 && (
                <>
                  <h2 className="text-xl font-black text-brand-blue mb-4">1. Revisa tu carrito</h2>
                  <div className="divide-y">
                    {items.map((i) => (
                      <div key={i.id} className="flex gap-3 py-3">
                        <img src={itemImage(i)} alt={itemName(i)} className="h-20 w-20 object-contain bg-secondary rounded" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{itemName(i)}</div>
                          <div className="text-xs text-muted-foreground">Cantidad: {i.qty}</div>
                        </div>
                        <div className="text-right">
                          {i.descuento > 0 && (
                            <div className="text-xs text-muted-foreground line-through">${(itemOriginalPrice(i) * i.qty).toFixed(2)}</div>
                          )}
                          <div className="font-bold text-brand-blue">${(itemPrice(i) * i.qty).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-black text-brand-blue mb-4 flex items-center gap-2"><Truck className="h-5 w-5" /> 2. Datos de envío</h2>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <input required placeholder="Dirección" className="border rounded px-3 py-2 md:col-span-2" value={shipping_form.direccion} onChange={e => setShippingForm(f => ({ ...f, direccion: e.target.value }))} />
                    <input required placeholder="Ciudad" className="border rounded px-3 py-2" value={shipping_form.ciudad} onChange={e => setShippingForm(f => ({ ...f, ciudad: e.target.value }))} />
                    <select required className="border rounded px-3 py-2" value={shipping_form.provincia} onChange={e => setShippingForm(f => ({ ...f, provincia: e.target.value }))}>
                      <option value="">Provincia</option>
                      {ECUADOR_PROVINCES.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                    <textarea required placeholder="Referencias / instrucciones" className="border rounded px-3 py-2 md:col-span-2" rows={2} value={shipping_form.notas} onChange={e => setShippingForm(f => ({ ...f, notas: e.target.value }))} />
                  </div>
                  <div className="mt-6 border-t pt-5">
                    <h3 className="text-lg font-black text-brand-blue mb-3">Datos de facturación</h3>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <select
                        required
                        className="border rounded px-3 py-2"
                        value={billing_form.tipoIdentificacion}
                        onChange={e => setBillingForm(f => ({ ...f, tipoIdentificacion: e.target.value }))}
                      >
                        <option value="cedula">Cédula</option>
                        <option value="ruc">RUC</option>
                        <option value="pasaporte">Pasaporte</option>
                      </select>
                      <input
                        required
                        placeholder="Identificación"
                        className="border rounded px-3 py-2"
                        value={billing_form.identificacion}
                        onChange={e => setBillingForm(f => ({ ...f, identificacion: e.target.value }))}
                      />
                      <input
                        required
                        placeholder="Razón social / nombres"
                        className="border rounded px-3 py-2 md:col-span-2"
                        value={billing_form.razonSocial}
                        onChange={e => setBillingForm(f => ({ ...f, razonSocial: e.target.value }))}
                      />
                      <input
                        required
                        type="email"
                        placeholder="Correo para factura"
                        className="border rounded px-3 py-2"
                        value={billing_form.email}
                        onChange={e => setBillingForm(f => ({ ...f, email: e.target.value }))}
                      />
                      <input
                        required
                        type="tel"
                        placeholder="Teléfono"
                        className="border rounded px-3 py-2"
                        value={billing_form.telefono}
                        onChange={e => setBillingForm(f => ({ ...f, telefono: e.target.value }))}
                      />
                      <input
                        required
                        placeholder="Dirección de facturación"
                        className="border rounded px-3 py-2 md:col-span-2"
                        value={billing_form.direccion}
                        onChange={e => setBillingForm(f => ({ ...f, direccion: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-xl font-black text-brand-blue mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5" /> 3. Método de pago</h2>
                  <div className="space-y-3">
                    {[
                      { v: "transfer", t: "Transferencia bancaria", d: "Carga el comprobante para validar tu compra" },
                      { v: "card", t: "Tarjeta de crédito / débito", d: "Visa, Mastercard, American Express, Diners, Discover" },
                    ].map((m) => (
                      <label key={m.v} className="flex items-start gap-3 border rounded p-3 has-[:checked]:border-brand-red has-[:checked]:bg-secondary cursor-pointer hover:border-brand-red">
                        <input type="radio" name="pay" checked={metodoPago === m.v} onChange={() => setMetodoPago(m.v)} className="mt-1 accent-brand-red" />
                        <div>
                          <div className="font-bold text-sm">{m.t}</div>
                          <div className="text-xs text-muted-foreground">{m.d}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {metodoPago === "transfer" && (
                    <div className="mt-4 space-y-3">
                      <div className="border rounded p-4 bg-secondary/60 text-sm">
                        <div className="font-black text-brand-blue mb-3">Datos para transferencia</div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Banco: </span><span className="font-semibold">Banco Pichincha</span></div>
                          <div><span className="text-muted-foreground">Tipo: </span><span className="font-semibold">Cuenta de ahorros</span></div>
                          <div><span className="text-muted-foreground">N. cuenta: </span><span className="font-semibold">2208101068</span></div>
                          <div><span className="text-muted-foreground">CI: </span><span className="font-semibold">1722212717</span></div>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-brand-blue/25 rounded-lg bg-secondary/60 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-brand-blue/10 text-brand-blue grid place-items-center shrink-0">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-brand-blue">Comprobante de transferencia</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Sube una foto o captura clara del comprobante para validar tu compra.
                            </div>
                            {comprobante && (
                              <div className="text-sm font-semibold text-success mt-2 truncate">{comprobante.name}</div>
                            )}
                          </div>
                          <label className="inline-flex justify-center bg-brand-red hover:bg-brand-red-dark text-white font-bold px-5 py-2.5 rounded cursor-pointer whitespace-nowrap">
                            {comprobante ? "Cambiar archivo" : "Cargar imagen"}
                            <input type="file" accept="image/*" onChange={e => setComprobante(e.target.files?.[0] || null)} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === "card" && (
                    <div className="mt-4 border rounded p-4 bg-secondary/60 text-sm">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-brand-blue shrink-0" />
                        <p className="text-muted-foreground">
                          Al hacer click en <strong>Pagar con tarjeta</strong> se abrirá la pasarela segura de Plux para ingresar los datos de tu tarjeta.
                        </p>
                      </div>
                      {isOpeningPlux && (
                        <div className="mt-4 rounded border border-brand-blue/20 bg-white p-3">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-brand-red shrink-0" />
                            <div>
                              <div className="font-bold text-brand-blue">Cargando pago Plux</div>
                              <div className="text-xs text-muted-foreground">Preparando la pasarela segura...</div>
                            </div>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-1/3 animate-[plux-loading_1.1s_ease-in-out_infinite] rounded-full bg-brand-red" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Lock className="h-3 w-3" /> Pago 100% seguro y encriptado
                  </div>
                </>
              )}

              <div className="flex justify-between mt-6">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Atrás</button>
                ) : <span />}
                {error && <div className="text-sm font-semibold text-brand-red px-3 text-right">{error}</div>}
                <button
                  onClick={() => step < 3 ? goNext() : finish()}
                  disabled={isSubmitting || isOpeningPlux}
                  className="bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded"
                >
                  {isOpeningPlux
                    ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando Plux...
                      </span>
                    )
                    : isSubmitting
                    ? "Procesando..."
                    : step === 3
                      ? metodoPago === "card" ? "Pagar con tarjeta →" : "Registrar compra"
                      : "Continuar →"}
                </button>
              </div>
            </div>

            {/* Order summary */}
            <aside className="bg-white rounded-lg p-6 h-fit lg:sticky lg:top-32">
              <h3 className="font-black text-brand-blue mb-3">Resumen del pedido</h3>
              <div className="text-sm space-y-2 border-b pb-3">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Envío</span><span>{shipping === 0 ? "GRATIS" : `$${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span>IVA (15%)</span><span>${tax.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between font-black text-lg text-brand-blue mt-3">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
              <div className="bg-secondary rounded p-2 text-xs mt-4 flex items-center gap-2">
                <Lock className="h-3 w-3" /> Compra protegida y encriptada
              </div>
            </aside>
          </div>
        )}
      </div>
      <style>{`
        @keyframes plux-loading {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  );
}
