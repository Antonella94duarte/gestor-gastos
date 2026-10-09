import { useEffect, useState } from "react";
import { resumen } from "../api/endpoints";
import type { ResumenMensual } from "../api/tipos";
import { formatearMoneda, nombreMes } from "../utilidades/formato";

export function Inicio() {
  const ahora = new Date();
  const [datos, setDatos] = useState<ResumenMensual | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    resumen
      .mensual(ahora.getFullYear(), ahora.getMonth() + 1)
      .then(setDatos)
      .catch(() => setError("No se pudo cargar el resumen."))
      .finally(() => setCargando(false));
    // Solo al montar: el mes actual no cambia mientras la página está abierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) return <p className="estado-carga">Cargando resumen…</p>;
  if (error) return <p className="alerta alerta-error">{error}</p>;
  if (!datos) return null;

  const sinMovimientos = datos.cantidadMovimientos === 0;

  return (
    <section>
      <h1>
        {nombreMes(datos.mes)} {datos.anio}
      </h1>

      {sinMovimientos ? (
        <div className="tarjeta vacio">
          <p>Todavía no hay movimientos en este mes.</p>
          <p className="texto-secundario">
            Cargá el primero desde la sección Movimientos.
          </p>
        </div>
      ) : (
        <div className="grilla-metricas">
          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Ingresos</span>
            <strong className="metrica-valor positivo">
              {formatearMoneda(datos.totalIngresos)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Gastos</span>
            <strong className="metrica-valor negativo">
              {formatearMoneda(datos.totalGastos)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Balance</span>
            <strong
              className={`metrica-valor ${datos.balance >= 0 ? "positivo" : "negativo"}`}
            >
              {formatearMoneda(datos.balance)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Movimientos</span>
            <strong className="metrica-valor">{datos.cantidadMovimientos}</strong>
          </article>
        </div>
      )}
    </section>
  );
}
