import type { TipoMovimiento } from "../api/tipos";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}

/** "Ene", "Feb"… para ejes y etiquetas donde el nombre completo no entra. */
export function nombreMesCorto(mes: number): string {
  return (MESES[mes - 1] ?? "").slice(0, 3);
}

const formateadorMoneda = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

export function formatearMoneda(monto: number): string {
  return formateadorMoneda.format(monto);
}

const formateadorCompacto = new Intl.NumberFormat("es-PY", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

/** "1,5K" en vez del monto completo: solo para marcas de eje, nunca para un valor directo. */
export function formatearCompacto(monto: number): string {
  return formateadorCompacto.format(monto);
}

const formateadorFecha = new Intl.DateTimeFormat("es-PY", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** La API devuelve UTC; se muestra en la zona del navegador. */
export function formatearFecha(iso: string): string {
  return formateadorFecha.format(new Date(iso));
}

/** Convierte un <input type="date"> en ISO con el offset local, como espera la API. */
export function fechaLocalAIso(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toISOString();
}

/**
 * Límites de un filtro por rango de fechas: a diferencia de fechaLocalAIso
 * (mediodía, para un movimiento puntual), acá importa cubrir el día entero
 * en la zona del usuario.
 */
export function inicioDiaLocalAIso(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toISOString();
}

export function finDiaLocalAIso(fecha: string): string {
  return new Date(`${fecha}T23:59:59.999`).toISOString();
}

export function formatearFechaInput(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Fecha UTC de la API a valor de <input type="date">, en la zona local. */
export function isoAFechaInputLocal(iso: string): string {
  return formatearFechaInput(new Date(iso));
}

export function hoyFechaInputLocal(): string {
  return formatearFechaInput(new Date());
}

/** "+ ₲ 1.500.000" o "- ₲ 2.500": el signo comunica el tipo sin otra columna. */
export function formatearMontoConSigno(monto: number, tipo: TipoMovimiento): string {
  const signo = tipo === "Ingreso" ? "+" : "-";
  return `${signo} ${formatearMoneda(monto)}`;
}
