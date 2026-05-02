import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Crear cuenta — La Casa del Computador" }] }),
  component: RegistroPage,
});

function RegistroPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password,
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
      });
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-brand-blue mb-1">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mb-6">Únete para seguir tus pedidos y más beneficios.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Nombre</label>
              <input className={inputClass} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Juan" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Apellido</label>
              <input className={inputClass} value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} required placeholder="Pérez" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Correo electrónico</label>
            <input type="email" className={inputClass} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Contraseña</label>
            <input type="password" className={inputClass} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono / WhatsApp</label>
            <input type="tel" className={inputClass} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} required placeholder="0999 999 999" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Dirección</label>
            <input className={inputClass} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} required placeholder="Av. Principal y calle secundaria" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Ciudad</label>
            <input className={inputClass} value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} required placeholder="Guayaquil" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-brand-blue font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
