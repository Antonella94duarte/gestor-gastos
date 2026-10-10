import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorApi } from "../api/cliente";
import type { Categoria, TipoMovimiento, Transaccion, TransaccionInput } from "../api/tipos";
import { fechaLocalAIso, hoyFechaInputLocal, isoAFechaInputLocal } from "../utilidades/formato";

interface Props {
  categorias: Categoria[];
  /** Si viene, el formulario edita ese movimiento en vez de crear uno nuevo. */
  transaccion?: Transaccion;
  onGuardar: (datos: TransaccionInput) => Promise<void>;
  onCancelar: () => void;
}

export function FormularioTransaccion({
  categorias,
  transaccion,
  onGuardar,
  onCancelar,
}: Props) {
  const esEdicion = transaccion !== undefined;

  const [tipo, setTipo] = useState<TipoMovimiento>(transaccion?.tipo ?? "Gasto");
  const [categoriaId, setCategoriaId] = useState<number | "">(transaccion?.categoriaId ?? "");
  const [monto, setMonto] = useState(transaccion ? String(transaccion.monto) : "");
  const [fecha, setFecha] = useState(
    transaccion ? isoAFechaInputLocal(transaccion.fecha) : hoyFechaInputLocal(),
  );
  const [descripcion, setDescripcion] = useState(transaccion?.descripcion ?? "");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string[]>>({});

  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  // Cambiar el tipo filtra las categorías visibles; si la que estaba
  // elegida no es de ese tipo, se limpia para no enviar una incoherente.
  function cambiarTipo(nuevoTipo: TipoMovimiento) {
    setTipo(nuevoTipo);
    if (!categorias.some((c) => c.id === categoriaId && c.tipo === nuevoTipo)) {
      setCategoriaId("");
    }
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setErroresCampo({});

    if (categoriaId === "") {
      setErroresCampo({ categoriaId: ["Elegí una categoría."] });
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        monto: Number(monto),
        fecha: fechaLocalAIso(fecha),
        descripcion: descripcion.trim(),
        categoriaId,
      });
    } catch (e) {
      if (e instanceof ErrorApi) {
        setErroresCampo({
          monto: e.erroresDe("monto"),
          fecha: e.erroresDe("fecha"),
          categoriaId: e.erroresDe("categoriaId"),
        });
        if (!e.errores) setError(e.message);
      } else {
        setError("No se pudo guardar el movimiento.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta formulario-transaccion" onSubmit={manejarEnvio}>
      <h2>{esEdicion ? "Editar movimiento" : "Nuevo movimiento"}</h2>

      {error && <p className="alerta alerta-error">{error}</p>}

      <div className="formulario-grilla">
        <label>
          Tipo
          <select
            value={tipo}
            onChange={(e) => cambiarTipo(e.target.value as TipoMovimiento)}
          >
            <option value="Gasto">Gasto</option>
            <option value="Ingreso">Ingreso</option>
          </select>
        </label>

        <label>
          Categoría
          <select
            value={categoriaId}
            onChange={(e) =>
              setCategoriaId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Elegir…</option>
            {categoriasDelTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {erroresCampo.categoriaId?.map((m) => (
            <span key={m} className="error-campo">
              {m}
            </span>
          ))}
          {categoriasDelTipo.length === 0 && (
            <span className="texto-ayuda">
              No hay categorías de {tipo.toLowerCase()} todavía.
            </span>
          )}
        </label>

        <label>
          Monto
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
          {erroresCampo.monto?.map((m) => (
            <span key={m} className="error-campo">
              {m}
            </span>
          ))}
        </label>

        <label>
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          {erroresCampo.fecha?.map((m) => (
            <span key={m} className="error-campo">
              {m}
            </span>
          ))}
        </label>

        <label className="formulario-grilla-ancho-completo">
          Descripción
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={200}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="formulario-acciones">
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agregar movimiento"}
        </button>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
