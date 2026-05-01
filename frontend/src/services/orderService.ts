import { apiFetch } from "./api";
import { Pedido, CreatePedidoDto } from "@/types";

interface PedidosResponse { pedidos: Pedido[] }
interface PedidoResponse { pedido: Pedido }

export const orderService = {
  create: (data: CreatePedidoDto) =>
    apiFetch<PedidoResponse>("/api/pedidos", { method: "POST", body: JSON.stringify(data) }),
  getMine: () => apiFetch<PedidosResponse>("/api/pedidos"),
};
