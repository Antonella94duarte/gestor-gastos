import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorApi } from "../api/cliente";
import type { CategoriaInput, TipoMovimiento } from "../api/tipos";

interface Props {
  tipo: TipoMovimiento;
  onCrear: (datos: CategoriaInput) => Promise<void>;
}

export function NuevaCategoria({ tipo, onCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await onCrear({ nombre: nombre.trim(), tipo });
      setNombre("");
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "No se pudo crear la categoría.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="nueva-categoria">
      <form className="form-inline" onSubmit={manejarEnvio}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={
            tipo === "Gasto" ? "Nueva categoría de gasto" : "Nueva categoría de ingreso"
          }
          maxLength={100}
          aria-label={`Nombre de la nueva categoría de ${tipo.toLowerCase()}`}
          required
        />
        <button
          type="submit"
          className="boton boton-primario boton-pequeno"
          disabled={enviando}
        >
          {enviando ? "Agregando…" : "Agregar"}
        </button>
      </form>
      {error && <p className="error-campo">{error}</p>}
    </div>
  );
}
