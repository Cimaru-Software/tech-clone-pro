import { apiFetch } from "./api";
import { Producto } from "@/types";

interface ProductosResponse { productos: Producto[] }
interface ProductoResponse { producto: Producto }

export const productService = {
  getAll: (params?: { categoria?: string; search?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<ProductosResponse>(`/api/productos${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => apiFetch<ProductoResponse>(`/api/productos/${id}`),
};
