import { Link, useNavigate, useSearchParams } from "@/lib/router";
import { useState } from "react";
import { authService } from "@/services/authService";

export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 2500);
    } catch (err: any) {
      setError(err.message || "El enlace es inválido o ha expirado");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-black text-brand-blue mb-4">Enlace inválido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            El enlace de recuperación no es válido. Solicita uno nuevo.
          </p>
          <Link to="/olvide-password" className="text-brand-blue font-semibold hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-brand-blue mb-1">Restablecer contraseña</h1>
        <p className="text-sm text-muted-foreground mb-6">Ingresa tu nueva contraseña.</p>

        {success ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            Contraseña actualizada correctamente. Redirigiendo a iniciar sesión...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
