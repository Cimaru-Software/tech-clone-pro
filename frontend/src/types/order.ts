import { Producto } from "./product";

export interface ItemPedido {
  id: string;
  productoId: string;
  producto: Producto;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  total: number;
  estado: "PENDIENTE" | "PROCESANDO" | "ENVIADO" | "ENTREGADO" | "CANCELADO" | "PENDIENTE_VALIDACION" | "COMPROBANTE_RECHAZADO" | "COMPRA_APROBADA";
  metodoPago: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  notas?: string;
  motivoRechazo?: string;
  tipo?: "pedido" | "compra";
  items: ItemPedido[];
  createdAt: string;
}

export interface CreatePedidoDto {
  items: { productoId: string; cantidad: number; precio: number }[];
  metodoPago: string;
  direccion: string;
  ciudad: string;
  provincia?: string;
  notas?: string;
}
