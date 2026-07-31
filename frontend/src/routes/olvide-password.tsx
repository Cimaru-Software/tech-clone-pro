import { Link } from "@/lib/router";
import { useState } from "react";
import { authService } from "@/services/authService";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-brand-blue mb-1">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="tu@email.com"
              />
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-brand-blue font-semibold hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
