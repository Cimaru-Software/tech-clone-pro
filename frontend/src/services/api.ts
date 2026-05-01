const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error de red" }));
    throw new Error(error.error || "Error desconocido");
  }
  return res.json();
}
