import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function Layout() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="layout">
      <header className="encabezado">
        <div className="encabezado-contenido">
          <span className="marca">Gestor de Gastos</span>

          <nav className="navegacion">
            <NavLink to="/" end>
              Resumen
            </NavLink>
            <NavLink to="/transacciones">Movimientos</NavLink>
            <NavLink to="/categorias">Categorías</NavLink>
          </nav>

          <div className="sesion">
            <span className="texto-secundario">{usuario?.email}</span>
            <button className="boton boton-texto" onClick={cerrarSesion}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
