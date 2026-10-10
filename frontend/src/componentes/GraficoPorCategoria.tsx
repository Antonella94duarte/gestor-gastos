import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoriaResumen, ResumenPorCategoria, TipoMovimiento } from "../api/tipos";
import { formatearMoneda } from "../utilidades/formato";

// Más de esta cantidad de categorías y el resto se pliega en "Otros": no es
// un límite de accesibilidad (una sola marca por barra, sin ambigüedad de
// color), es simplemente para que la lista no se vuelva interminable.
const MAXIMO_VISIBLE = 7;

interface Props {
  datos: ResumenPorCategoria;
  tipo: TipoMovimiento;
  onCambiarTipo: (tipo: TipoMovimiento) => void;
  actualizando: boolean;
}

function plegarEnOtros(categorias: CategoriaResumen[]): CategoriaResumen[] {
  if (categorias.length <= MAXIMO_VISIBLE) return categorias;

  const visibles = categorias.slice(0, MAXIMO_VISIBLE);
  const resto = categorias.slice(MAXIMO_VISIBLE);
  const otros: CategoriaResumen = {
    categoriaId: -1,
    nombre: "Otros",
    total: resto.reduce((acc, c) => acc + c.total, 0),
    porcentaje: Math.round(resto.reduce((acc, c) => acc + c.porcentaje, 0) * 100) / 100,
    cantidad: resto.reduce((acc, c) => acc + c.cantidad, 0),
  };
  return [...visibles, otros];
}

function TooltipCategoria({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoriaResumen }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const c = payload[0].payload;

  return (
    <div className="grafico-tooltip">
      <strong className="grafico-tooltip-titulo">{c.nombre}</strong>
      <div className="grafico-tooltip-fila">
        <span className="texto-secundario">Monto</span>
        <strong>{formatearMoneda(c.total)}</strong>
      </div>
      <div className="grafico-tooltip-fila">
        <span className="texto-secundario">Porcentaje</span>
        <strong>{c.porcentaje}%</strong>
      </div>
    </div>
  );
}

export function GraficoPorCategoria({ datos, tipo, onCambiarTipo, actualizando }: Props) {
  const [verTabla, setVerTabla] = useState(false);

  const filas = plegarEnOtros(datos.categorias);
  const color = tipo === "Ingreso" ? "var(--dinero-entra)" : "var(--dinero-sale)";
  const altura = Math.max(200, filas.length * 44);

  return (
    <div className="tarjeta grafico-tarjeta">
      <div className="grafico-encabezado">
        <h2>Por categoría</h2>
        <div className="grafico-controles">
          <div className="segmentado">
            <button
              type="button"
              className={tipo === "Gasto" ? "activo" : ""}
              onClick={() => onCambiarTipo("Gasto")}
            >
              Gastos
            </button>
            <button
              type="button"
              className={tipo === "Ingreso" ? "activo" : ""}
              onClick={() => onCambiarTipo("Ingreso")}
            >
              Ingresos
            </button>
          </div>
          <button
            type="button"
            className="boton boton-texto boton-pequeno"
            onClick={() => setVerTabla((v) => !v)}
          >
            {verTabla ? "Ver gráfico" : "Ver tabla"}
          </button>
        </div>
      </div>

      {filas.length === 0 ? (
        <p className="texto-secundario">
          No hay {tipo === "Gasto" ? "gastos" : "ingresos"} registrados todavía.
        </p>
      ) : verTabla ? (
        <TablaPorCategoria filas={filas} />
      ) : (
        <div
          className={`grafico-contenedor ${actualizando ? "grafico-actualizando" : ""}`}
        >
          <ResponsiveContainer width="100%" height={altura}>
            <BarChart
              data={filas}
              layout="vertical"
              margin={{ top: 4, right: 110, left: 0, bottom: 4 }}
              barCategoryGap={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nombre"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={{ fill: "var(--texto)", fontSize: 13 }}
              />
              <Tooltip content={<TooltipCategoria />} cursor={{ fill: "var(--fondo)" }} />
              <Bar dataKey="total" maxBarSize={24} radius={[0, 4, 4, 0]}>
                {filas.map((f) => (
                  <Cell key={f.categoriaId} fill={color} />
                ))}
                <LabelList
                  dataKey="total"
                  position="right"
                  content={(props) => {
                    const { x, y, width, height, index } = props as {
                      x?: number;
                      y?: number;
                      width?: number;
                      height?: number;
                      index?: number;
                    };
                    if (
                      x === undefined ||
                      y === undefined ||
                      width === undefined ||
                      height === undefined ||
                      index === undefined
                    ) {
                      return null;
                    }
                    const fila = filas[index];
                    return (
                      <text
                        x={x + width + 8}
                        y={y + height / 2}
                        dy={4}
                        fontSize={12}
                        fill="var(--texto-suave)"
                      >
                        {formatearMoneda(fila.total)} · {fila.porcentaje}%
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TablaPorCategoria({ filas }: { filas: CategoriaResumen[] }) {
  return (
    <table className="tabla-resumen">
      <thead>
        <tr>
          <th>Categoría</th>
          <th>Monto</th>
          <th>Porcentaje</th>
          <th>Movimientos</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.categoriaId}>
            <td>{f.nombre}</td>
            <td className="celda-numero">{formatearMoneda(f.total)}</td>
            <td className="celda-numero">{f.porcentaje}%</td>
            <td className="celda-numero">{f.cantidad}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
