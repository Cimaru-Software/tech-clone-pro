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
  pvp3?: string;
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
  cantidad: number | string;
}

export interface ContificoBodega {
  id: string;
  nombre: string;
}

export interface ContificoMovimientoDetalle {
  producto_id: string;
  cantidad: number;
  precio?: number;
  serie?: string | null;
}

export interface ContificoMovimientoInventario {
  bodega_id: string;
  tipo: "ING" | "EGR" | "TRA" | "AJU";
  fecha: string; // dd/MM/yyyy
  descripcion: string;
  detalles: ContificoMovimientoDetalle[];
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


// Calcula la existencia por producto usando el kardex de Bodega Ecommerce.
// El endpoint /producto/<ID>/stock solo incluye bodegas asociadas a un punto de
// venta, por lo que no es una fuente válida para esta bodega.
export async function getExistenciasBodegaEcommerce(): Promise<Map<string, number>> {
  const bodegaId = process.env.CONTIFICO_BODEGA_ID;
  if (!bodegaId) throw new Error("CONTIFICO_BODEGA_ID no configurado");

  const existencias = new Map<string, number>();
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
    const results: Array<{
      bodega_id: string;
      bodega_destino_id?: string | null;
      tipo: string;
      estado: string;
      detalles: Array<{ producto_id: string; cantidad: number | string }>;
    }> = data.results ?? [];

    for (const mov of results) {
      if (mov.estado !== "G") continue;
      // Contífico puede ignorar el query bodega_id e incluir otras bodegas.
      // En transferencias, la bodega ecommerce puede ser origen o destino.
      if (mov.bodega_id !== bodegaId && mov.bodega_destino_id !== bodegaId) continue;

      let signo = 0;
      if (mov.tipo === "ING" && mov.bodega_id === bodegaId) signo = 1;
      if (mov.tipo === "EGR" && mov.bodega_id === bodegaId) signo = -1;
      if (mov.tipo === "TRA" && mov.bodega_id === bodegaId) signo = -1;
      if (mov.tipo === "TRA" && mov.bodega_destino_id === bodegaId) signo = 1;
      if (signo === 0) continue;

      for (const det of mov.detalles ?? []) {
        if (!det.producto_id) continue;
        const cantidad = parseFloat(String(det.cantidad)) || 0;
        existencias.set(
          det.producto_id,
          (existencias.get(det.producto_id) ?? 0) + signo * cantidad
        );
      }
    }

    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  return existencias;
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
  // Paso 1: calcular el stock de productos de Bodega Ecommerce desde su kardex.
  const existenciasEcommerce = await getExistenciasBodegaEcommerce();

  if (existenciasEcommerce.size === 0) return [];

  // Paso 2: obtener todos los productos y filtrar por esos IDs
  const primera = await fetchProductosPage(1);
  const todos: ContificoProducto[] = [];
  const PER_PAGE = 100;
  const totalPaginas = Math.ceil(primera.count / PER_PAGE);

  for (const p of primera.results) {
    if (existenciasEcommerce.has(p.id)) todos.push(p);
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
        if (existenciasEcommerce.has(p.id)) todos.push(p);
      }
      traidos += pagina.results.length;
    }
    onProgress?.(traidos, primera.count);
  }

  // cantidad_stock del catálogo es global; se reemplaza por la existencia
  // calculada exclusivamente para Bodega Ecommerce.
  return todos.map((producto) => ({
    ...producto,
    cantidad_stock: Math.max(0, Math.trunc(existenciasEcommerce.get(producto.id) ?? 0)),
  }));
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

// Busca en Contífico el ID de la bodega por nombre (ej. "BODEGA ECOMMERCE").
// Usamos esto para resolver dinámicamente el bodega_id en vez de depender
// únicamente del env var, y para validar que CONTIFICO_BODEGA_ID corresponde
// al nombre configurado en CONTIFICO_BODEGA_NOMBRE.
export async function getBodegaPorNombre(nombre: string): Promise<ContificoBodega | null> {
  let page = 1;
  const nombreNormalizado = nombre.trim().toLowerCase();

  while (true) {
    const res = await fetch(`${BASE_URL_V1}/bodega/?format=json&page=${page}`, {
      headers: headers("sync"),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Contífico getBodegaPorNombre: ${res.status} ${text}`);
    }
    const data = await res.json();
    const results: ContificoBodega[] = data.results ?? data ?? [];

    const match = results.find((b) => b.nombre?.trim().toLowerCase() === nombreNormalizado);
    if (match) return match;

    if (data.next) {
      page++;
    } else {
      return null;
    }
  }
}

// Resuelve el bodega_id a usar para movimientos de inventario de e-commerce:
// prioriza CONTIFICO_BODEGA_ID (env) pero, si no está configurado, lo busca
// en Contífico por el nombre en CONTIFICO_BODEGA_NOMBRE ("BODEGA ECOMMERCE").
export async function resolveBodegaEcommerceId(): Promise<string> {
  const bodegaIdEnv = process.env.CONTIFICO_BODEGA_ID;
  if (bodegaIdEnv) return bodegaIdEnv;

  const nombre = process.env.CONTIFICO_BODEGA_NOMBRE || "BODEGA ECOMMERCE";
  const bodega = await getBodegaPorNombre(nombre);
  if (!bodega) throw new Error(`No se encontró en Contífico la bodega "${nombre}"`);
  return bodega.id;
}

// Crea un movimiento de egreso (EGR) en Contífico para descontar stock de
// la bodega ecommerce tras una venta facturada.
export async function crearMovimientoEgreso(
  mov: Omit<ContificoMovimientoInventario, "tipo">
): Promise<{ id: string }> {
  const body: ContificoMovimientoInventario = { ...mov, tipo: "EGR" };
  const res = await fetch(`${BASE_URL_V1}/movimiento-inventario/?format=json`, {
    method: "POST",
    headers: headers("billing"),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Contífico crearMovimientoEgreso: ${res.status} ${text}`);
  }
  return res.json();
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
    const results: Array<{
      tipo: string;
      bodega_id: string;
      detalles: Array<{ producto_id: string; serie: string | null }>;
    }> = data.results ?? [];

    for (const mov of results) {
      // No confiar únicamente en los filtros del endpoint: la API puede
      // devolver movimientos de otras bodegas o de otro tipo.
      if (mov.bodega_id !== bodegaId || mov.tipo !== "ING") continue;
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

export function getStockBodegaEcommerce(bodegas: ContificoStock[]): ContificoStock[] {
  const bodegaId = process.env.CONTIFICO_BODEGA_ID;
  if (!bodegaId) throw new Error("CONTIFICO_BODEGA_ID no configurado");

  return bodegas.filter((b) => b.bodega_id === bodegaId);
}

function sumarStock(bodegas: ContificoStock[]): number {
  // v2 devuelve cantidad como string ("5.00"), parseamos por si acaso
  return bodegas.reduce((sum, b) => sum + (parseFloat(String(b.cantidad)) || 0), 0);
}

// PVP3 de Contífico es el precio con transferencia (IVA incluido); null si no está definido.
export function getPrecioTransferenciaContifico(cp: ContificoProducto): number | null {
  const valor = parseFloat(cp.pvp3 ?? "");
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function stockTotal(bodegas: ContificoStock[]): number {
  return sumarStock(getStockBodegaEcommerce(bodegas));
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
  const bodegaNombre = process.env.CONTIFICO_BODEGA_NOMBRE || "BODEGA ECOMMERCE";
  const referenciaBodega = `BODEGA: ${bodegaNombre.toUpperCase()}`;

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
    adicional2: referenciaBodega,
    cliente: params.cliente,
    detalles,
  };
}
