import { useCallback, useEffect, useState } from "react";
import { categorias as apiCategorias, transacciones as apiTransacciones } from "../api/endpoints";
import type { Categoria, ResultadoPaginado, Transaccion, TransaccionInput } from "../api/tipos";
import { FilaTransaccion } from "../componentes/FilaTransaccion";
import { FiltrosMovimientos, FILTROS_VACIOS } from "../componentes/FiltrosMovimientos";
import type { FiltrosEstado } from "../componentes/FiltrosMovimientos";
import { FormularioTransaccion } from "../componentes/FormularioTransaccion";
import { finDiaLocalAIso, inicioDiaLocalAIso } from "../utilidades/formato";

const TAMANO_POR_DEFECTO = 20;

export function Transacciones() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltros] = useState<FiltrosEstado>(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [tamano] = useState(TAMANO_POR_DEFECTO);
  const [datos, setDatos] = useState<ResultadoPaginado<Transaccion> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  // null = cerrado, "nueva" = alta, Transaccion = edición de esa fila.
  const [formulario, setFormulario] = useState<Transaccion | "nueva" | null>(null);

  useEffect(() => {
    apiCategorias.listar().then(setCategorias).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await apiTransacciones.listar({
        pagina,
        tamano,
        categoriaId: filtros.categoriaId === "" ? undefined : filtros.categoriaId,
        tipo: filtros.tipo === "" ? undefined : filtros.tipo,
        desde: filtros.desde ? inicioDiaLocalAIso(filtros.desde) : undefined,
        hasta: filtros.hasta ? finDiaLocalAIso(filtros.hasta) : undefined,
      });
      setDatos(resultado);
      setErrorCarga(null);
    } catch {
      setErrorCarga("No se pudieron cargar los movimientos.");
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina, tamano]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiarFiltros(nuevos: FiltrosEstado) {
    setFiltros(nuevos);
    setPagina(1);
  }

  // crear/actualizar no atrapan errores: FormularioTransaccion sí, para
  // mostrarlos junto al campo que falló sin cerrar el formulario.
  async function crear(datosForm: TransaccionInput) {
    await apiTransacciones.crear(datosForm);
    setFormulario(null);
    // Orden por fecha descendente: lo recién cargado suele quedar arriba.
    setPagina(1);
    await cargar();
  }

  async function actualizar(id: number, datosForm: TransaccionInput) {
    await apiTransacciones.actualizar(id, datosForm);
    setFormulario(null);
    await cargar();
  }

  async function eliminar(id: number) {
    await apiTransacciones.eliminar(id);
    // Si era la última fila de una página que no es la primera, retrocede
    // una para no quedar mirando una página vacía. Cambiar `pagina` ya
    // dispara `cargar()` solo, vía su dependencia en el useCallback.
    if (datos && datos.items.length === 1 && pagina > 1) {
      setPagina((p) => p - 1);
    } else {
      await cargar();
    }
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamano)) : 1;

  return (
    <section>
      <div className="encabezado-seccion">
        <h1>Movimientos</h1>
        {!formulario && (
          <button className="boton boton-primario" onClick={() => setFormulario("nueva")}>
            + Nuevo movimiento
          </button>
        )}
      </div>

      {formulario && (
        <FormularioTransaccion
          categorias={categorias}
          transaccion={formulario === "nueva" ? undefined : formulario}
          onGuardar={(datosForm) =>
            formulario === "nueva" ? crear(datosForm) : actualizar(formulario.id, datosForm)
          }
          onCancelar={() => setFormulario(null)}
        />
      )}

      <FiltrosMovimientos categorias={categorias} filtros={filtros} onCambiar={cambiarFiltros} />

      {errorCarga && <p className="alerta alerta-error">{errorCarga}</p>}

      {cargando ? (
        <p className="estado-carga">Cargando movimientos…</p>
      ) : !datos || datos.items.length === 0 ? (
        <div className="tarjeta vacio">
          <p>No hay movimientos con estos filtros.</p>
        </div>
      ) : (
        <div className="tarjeta tabla-contenedor">
          <table className="tabla-transacciones">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos.items.map((t) => (
                <FilaTransaccion
                  key={t.id}
                  transaccion={t}
                  onEditar={setFormulario}
                  onEliminar={eliminar}
                />
              ))}
            </tbody>
          </table>

          <div className="paginacion">
            <span className="texto-secundario">
              {datos.total} movimiento{datos.total === 1 ? "" : "s"} · página {pagina} de{" "}
              {totalPaginas}
            </span>
            <div className="paginacion-botones">
              <button
                className="boton boton-secundario boton-pequeno"
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina <= 1}
              >
                Anterior
              </button>
              <button
                className="boton boton-secundario boton-pequeno"
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina >= totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
