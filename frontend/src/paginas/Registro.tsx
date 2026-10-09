import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ErrorApi } from "../api/cliente";
import { useAuth } from "../auth/useAuth";

export function Registro() {
  const { usuario, registrarse } = useAuth();
  const navegar = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string[]>>({});
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setErroresCampo({});
    setEnviando(true);

    try {
      await registrarse(email, password);
      navegar("/", { replace: true });
    } catch (e) {
      if (e instanceof ErrorApi) {
        // Los 400 traen los mensajes por campo; el resto es un mensaje suelto.
        setErroresCampo({
          email: e.erroresDe("email"),
          password: e.erroresDe("password"),
        });
        if (!e.errores) setError(e.message);
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla-centrada">
      <form className="tarjeta formulario" onSubmit={manejarEnvio}>
        <h1>Crear cuenta</h1>

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
          {erroresCampo.email?.map((m) => (
            <span key={m} className="error-campo">
              {m}
            </span>
          ))}
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {erroresCampo.password?.map((m) => (
            <span key={m} className="error-campo">
              {m}
            </span>
          ))}
          <span className="texto-ayuda">Mínimo 8 caracteres.</span>
        </label>

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Creando…" : "Crear cuenta"}
        </button>

        <p className="texto-secundario">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
}
