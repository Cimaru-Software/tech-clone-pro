export interface ProductoImagen {
  id: string;
  path: string;
  orden: number;
}

export interface Subcategoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  categoriaId: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  subcategorias?: Subcategoria[];
}

export interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoriaId: string;
  categoria: Categoria;
  subcategoriaId?: string | null;
  subcategoria?: Subcategoria | null;
  descripcion: string;
  precio: number;
  descuento: number;
  destacado: boolean;
  imagenes: ProductoImagen[];
  estado: "ACTIVO" | "INACTIVO";
  stock: number;
  createdAt: string;
  updatedAt: string;
}
