import { createContext, useContext, useEffect, useState } from "react";
import { Cliente } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  cliente: Cliente | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { nombre: string; apellido: string; email: string; password: string; telefono?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const { cliente } = await authService.me();
      setCliente(cliente);
    } catch {
      setCliente(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function login(email: string, password: string) {
    const { cliente } = await authService.login({ email, password });
    setCliente(cliente);
  }

  async function logout() {
    await authService.logout();
    setCliente(null);
  }

  async function register(data: Parameters<typeof authService.register>[0]) {
    const { cliente } = await authService.register(data);
    setCliente(cliente);
  }

  return (
    <AuthContext.Provider value={{ cliente, isLoading, isAuthenticated: !!cliente, login, logout, register, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
