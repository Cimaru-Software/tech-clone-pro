import { useCallback, useEffect, useState } from "react";
import { orderService } from "@/services/orderService";
import { CreatePedidoDto, Pedido } from "@/types";

export function useMyOrders(enabled = true) {
  const [data, setData] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const response = await orderService.getMine();
    setData(response.pedidos);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setData([]);
      return;
    }

    let active = true;

    async function load() {
      try {
        const response = await orderService.getMine();
        if (active) setData(response.pedidos);
      } catch {
        if (active) setData([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    const interval = window.setInterval(load, 15000);
    window.addEventListener("focus", load);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, [enabled]);

  return { data, isLoading, refetch };
}

export function useCreateOrder() {
  const [isPending, setIsPending] = useState(false);

  async function mutateAsync(data: CreatePedidoDto) {
    setIsPending(true);
    try {
      return await orderService.create(data);
    } finally {
      setIsPending(false);
    }
  }

  return { mutateAsync, isPending };
}
