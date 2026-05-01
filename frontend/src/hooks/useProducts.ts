import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";

export function useProducts(params?: { categoria?: string; search?: string }) {
  return useQuery({
    queryKey: ["productos", params],
    queryFn: () => productService.getAll(params),
    select: (data) => data.productos,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["producto", id],
    queryFn: () => productService.getById(id),
    select: (data) => data.producto,
    enabled: !!id,
  });
}
