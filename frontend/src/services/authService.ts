import { apiFetch } from "./api";
import { Cliente } from "@/types";

interface AuthResponse { ok: boolean; cliente: Cliente }
interface MeResponse { cliente: Cliente }

export const authService = {
  register: (data: { nombre: string; apellido: string; email: string; password: string; telefono: string; direccion: string; ciudad: string }) =>
    apiFetch<AuthResponse>("/api/auth/cliente/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/api/auth/cliente/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => apiFetch<{ ok: boolean }>("/api/auth/cliente/logout", { method: "POST" }),
  me: () => apiFetch<MeResponse>("/api/me"),
  updateProfile: (data: { nombre?: string; apellido?: string; telefono?: string; direccion?: string; ciudad?: string }) =>
    apiFetch<{ ok: boolean; cliente: Cliente }>("/api/me", { method: "PATCH", body: JSON.stringify(data) }),
  updatePassword: (data: { passwordActual: string; passwordNueva: string }) =>
    apiFetch<{ ok: boolean; message: string }>("/api/me", { method: "PATCH", body: JSON.stringify(data) }),
};
