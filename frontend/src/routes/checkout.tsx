import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, ChevronRight, Lock, Truck, CreditCard, Upload } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — La Casa del Computador" }] }),
  component: Checkout,
});

const ECUADOR_PROVINCES = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { cliente, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [shipping_form, setShippingForm] = useState({ direccion: "", ciudad: "", provincia: "", notas: "" });
  const [metodoPago, setMetodoPago] = useState("transfer");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
  }, [cliente]);

  const itemName = (item: typeof items[number] & { name?: string }) => item.nombre || item.name || "Producto";
  const itemImage = (item: typeof items[number] & { image?: string }) => item.imagen || item.image || "/placeholder-product.png";
  const itemPrice = (item: typeof items[number] & { price?: number }) => Number(item.precio ?? item.price ?? 0);
  const itemOriginalPrice = (item: typeof items[number] & { oldPrice?: number }) => Number(item.precioOriginal ?? item.oldPrice ?? itemPrice(item));

  const finish = async () => {
    setError("");
    if (metodoPago === "card") {
      setError("El pago con tarjeta de crédito aún no está disponible.");
      return;
    }
    if (!shipping_form.direccion.trim() || !shipping_form.ciudad.trim() || !shipping_form.provincia.trim() || !shipping_form.notas.trim()) {
      setError("Completa todos los datos de envío.");
      return;
    }
    if (!comprobante) {
      setError("Debes cargar una imagen del comprobante de transferencia.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("metodoPago", metodoPago);
      formData.append("direccion", shipping_form.direccion.trim());
      formData.append("ciudad", shipping_form.ciudad.trim());
      formData.append("provincia", shipping_form.provincia.trim());
      formData.append("notas", shipping_form.notas.trim());
      formData.append("total", String(total));
      formData.append("items", JSON.stringify(items.map(i => ({ productoId: i.id, cantidad: i.qty, precio: itemPrice(i) }))));
      formData.append("comprobante", comprobante);

      const res = await fetch(`${backendUrl}/api/compras`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "No se pudo registrar la compra");
      setPurchaseId(result.compra.id);
      setStep(4);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la compra");
    } finally {
      setIsSubmitting(false);
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
          <div className="bg-white rounded-lg p-10 max-w-xl mx-auto text-center">
            <CheckCircle2 className="h-20 w-20 text-success mx-auto" />
            <h1 className="text-3xl font-black text-brand-blue mt-4">¡Compra registrada!</h1>
            <p className="text-muted-foreground mt-2">Tu compra <span className="font-bold text-foreground">#{purchaseId?.slice(-8)}</span> quedó pendiente de validación.</p>
            <p className="text-sm text-muted-foreground mt-1">Cuando el comprobante sea aprobado se creará tu pedido.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <Link to="/tienda" className="bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded font-bold">Seguir comprando</Link>
              <Link to="/mi-cuenta/pedidos" className="bg-brand-blue text-white py-3 rounded font-bold">Ver mis pedidos</Link>
            </div>
          </div>
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
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="text-xl font-black text-brand-blue mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5" /> 3. Método de pago</h2>
                  <div className="space-y-3">
                    {[
                      { v: "transfer", t: "Transferencia bancaria", d: "Carga el comprobante para validar tu compra", disabled: false },
                      { v: "card", t: "Tarjeta de crédito", d: "Aún no está disponible", disabled: false },
                    ].map((m) => (
                      <label key={m.v} className={`flex items-start gap-3 border rounded p-3 has-[:checked]:border-brand-red has-[:checked]:bg-secondary ${m.disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:border-brand-red"}`}>
                        <input type="radio" name="pay" disabled={m.disabled} checked={metodoPago === m.v} onChange={() => setMetodoPago(m.v)} className="mt-1 accent-brand-red" />
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4"><Lock className="h-3 w-3" /> Pago 100% seguro y encriptado</div>
                </>
              )}

              <div className="flex justify-between mt-6">
                {step > 1 ? <button onClick={() => setStep(step - 1)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Atrás</button> : <span />}
                {error && <div className="text-sm font-semibold text-brand-red px-3 text-right">{error}</div>}
                <button
                  onClick={() => step < 3 ? goNext() : finish()}
                  disabled={isSubmitting}
                  className="bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded"
                >
                  {isSubmitting ? "Procesando..." : step === 3 ? "Registrar compra" : "Continuar →"}
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
              <div className="bg-secondary rounded p-2 text-xs mt-4 flex items-center gap-2"><Lock className="h-3 w-3" /> Compra protegida y encriptada</div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
