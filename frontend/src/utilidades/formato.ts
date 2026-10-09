const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}

const formateadorMoneda = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

export function formatearMoneda(monto: number): string {
  return formateadorMoneda.format(monto);
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
