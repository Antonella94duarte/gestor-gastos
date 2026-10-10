import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MesEvolucion } from "../api/tipos";
import { formatearCompacto, formatearMoneda, nombreMesCorto } from "../utilidades/formato";

interface Props {
  datos: MesEvolucion[];
  /** Mientras se recarga (cambió el selector de meses) se atenúa el gráfico
   * anterior en vez de mostrar un spinner: nada de layout jump ni flash. */
  actualizando: boolean;
}

interface PuntoGrafico {
  etiqueta: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

// Props que Recharts pasa al content de un LabelList: solo se tipan los
// campos que se usan.
interface PropsEtiquetaFinal {
  x?: number;
  y?: number;
  index?: number;
  value?: number;
}

function soloUltimoPunto(total: number) {
  return function EtiquetaFinal({ x, y, index, value }: PropsEtiquetaFinal) {
    if (index !== total - 1 || x === undefined || y === undefined) return null;
    return (
      <text x={x + 8} y={y} dy={4} fontSize={12} fill="var(--texto-suave)">
        {formatearMoneda(value ?? 0)}
      </text>
    );
  };
}

interface FilaTooltip {
  dataKey: string;
  color?: string;
  value?: number;
}

function TooltipEvolucion({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: FilaTooltip[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const porClave = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const balance = (porClave.ingresos ?? 0) - (porClave.gastos ?? 0);

  return (
    <div className="grafico-tooltip">
      <strong className="grafico-tooltip-titulo">{label}</strong>
      {payload.map((fila) => (
        <div className="grafico-tooltip-fila" key={fila.dataKey}>
          <span className="grafico-tooltip-clave" style={{ borderColor: fila.color }} />
          <span className="texto-secundario">
            {fila.dataKey === "ingresos" ? "Ingresos" : "Gastos"}
          </span>
          <strong>{formatearMoneda(fila.value ?? 0)}</strong>
        </div>
      ))}
      <div className="grafico-tooltip-fila grafico-tooltip-balance">
        <span className="texto-secundario">Balance</span>
        <strong>{formatearMoneda(balance)}</strong>
      </div>
    </div>
  );
}

export function GraficoEvolucion({ datos, actualizando }: Props) {
  const [verTabla, setVerTabla] = useState(false);

  const puntos: PuntoGrafico[] = datos.map((m) => ({
    etiqueta: `${nombreMesCorto(m.mes)} ${String(m.anio).slice(2)}`,
    ingresos: m.ingresos,
    gastos: m.gastos,
    balance: m.balance,
  }));

  const sinMovimientos = datos.every((m) => m.ingresos === 0 && m.gastos === 0);

  return (
    <div className="tarjeta grafico-tarjeta">
      <div className="grafico-encabezado">
        <h2>Evolución</h2>
        <button
          type="button"
          className="boton boton-texto boton-pequeno"
          onClick={() => setVerTabla((v) => !v)}
        >
          {verTabla ? "Ver gráfico" : "Ver tabla"}
        </button>
      </div>

      {sinMovimientos ? (
        <p className="texto-secundario">No hay movimientos en este período.</p>
      ) : verTabla ? (
        <TablaEvolucion datos={datos} />
      ) : (
        <div
          className={`grafico-contenedor ${actualizando ? "grafico-actualizando" : ""}`}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={puntos} margin={{ top: 8, right: 56, left: 0, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="var(--grafico-grilla)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="etiqueta"
                axisLine={{ stroke: "var(--grafico-eje)" }}
                tickLine={false}
                tick={{ fill: "var(--texto-suave)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--texto-suave)", fontSize: 12 }}
                tickFormatter={(v: number) => formatearCompacto(v)}
                width={48}
              />
              <Tooltip
                content={<TooltipEvolucion />}
                cursor={{ stroke: "var(--grafico-eje)", strokeWidth: 1 }}
              />
              <Legend
                iconType="plainline"
                formatter={(value) => (
                  <span className="texto-secundario">
                    {value === "ingresos" ? "Ingresos" : "Gastos"}
                  </span>
                )}
              />
              <Line
                dataKey="ingresos"
                name="ingresos"
                stroke="var(--dinero-entra)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, strokeWidth: 2, stroke: "var(--superficie)", fill: "var(--dinero-entra)" }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--superficie)" }}
                label={soloUltimoPunto(puntos.length) as never}
              />
              <Line
                dataKey="gastos"
                name="gastos"
                stroke="var(--dinero-sale)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, strokeWidth: 2, stroke: "var(--superficie)", fill: "var(--dinero-sale)" }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--superficie)" }}
                label={soloUltimoPunto(puntos.length) as never}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TablaEvolucion({ datos }: { datos: MesEvolucion[] }) {
  return (
    <table className="tabla-resumen">
      <thead>
        <tr>
          <th>Mes</th>
          <th>Ingresos</th>
          <th>Gastos</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {datos.map((m) => (
          <tr key={`${m.anio}-${m.mes}`}>
            <td>
              {nombreMesCorto(m.mes)} {m.anio}
            </td>
            <td className="celda-numero">{formatearMoneda(m.ingresos)}</td>
            <td className="celda-numero">{formatearMoneda(m.gastos)}</td>
            <td className="celda-numero">{formatearMoneda(m.balance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
