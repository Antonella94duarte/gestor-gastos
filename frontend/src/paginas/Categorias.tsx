import { useCallback, useEffect, useState } from "react";
import { categorias as api } from "../api/endpoints";
import type { Categoria, CategoriaInput } from "../api/tipos";
import { SeccionCategorias } from "../componentes/SeccionCategorias";

export function Categorias() {
  const [gastos, setGastos] = useState<Categoria[]>([]);
  const [ingresos, setIngresos] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      const [g, i] = await Promise.all([api.listar("Gasto"), api.listar("Ingreso")]);
      setGastos(g);
      setIngresos(i);
      setErrorCarga(null);
    } catch {
      setErrorCarga("No se pudieron cargar las categorías.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Estas tres funciones no atrapan errores: los componentes hijos
  // (NuevaCategoria, FilaCategoria) sí lo hacen, para mostrar el mensaje
  // junto al formulario o la fila que falló sin tocar el resto de la página.
  // recargar() nunca rechaza: si la actualización falla, solo deja el
  // banner de errorCarga encendido.
  async function crear(datos: CategoriaInput) {
    await api.crear(datos);
    await recargar();
  }

  async function actualizar(id: number, datos: CategoriaInput) {
    await api.actualizar(id, datos);
    // Recarga ambas listas y no solo la del tipo editado: si el tipo
    // cambió, la categoría pasa de una sección a la otra.
    await recargar();
  }

  async function eliminar(id: number) {
    await api.eliminar(id);
    await recargar();
  }

  if (cargando) return <p className="estado-carga">Cargando categorías…</p>;

  return (
    <section>
      <h1>Categorías</h1>

      {errorCarga && <p className="alerta alerta-error">{errorCarga}</p>}

      <div className="pila">
        <SeccionCategorias
          titulo="Gastos"
          tipo="Gasto"
          categorias={gastos}
          onCrear={crear}
          onActualizar={actualizar}
          onEliminar={eliminar}
        />
        <SeccionCategorias
          titulo="Ingresos"
          tipo="Ingreso"
          categorias={ingresos}
          onCrear={crear}
          onActualizar={actualizar}
          onEliminar={eliminar}
        />
      </div>
    </section>
  );
}
