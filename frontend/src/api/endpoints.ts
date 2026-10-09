import { pedir } from "./cliente";
import type {
  Categoria,
  CategoriaInput,
  MesEvolucion,
  RespuestaToken,
  ResultadoPaginado,
  ResumenMensual,
  ResumenPorCategoria,
  Transaccion,
  TransaccionInput,
  TipoMovimiento,
  Usuario,
} from "./tipos";

export const auth = {
  registro: (email: string, password: string) =>
    pedir<RespuestaToken>("/api/auth/registro", {
      method: "POST",
      body: { email, password },
      anonimo: true,
    }),

  login: (email: string, password: string) =>
    pedir<RespuestaToken>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      anonimo: true,
    }),

  yo: () => pedir<Usuario>("/api/usuarios/me"),
};

export const categorias = {
  listar: (tipo?: TipoMovimiento) =>
    pedir<Categoria[]>(`/api/categorias${tipo ? `?tipo=${tipo}` : ""}`),

  obtener: (id: number) => pedir<Categoria>(`/api/categorias/${id}`),

  crear: (datos: CategoriaInput) =>
    pedir<Categoria>("/api/categorias", { method: "POST", body: datos }),

  actualizar: (id: number, datos: CategoriaInput) =>
    pedir<void>(`/api/categorias/${id}`, { method: "PUT", body: datos }),

  eliminar: (id: number) =>
    pedir<void>(`/api/categorias/${id}`, { method: "DELETE" }),
};

export interface FiltrosTransacciones {
  categoriaId?: number;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  pagina?: number;
  tamano?: number;
}

export const transacciones = {
  listar: (filtros: FiltrosTransacciones = {}) => {
    const qs = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== "") qs.set(clave, String(valor));
    }
    const sufijo = qs.toString() ? `?${qs}` : "";
    return pedir<ResultadoPaginado<Transaccion>>(`/api/transacciones${sufijo}`);
  },

  obtener: (id: number) => pedir<Transaccion>(`/api/transacciones/${id}`),

  crear: (datos: TransaccionInput) =>
    pedir<Transaccion>("/api/transacciones", { method: "POST", body: datos }),

  actualizar: (id: number, datos: TransaccionInput) =>
    pedir<void>(`/api/transacciones/${id}`, { method: "PUT", body: datos }),

  eliminar: (id: number) =>
    pedir<void>(`/api/transacciones/${id}`, { method: "DELETE" }),
};

// El backend agrupa en UTC salvo que se le diga la zona del usuario.
const offsetHoras = -new Date().getTimezoneOffset() / 60;

export const resumen = {
  mensual: (anio: number, mes: number) =>
    pedir<ResumenMensual>(
      `/api/resumen/mensual?anio=${anio}&mes=${mes}&offsetHoras=${offsetHoras}`,
    ),

  porCategoria: (tipo: TipoMovimiento = "Gasto", desde?: string, hasta?: string) => {
    const qs = new URLSearchParams({ tipo });
    if (desde) qs.set("desde", desde);
    if (hasta) qs.set("hasta", hasta);
    return pedir<ResumenPorCategoria>(`/api/resumen/por-categoria?${qs}`);
  },

  evolucion: (meses = 12) =>
    pedir<MesEvolucion[]>(
      `/api/resumen/evolucion?meses=${meses}&offsetHoras=${offsetHoras}`,
    ),
};
