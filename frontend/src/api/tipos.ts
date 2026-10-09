// Espejo de los DTOs del backend. Si cambia un DTO, se actualiza acá.

export type TipoMovimiento = "Gasto" | "Ingreso";

export interface Usuario {
  id: number;
  email: string;
}

export interface RespuestaToken {
  token: string;
  expiraEn: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  tipo: TipoMovimiento;
}

export interface CategoriaInput {
  nombre: string;
  tipo: TipoMovimiento;
}

export interface Transaccion {
  id: number;
  monto: number;
  fecha: string;
  descripcion: string;
  categoriaId: number;
  categoriaNombre: string;
  tipo: TipoMovimiento;
}

export interface TransaccionInput {
  monto: number;
  fecha: string;
  descripcion: string;
  categoriaId: number;
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface ResumenMensual {
  anio: number;
  mes: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  cantidadMovimientos: number;
}

export interface CategoriaResumen {
  categoriaId: number;
  nombre: string;
  total: number;
  porcentaje: number;
  cantidad: number;
}

export interface ResumenPorCategoria {
  tipo: TipoMovimiento;
  total: number;
  categorias: CategoriaResumen[];
}

export interface MesEvolucion {
  anio: number;
  mes: number;
  ingresos: number;
  gastos: number;
  balance: number;
}
