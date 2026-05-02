import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { CreatePedidoDto } from "@/types";

export function useMyOrders() {
  return useQuery({
    queryKey: ["pedidos", "mine"],
    queryFn: () => orderService.getMine(),
    select: (data) => data.pedidos,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePedidoDto) => orderService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
  });
}
