export interface ProductoImagen {
  id: string;
  path: string;
  orden: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
}

export interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoriaId: string;
  categoria: Categoria;
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
