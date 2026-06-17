export interface ProductoImagen {
  id: string;
  path: string;
  orden: number;
}

export interface Subsubcategoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  subcategoriaId: string;
}

export interface Subcategoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  categoriaId: string;
  subsubcategorias?: Subsubcategoria[];
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
  subsubcategoriaId?: string | null;
  subsubcategoria?: Subsubcategoria | null;
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
