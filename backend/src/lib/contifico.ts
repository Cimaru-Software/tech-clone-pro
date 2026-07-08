const BASE_URL_V1 = "https://api.contifico.com/sistema/api/v1";
const BASE_URL_V2 = "https://api.contifico.com/sistema/api/v2";

type ContificoContext = "sync" | "billing";

function envFor(context: ContificoContext) {
  if (context === "billing") {
    return {
      apiKey: process.env.CONTIFICO_BILLING_API_KEY,
      apiToken: process.env.CONTIFICO_BILLING_API_TOKEN,
    };
  }

  return {
    apiKey: process.env.CONTIFICO_API_KEY,
    apiToken: process.env.CONTIFICO_API_TOKEN,
  };
}

function headers(context: ContificoContext = "sync") {
  const { apiKey, apiToken } = envFor(context);
  if (!apiKey) throw new Error(`CONTIFICO_${context === "billing" ? "BILLING_" : ""}API_KEY no configurado`);

  return {
    "Content-Type": "application/json",
    Authorization: apiKey,
    ...(apiToken ? { token: apiToken } : {}),
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
  serie?: string | null;
  descripcion?: string | null;
}

export interface ContificoDocumento {
  pos: string;
  fecha_emision: string; // dd/MM/yyyy
  tipo_documento: string; // "FAC"
  documento: string;
  autorizacion: string;
  tipo_registro: "CLI";
  estado: "P" | "C";
  descripcion: string;
  subtotal_0: number;
  subtotal_12: number;
  ice: number;
  servicio: number;
  iva: number;
  total: number;
  adicional1?: string;
  adicional2?: string;
  cliente: ContificoCliente;
  detalles: ContificoDocumentoDetalle[];
}

export interface ContificoCliente {
  ruc: string;
  cedula: string;
  razon_social: string;
  telefonos: string;
  direccion: string;
  tipo: "N" | "J" | "I" | "P";
  email: string;
  es_extranjero: boolean;
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
      { headers: headers("sync"), cache: "no-store" }
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

async function fetchProductosPage(page: number): Promise<{ results: ContificoProducto[]; count: number }> {
  const res = await fetch(
    `${BASE_URL_V2}/producto/?format=json&page=${page}`,
    { headers: headers("sync"), cache: "no-store" }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico getProductos: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { results: data.results ?? [], count: data.count ?? 0 };
}

// Devuelve solo los productos que tienen movimientos en la Bodega Ecommerce.
// El catálogo completo de Contífico tiene miles de productos paginados (100/página);
// se piden las páginas en paralelo (con concurrencia limitada) para no exceder
// timeouts de proxy/CDN si se hicieran de forma secuencial.
export async function getProductos(
  onProgress?: (traidos: number, total: number) => void
): Promise<ContificoProducto[]> {
  // Paso 1: obtener IDs de productos con movimientos en bodega ecommerce
  const idsEcommerce = await getProductIdsBodegaEcommerce();

  if (idsEcommerce.size === 0) return [];

  // Paso 2: obtener todos los productos y filtrar por esos IDs
  const primera = await fetchProductosPage(1);
  const todos: ContificoProducto[] = [];
  const PER_PAGE = 100;
  const totalPaginas = Math.ceil(primera.count / PER_PAGE);

  for (const p of primera.results) {
    if (idsEcommerce.has(p.id)) todos.push(p);
  }
  onProgress?.(primera.results.length, primera.count);

  const CONCURRENCIA = 5;
  const paginasRestantes = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);

  let traidos = primera.results.length;
  for (let i = 0; i < paginasRestantes.length; i += CONCURRENCIA) {
    const lote = paginasRestantes.slice(i, i + CONCURRENCIA);
    const paginas = await Promise.all(lote.map(fetchProductosPage));
    for (const pagina of paginas) {
      for (const p of pagina.results) {
        if (idsEcommerce.has(p.id)) todos.push(p);
      }
      traidos += pagina.results.length;
    }
    onProgress?.(traidos, primera.count);
  }

  return todos;
}

export async function getProducto(id: string): Promise<ContificoProducto> {
  const res = await fetch(`${BASE_URL_V2}/producto/${id}/?format=json`, {
    headers: headers("sync"),
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
    headers: headers("sync"),
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
    headers: headers("billing"),
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico crearDocumento: ${res.status} ${text}`);
  }
  return res.json();
}


export interface ContificoSerial {
  productoId: string;
  serial: string;
}

// Devuelve los seriales que entraron a la bodega ecommerce mediante movimientos ING.
// Solo ING de la bodega ecommerce nos interesan — los EGR (ventas) los gestiona
// nuestro sistema internamente al asignar el serial a un ItemCompra aprobado.
export async function getSeriales(): Promise<ContificoSerial[]> {
  const bodegaId = process.env.CONTIFICO_BODEGA_ID;
  if (!bodegaId) throw new Error("CONTIFICO_BODEGA_ID no configurado");

  const seriales: ContificoSerial[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${BASE_URL_V2}/movimiento-inventario/?format=json&bodega_id=${bodegaId}&tipo=ING&page=${page}`,
      { headers: headers("sync"), cache: "no-store" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Contífico getSeriales: ${res.status} ${text}`);
    }
    const raw = await res.text();
    const data = JSON.parse(raw.split("\n")[0]);
    const results: Array<{ tipo: string; detalles: Array<{ producto_id: string; serie: string | null }> }> =
      data.results ?? [];

    for (const mov of results) {
      for (const det of mov.detalles ?? []) {
        if (det.serie) {
          seriales.push({ productoId: det.producto_id, serial: det.serie });
        }
      }
    }

    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  return seriales;
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
  fechaEmision: string;
  documento: string;
  autorizacion: string;
  descripcion: string;
  cliente: ContificoCliente;
  items: Array<{
    contificoId: string;
    cantidad: number;
    precio: number;
    ivaPorc: number;
    serie?: string;
  }>;
}): ContificoDocumento {
  const pos = process.env.CONTIFICO_BILLING_POS_ID || process.env.CONTIFICO_BILLING_API_TOKEN;
  if (!pos) throw new Error("CONTIFICO_BILLING_POS_ID o CONTIFICO_BILLING_API_TOKEN no configurado");

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
      ...(item.serie ? { serie: item.serie } : {}),
    };
  });

  const iva = params.items.reduce((sum, item) => {
    const base = item.precio * item.cantidad;
    return sum + (base * item.ivaPorc) / 100;
  }, 0);
  const total = subtotal0 + subtotal12 + iva;

  return {
    pos,
    fecha_emision: params.fechaEmision,
    tipo_documento: "FAC",
    documento: params.documento,
    autorizacion: params.autorizacion,
    tipo_registro: "CLI",
    estado: "C",
    descripcion: params.descripcion,
    subtotal_0: Math.round(subtotal0 * 100) / 100,
    subtotal_12: Math.round(subtotal12 * 100) / 100,
    ice: 0,
    servicio: 0,
    iva: Math.round(iva * 100) / 100,
    total: Math.round(total * 100) / 100,
    adicional1: params.descripcion,
    adicional2: "",
    cliente: params.cliente,
    detalles,
  };
}
