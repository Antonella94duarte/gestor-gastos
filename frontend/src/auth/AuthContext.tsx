import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  borrarToken,
  guardarToken,
  leerToken,
  registrarManejadorNoAutorizado,
} from "../api/cliente";
import { auth } from "../api/endpoints";
import type { Usuario } from "../api/tipos";

interface EstadoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
}

export const AuthContext = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Arranca en true: hasta validar el token guardado no se sabe si hay sesión,
  // y sin esto las rutas protegidas redirigirían al login por un instante.
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  // El cliente avisa cuando la API devuelve 401 (token vencido o inválido).
  useEffect(() => {
    registrarManejadorNoAutorizado(() => setUsuario(null));
  }, []);

  // Al recargar la página hay token pero no usuario: se recupera del servidor,
  // que de paso confirma que el token sigue siendo válido.
  useEffect(() => {
    if (!leerToken()) {
      setCargando(false);
      return;
    }

    auth
      .yo()
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const respuesta = await auth.login(email, password);
    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
  }, []);

  const registrarse = useCallback(async (email: string, password: string) => {
    const respuesta = await auth.registro(email, password);
    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, iniciarSesion, registrarse, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}
