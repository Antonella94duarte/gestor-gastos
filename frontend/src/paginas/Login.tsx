import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ErrorApi } from "../api/cliente";
import { useAuth } from "../auth/useAuth";

export function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? "/";

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await iniciarSesion(email, password);
      navegar(destino, { replace: true });
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "No se pudo conectar con el servidor.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla-centrada">
      <form className="tarjeta formulario" onSubmit={manejarEnvio}>
        <h1>Iniciar sesión</h1>

        {error && <p className="alerta alerta-error">{error}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>

        <p className="texto-secundario">
          ¿No tenés cuenta? <Link to="/registro">Creá una</Link>
        </p>
      </form>
    </div>
  );
}
