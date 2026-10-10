import { useState } from "react";
import { ErrorApi } from "../api/cliente";
import type { Transaccion } from "../api/tipos";
import { formatearFecha, formatearMontoConSigno } from "../utilidades/formato";

interface Props {
  transaccion: Transaccion;
  onEditar: (transaccion: Transaccion) => void;
  onEliminar: (id: number) => Promise<void>;
}

export function FilaTransaccion({ transaccion, onEditar, onEliminar }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setEliminando(true);

    try {
      await onEliminar(transaccion.id);
      // Si tiene éxito la fila desaparece sola cuando el padre recarga.
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo eliminar el movimiento.");
      setConfirmando(false);
      setEliminando(false);
    }
  }

  return (
    <tr>
      <td>{formatearFecha(transaccion.fecha)}</td>
      <td>{transaccion.categoriaNombre}</td>
      <td className="celda-descripcion">{transaccion.descripcion || "—"}</td>
      <td
        className={`celda-monto ${transaccion.tipo === "Ingreso" ? "positivo" : "negativo"}`}
      >
        {formatearMontoConSigno(transaccion.monto, transaccion.tipo)}
      </td>
      <td className="celda-acciones">
        <div className="celda-acciones-botones">
          {confirmando ? (
            <>
              <span className="texto-secundario">¿Eliminar?</span>
              <button
                className="boton boton-peligro boton-pequeno"
                onClick={confirmar}
                disabled={eliminando}
              >
                {eliminando ? "…" : "Sí"}
              </button>
              <button
                className="boton boton-secundario boton-pequeno"
                onClick={() => setConfirmando(false)}
                disabled={eliminando}
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                className="boton boton-secundario boton-pequeno"
                onClick={() => onEditar(transaccion)}
              >
                Editar
              </button>
              <button
                className="boton boton-peligro boton-pequeno"
                onClick={() => setConfirmando(true)}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
        {error && <div className="error-campo">{error}</div>}
      </td>
    </tr>
  );
}
