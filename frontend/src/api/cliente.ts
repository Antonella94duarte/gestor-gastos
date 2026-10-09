const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5124";

const CLAVE_TOKEN = "gestorgastos.token";

export function leerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function borrarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN);
}

/**
 * Error de la API con el detalle ya desarmado.
 * `errores` viene de ValidationProblemDetails: un array de mensajes por campo.
 */
export class ErrorApi extends Error {
  // Declarados aparte y no como parámetros del constructor: la plantilla de
  // Vite activa erasableSyntaxOnly, que prohíbe las parameter properties.
  readonly status: number;
  readonly errores?: Record<string, string[]>;

  constructor(status: number, mensaje: string, errores?: Record<string, string[]>) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.errores = errores;
  }

  /** Mensajes de validación de un campo, para mostrarlos junto al input. */
  erroresDe(campo: string): string[] {
    if (!this.errores) return [];
    // El backend usa PascalCase en las claves de ValidationProblemDetails.
    const clave = Object.keys(this.errores).find(
      (k) => k.toLowerCase() === campo.toLowerCase(),
    );
    return clave ? this.errores[clave] : [];
  }
}

/** Se dispara cuando la API responde 401 para que la sesión se cierre sola. */
type ManejadorNoAutorizado = () => void;
let alNoAutorizar: ManejadorNoAutorizado | null = null;

export function registrarManejadorNoAutorizado(fn: ManejadorNoAutorizado): void {
  alNoAutorizar = fn;
}

interface Opciones {
  method?: string;
  body?: unknown;
  /** Las llamadas de login y registro no mandan token. */
  anonimo?: boolean;
}

export async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { method = "GET", body, anonimo = false } = opciones;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!anonimo) {
    const token = leerToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (respuesta.status === 401 && !anonimo) {
    borrarToken();
    alNoAutorizar?.();
    throw new ErrorApi(401, "La sesión expiró. Volvé a iniciar sesión.");
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      // 409 y 401 traen { mensaje }; los 400 de validación traen ProblemDetails.
      datos?.mensaje ?? datos?.title ?? `Error ${respuesta.status}`,
      datos?.errors,
    );
  }

  return datos as T;
}
