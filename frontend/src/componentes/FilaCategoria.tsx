import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorApi } from "../api/cliente";
import type { Categoria, CategoriaInput, TipoMovimiento } from "../api/tipos";

interface Props {
  categoria: Categoria;
  onActualizar: (id: number, datos: CategoriaInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function FilaCategoria({ categoria, onActualizar, onEliminar }: Props) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(categoria.nombre);
  const [tipo, setTipo] = useState<TipoMovimiento>(categoria.tipo);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  function cancelarEdicion() {
    setEditando(false);
    setErrorEdicion(null);
    setNombre(categoria.nombre);
    setTipo(categoria.tipo);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setErrorEdicion(null);
    setGuardando(true);

    try {
      await onActualizar(categoria.id, { nombre: nombre.trim(), tipo });
      setEditando(false);
    } catch (e) {
      // El mensaje del backend ya es legible: "Ya existe una categoría
      // llamada 'X'" o "... ya tiene transacciones: no se puede cambiar
      // su tipo". Se muestra tal cual, sin casos especiales por código.
      setErrorEdicion(
        e instanceof ErrorApi ? e.message : "No se pudo guardar la categoría.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    setErrorEliminar(null);
    setEliminando(true);

    try {
      await onEliminar(categoria.id);
      // Si tiene éxito la fila desaparece sola cuando el padre recarga
      // la lista; no hace falta tocar más estado acá.
    } catch (e) {
      setErrorEliminar(
        e instanceof ErrorApi ? e.message : "No se pudo eliminar la categoría.",
      );
      setConfirmandoEliminar(false);
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <li className="fila-categoria">
        <form className="fila-categoria-edicion" onSubmit={guardar}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={100}
            aria-label="Nombre de la categoría"
            autoFocus
            required
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
            aria-label="Tipo de la categoría"
          >
            <option value="Gasto">Gasto</option>
            <option value="Ingreso">Ingreso</option>
          </select>
          <button
            type="submit"
            className="boton boton-primario boton-pequeno"
            disabled={guardando}
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            className="boton boton-secundario boton-pequeno"
            onClick={cancelarEdicion}
            disabled={guardando}
          >
            Cancelar
          </button>
        </form>
        {errorEdicion && <span className="error-campo">{errorEdicion}</span>}
      </li>
    );
  }

  return (
    <li className="fila-categoria">
      <div className="fila-categoria-principal">
        <span className="fila-categoria-nombre">{categoria.nombre}</span>

        {confirmandoEliminar ? (
          <div className="fila-categoria-acciones">
            <span className="texto-secundario">¿Eliminar?</span>
            <button
              className="boton boton-peligro boton-pequeno"
              onClick={confirmarEliminar}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando…" : "Sí"}
            </button>
            <button
              className="boton boton-secundario boton-pequeno"
              onClick={() => setConfirmandoEliminar(false)}
              disabled={eliminando}
            >
              No
            </button>
          </div>
        ) : (
          <div className="fila-categoria-acciones">
            <button
              className="boton boton-secundario boton-pequeno"
              onClick={() => setEditando(true)}
            >
              Editar
            </button>
            <button
              className="boton boton-peligro boton-pequeno"
              onClick={() => setConfirmandoEliminar(true)}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {errorEliminar && <span className="error-campo">{errorEliminar}</span>}
    </li>
  );
}
