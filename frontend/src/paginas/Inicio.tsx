import { useCallback, useEffect, useState } from "react";
import { resumen } from "../api/endpoints";
import type { MesEvolucion, ResumenMensual, ResumenPorCategoria, TipoMovimiento } from "../api/tipos";
import { GraficoEvolucion } from "../componentes/GraficoEvolucion";
import { GraficoPorCategoria } from "../componentes/GraficoPorCategoria";
import {
  finDiaLocalAIso,
  formatearFechaInput,
  formatearMoneda,
  hoyFechaInputLocal,
  inicioDiaLocalAIso,
  nombreMes,
} from "../utilidades/formato";

const OPCIONES_PERIODO = [3, 6, 12] as const;

/** Primer día del mes que arranca el período, hasta hoy: el mismo recorte
 * para ambos gráficos, así sus números siempre coinciden entre sí. */
function calcularRangoPeriodo(meses: number): { desde: string; hasta: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1);
  return {
    desde: inicioDiaLocalAIso(formatearFechaInput(inicio)),
    hasta: finDiaLocalAIso(hoyFechaInputLocal()),
  };
}

export function Inicio() {
  const ahora = new Date();

  const [mensual, setMensual] = useState<ResumenMensual | null>(null);
  const [errorMensual, setErrorMensual] = useState<string | null>(null);
  const [cargandoMensual, setCargandoMensual] = useState(true);

  const [periodo, setPeriodo] = useState<(typeof OPCIONES_PERIODO)[number]>(6);

  const [evolucion, setEvolucion] = useState<MesEvolucion[] | null>(null);
  const [errorEvolucion, setErrorEvolucion] = useState<string | null>(null);
  const [actualizandoEvolucion, setActualizandoEvolucion] = useState(true);

  const [tipoCategorias, setTipoCategorias] = useState<TipoMovimiento>("Gasto");
  const [porCategoria, setPorCategoria] = useState<ResumenPorCategoria | null>(null);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);
  const [actualizandoCategoria, setActualizandoCategoria] = useState(true);

  useEffect(() => {
    resumen
      .mensual(ahora.getFullYear(), ahora.getMonth() + 1)
      .then(setMensual)
      .catch(() => setErrorMensual("No se pudo cargar el resumen del mes."))
      .finally(() => setCargandoMensual(false));
    // Solo al montar: el mes actual no cambia mientras la página está abierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEvolucion = useCallback(async () => {
    setActualizandoEvolucion(true);
    try {
      const datos = await resumen.evolucion(periodo);
      setEvolucion(datos);
      setErrorEvolucion(null);
    } catch {
      setErrorEvolucion("No se pudo cargar la evolución.");
    } finally {
      setActualizandoEvolucion(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargarEvolucion();
  }, [cargarEvolucion]);

  const cargarPorCategoria = useCallback(async () => {
    setActualizandoCategoria(true);
    try {
      const { desde, hasta } = calcularRangoPeriodo(periodo);
      const datos = await resumen.porCategoria(tipoCategorias, desde, hasta);
      setPorCategoria(datos);
      setErrorCategoria(null);
    } catch {
      setErrorCategoria("No se pudieron cargar las categorías.");
    } finally {
      setActualizandoCategoria(false);
    }
  }, [periodo, tipoCategorias]);

  useEffect(() => {
    cargarPorCategoria();
  }, [cargarPorCategoria]);

  if (cargandoMensual) return <p className="estado-carga">Cargando resumen…</p>;
  if (errorMensual) return <p className="alerta alerta-error">{errorMensual}</p>;
  if (!mensual) return null;

  const sinMovimientosEsteMes = mensual.cantidadMovimientos === 0;

  return (
    <section>
      <h1>
        {nombreMes(mensual.mes)} {mensual.anio}
      </h1>

      {sinMovimientosEsteMes ? (
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
            <strong className="metrica-valor metrica-ingreso">
              {formatearMoneda(mensual.totalIngresos)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Gastos</span>
            <strong className="metrica-valor metrica-gasto">
              {formatearMoneda(mensual.totalGastos)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Balance</span>
            <strong
              className={`metrica-valor ${mensual.balance >= 0 ? "positivo" : "negativo"}`}
            >
              {formatearMoneda(mensual.balance)}
            </strong>
          </article>

          <article className="tarjeta metrica">
            <span className="metrica-etiqueta">Movimientos</span>
            <strong className="metrica-valor">{mensual.cantidadMovimientos}</strong>
          </article>
        </div>
      )}

      <div className="filtros filtros-periodo">
        <span className="texto-secundario">Período de los gráficos</span>
        <div className="segmentado">
          {OPCIONES_PERIODO.map((m) => (
            <button
              key={m}
              type="button"
              className={periodo === m ? "activo" : ""}
              onClick={() => setPeriodo(m)}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {errorEvolucion && <p className="alerta alerta-error">{errorEvolucion}</p>}
      {evolucion && <GraficoEvolucion datos={evolucion} actualizando={actualizandoEvolucion} />}

      {errorCategoria && <p className="alerta alerta-error">{errorCategoria}</p>}
      {porCategoria && (
        <GraficoPorCategoria
          datos={porCategoria}
          tipo={tipoCategorias}
          onCambiarTipo={setTipoCategorias}
          actualizando={actualizandoCategoria}
        />
      )}
    </section>
  );
}
