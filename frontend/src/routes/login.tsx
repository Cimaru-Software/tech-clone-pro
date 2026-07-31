import { Link, useNavigate } from "@/lib/router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-brand-blue mb-1">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground mb-6">Accede a tu cuenta para ver tus pedidos y más.</p>
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-foreground">Contraseña</label>
              <Link to="/olvide-password" className="text-xs text-brand-blue font-semibold hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-brand-blue font-semibold hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
