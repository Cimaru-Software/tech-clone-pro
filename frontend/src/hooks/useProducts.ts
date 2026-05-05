import { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import type { Producto } from "@/types";

export function useProducts(params?: { categoria?: string; search?: string }) {
  const [data, setData] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    productService
      .getAll(params)
      .then((response) => { if (active) setData(response.productos); })
      .catch(() => { if (active) setData([]); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [params?.categoria, params?.search]);

  return { data, isLoading };
}

export function useProduct(id: string) {
  const [data, setData] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setIsLoading(true);
    setIsError(false);
    productService
      .getById(id)
      .then((response) => { if (active) setData(response.producto); })
      .catch(() => {
        if (active) {
          setData(null);
          setIsError(true);
        }
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [id]);

  return { data, isLoading, isError };
}
