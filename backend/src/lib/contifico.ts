const BASE_URL_V1 = "https://api.contifico.com/sistema/api/v1";
const BASE_URL_V2 = "https://api.contifico.com/sistema/api/v2";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: process.env.CONTIFICO_API_KEY!,
    token: process.env.CONTIFICO_API_TOKEN!,
  };
}

export interface ContificoProducto {
  id: string;
  codigo: string;
  codigo_auxiliar?: string | null;
  nombre: string;
  descripcion: string;
  // v1 usa precio_unitario (string), v2 usa pvp1 (string)
  precio_unitario?: string;
  pvp1?: string;
  pvp2?: string;
  porcentaje_iva: string | number;
  tipo: string;
  estado: string;
  categoria_id?: string;
  marca_id?: string;
  marca_nombre?: string;
  imagen?: string;
  cantidad_stock?: number;
}

export interface ContificoStock {
  bodega_id: string;
  bodega_nombre: string;
  cantidad: number;
}

export interface ContificoDocumentoDetalle {
  producto_id: string;
  cantidad: number;
  precio: number;
  porcentaje_iva: number;
  porcentaje_descuento: number;
  base_cero: number;
  base_gravable: number;
  base_no_gravable: number;
}

export interface ContificoDocumento {
  fecha: string; // dd/MM/yyyy
  tipo_documento: string; // "FAC"
  pos: boolean;
  descripcion: string;
  subtotal_0: number;
  subtotal_12: number;
  iva: number;
  total: number;
  porcentaje_descuento: number;
  persona_id: string;
  vendedor_id?: string;
  detalles: ContificoDocumentoDetalle[];
}

// Obtiene los IDs de productos que tienen movimientos en la Bodega Ecommerce.
// El endpoint /movimiento-inventario/?bodega_id=X sí filtra correctamente por bodega.
async function getProductIdsBodegaEcommerce(): Promise<Set<string>> {
  const bodegaId = process.env.CONTIFICO_BODEGA_ID;
  if (!bodegaId) throw new Error("CONTIFICO_BODEGA_ID no configurado");

  const ids = new Set<string>();
  let page = 1;

  while (true) {
    const res = await fetch(
      `${BASE_URL_V2}/movimiento-inventario/?format=json&bodega_id=${bodegaId}&page=${page}`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Contífico movimientos: ${res.status} ${text}`);
    }
    const raw = await res.text();
    // La API a veces devuelve múltiples objetos JSON concatenados — tomamos la primera línea
    const data = JSON.parse(raw.split("\n")[0]);
    const results: Array<{ detalles: Array<{ producto_id: string }> }> =
      data.results ?? [];

    for (const mov of results) {
      for (const det of mov.detalles ?? []) {
        if (det.producto_id) ids.add(det.producto_id);
      }
    }

    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  return ids;
}

// Devuelve solo los productos que tienen movimientos en la Bodega Ecommerce.
export async function getProductos(): Promise<ContificoProducto[]> {
  // Paso 1: obtener IDs de productos con movimientos en bodega ecommerce
  const idsEcommerce = await getProductIdsBodegaEcommerce();

  if (idsEcommerce.size === 0) return [];

  // Paso 2: obtener todos los productos y filtrar por esos IDs
  const todos: ContificoProducto[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${BASE_URL_V2}/producto/?format=json&page=${page}`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Contífico getProductos: ${res.status} ${text}`);
    }
    const data = await res.json();
    const results: ContificoProducto[] = data.results ?? [];

    for (const p of results) {
      if (idsEcommerce.has(p.id)) {
        todos.push(p);
      }
    }

    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  return todos;
}

export async function getProducto(id: string): Promise<ContificoProducto> {
  const res = await fetch(`${BASE_URL_V2}/producto/${id}/?format=json`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico getProducto: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getStock(id: string): Promise<ContificoStock[]> {
  const res = await fetch(`${BASE_URL_V2}/producto/${id}/stock/?format=json`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico getStock: ${res.status} ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function crearDocumento(
  doc: ContificoDocumento
): Promise<{ id: string; secuencial?: string }> {
  const res = await fetch(`${BASE_URL_V1}/documento/?format=json`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico crearDocumento: ${res.status} ${text}`);
  }
  return res.json();
}

export function stockTotal(bodegas: ContificoStock[]): number {
  const bodegaId = process.env.CONTIFICO_BODEGA_ID;
  const fuente = bodegaId
    ? bodegas.filter((b) => b.bodega_id === bodegaId)
    : bodegas;
  // v2 devuelve cantidad como string ("5.00"), parseamos por si acaso
  return fuente.reduce((sum, b) => sum + (parseFloat(String(b.cantidad)) || 0), 0);
}

export function buildDocumentoFromPedido(params: {
  fecha: string;
  personaId: string;
  descripcion: string;
  items: Array<{
    contificoId: string;
    cantidad: number;
    precio: number;
    ivaPorc: number;
  }>;
}): ContificoDocumento {
  let subtotal0 = 0;
  let subtotal12 = 0;

  const detalles: ContificoDocumentoDetalle[] = params.items.map((item) => {
    const base = item.precio * item.cantidad;
    const con_iva = item.ivaPorc > 0;
    if (con_iva) subtotal12 += base;
    else subtotal0 += base;

    return {
      producto_id: item.contificoId,
      cantidad: item.cantidad,
      precio: item.precio,
      porcentaje_iva: item.ivaPorc,
      porcentaje_descuento: 0,
      base_cero: con_iva ? 0 : base,
      base_gravable: con_iva ? base : 0,
      base_no_gravable: 0,
    };
  });

  const iva = subtotal12 * 0.12;
  const total = subtotal0 + subtotal12 + iva;

  return {
    fecha: params.fecha,
    tipo_documento: "FAC",
    pos: false,
    descripcion: params.descripcion,
    subtotal_0: Math.round(subtotal0 * 100) / 100,
    subtotal_12: Math.round(subtotal12 * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: Math.round(total * 100) / 100,
    porcentaje_descuento: 0,
    persona_id: params.personaId,
    detalles,
  };
}
