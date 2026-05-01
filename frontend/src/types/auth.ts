export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
}

export interface AuthState {
  cliente: Cliente | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
