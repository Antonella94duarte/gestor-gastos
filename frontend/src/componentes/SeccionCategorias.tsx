import type { Categoria, CategoriaInput, TipoMovimiento } from "../api/tipos";
import { FilaCategoria } from "./FilaCategoria";
import { NuevaCategoria } from "./NuevaCategoria";

interface Props {
  titulo: string;
  tipo: TipoMovimiento;
  categorias: Categoria[];
  onCrear: (datos: CategoriaInput) => Promise<void>;
  onActualizar: (id: number, datos: CategoriaInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function SeccionCategorias({
  titulo,
  tipo,
  categorias,
  onCrear,
  onActualizar,
  onEliminar,
}: Props) {
  return (
    <section className="tarjeta">
      <h2>{titulo}</h2>

      {categorias.length === 0 ? (
        <p className="texto-secundario">Todavía no hay categorías de este tipo.</p>
      ) : (
        <ul className="lista-categorias">
          {categorias.map((categoria) => (
            <FilaCategoria
              key={categoria.id}
              categoria={categoria}
              onActualizar={onActualizar}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      )}

      <NuevaCategoria tipo={tipo} onCrear={onCrear} />
    </section>
  );
}
