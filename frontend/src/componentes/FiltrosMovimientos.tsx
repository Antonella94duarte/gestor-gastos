import type { Categoria, TipoMovimiento } from "../api/tipos";

export interface FiltrosEstado {
  categoriaId: number | "";
  tipo: TipoMovimiento | "";
  desde: string;
  hasta: string;
}

export const FILTROS_VACIOS: FiltrosEstado = {
  categoriaId: "",
  tipo: "",
  desde: "",
  hasta: "",
};

interface Props {
  categorias: Categoria[];
  filtros: FiltrosEstado;
  onCambiar: (filtros: FiltrosEstado) => void;
}

export function FiltrosMovimientos({ categorias, filtros, onCambiar }: Props) {
  function actualizar(cambios: Partial<FiltrosEstado>) {
    onCambiar({ ...filtros, ...cambios });
  }

  const hayFiltrosActivos =
    filtros.categoriaId !== "" ||
    filtros.tipo !== "" ||
    filtros.desde !== "" ||
    filtros.hasta !== "";

  return (
    <div className="tarjeta filtros">
      <label>
        Tipo
        <select
          value={filtros.tipo}
          onChange={(e) => actualizar({ tipo: e.target.value as TipoMovimiento | "" })}
        >
          <option value="">Todos</option>
          <option value="Gasto">Gastos</option>
          <option value="Ingreso">Ingresos</option>
        </select>
      </label>

      <label>
        Categoría
        <select
          value={filtros.categoriaId}
          onChange={(e) =>
            actualizar({ categoriaId: e.target.value ? Number(e.target.value) : "" })
          }
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.tipo})
            </option>
          ))}
        </select>
      </label>

      <label>
        Desde
        <input
          type="date"
          value={filtros.desde}
          onChange={(e) => actualizar({ desde: e.target.value })}
        />
      </label>

      <label>
        Hasta
        <input
          type="date"
          value={filtros.hasta}
          onChange={(e) => actualizar({ hasta: e.target.value })}
        />
      </label>

      {hayFiltrosActivos && (
        <button
          type="button"
          className="boton boton-texto"
          onClick={() => onCambiar(FILTROS_VACIOS)}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
