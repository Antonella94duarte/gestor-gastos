# Roadmap

Plan de trabajo por entregables. Cada entregable es un commit que deja la API en un estado funcional y demostrable.

---

## 1. Categorías ✅

`feat: API de categorías con PostgreSQL, EF Core y Swagger UI`

Clasificar los movimientos y distinguir gastos de ingresos.

| Método | Ruta | Códigos |
|---|---|---|
| GET | `/api/categorias?tipo=` | 200 |
| GET | `/api/categorias/{id}` | 200, 404 |
| POST | `/api/categorias` | 201, 400, 409 |
| PUT | `/api/categorias/{id}` | 204, 400, 404, 409 |
| DELETE | `/api/categorias/{id}` | 204, 404, 409 |

- Enum `TipoMovimiento` (Gasto / Ingreso) en `Categoria`
- FK hacia `Categoria` en `Restrict`: borrar una categoría en uso devuelve 409
- Cambiar el tipo de una categoría con transacciones devuelve 409
- Índices únicos en `Usuario.Email` y `Categoria.Nombre`

## 2. Documentación y ejemplos en Swagger ✅

`docs: documenta respuestas y agrega ejemplos en Swagger`

Que quien abra el Swagger sepa qué devuelve cada endpoint, incluidos los errores.

- `[ProducesResponseType]` en las 5 acciones con todos sus códigos
- `ErrorResponse` tipado en lugar de objetos anónimos
- Ejemplos de request y response vía `IOpenApiSchemaTransformer`
- Título, versión y descripción del documento
- `GenerateDocumentationFile` para que los `/// summary` lleguen a OpenAPI

## 3. Transacciones

`feat: API de transacciones con filtros y paginación`

Registrar cada gasto o ingreso y consultar el historial sin traer todo.

| Método | Ruta | Códigos |
|---|---|---|
| GET | `/api/transacciones` | 200 |
| GET | `/api/transacciones/{id}` | 200, 404 |
| POST | `/api/transacciones` | 201, 400 |
| PUT | `/api/transacciones/{id}` | 204, 400, 404 |
| DELETE | `/api/transacciones/{id}` | 204, 404 |

Filtros del listado: `desde`, `hasta`, `categoriaId`, `tipo`, `pagina`, `tamano`.

Decisiones a resolver:

- **Paginación obligatoria**: el listado crece sin techo. Respuesta `{ items, total, pagina, tamano }`
- El filtro por rango de fechas es lo que justifica el índice `(UsuarioId, Fecha)`; verificar con `EXPLAIN` que lo use
- `Fecha` siempre en UTC, o Npgsql rechaza el `timestamptz`
- Validar que la categoría exista antes de insertar, para no devolver un 500 por violación de FK
- `Monto` mayor que cero; el tipo lo define la categoría
- **Prerequisito:** sembrar un usuario de prueba, porque `UsuarioId` es obligatorio y todavía no hay endpoint de usuarios

## 4. Resumen

`feat: API de resumen con balance y totales por categoría`

Responder en qué se va la plata y si sobró a fin de mes.

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/resumen/mensual?anio=&mes=` | total ingresos, total gastos, balance |
| GET | `/api/resumen/por-categoria?desde=&hasta=` | total y porcentaje por categoría |
| GET | `/api/resumen/evolucion?meses=12` | serie mensual para graficar |

Las agregaciones se hacen con `GROUP BY` en PostgreSQL, nunca trayendo filas a memoria. El tipo (gasto o ingreso) sale del join con `Categorias`.

## 5. Autenticación

`feat: autenticación con JWT y datos por usuario`

Que cada usuario vea únicamente sus propios movimientos.

| Método | Ruta | Códigos |
|---|---|---|
| POST | `/api/auth/registro` | 201, 400, 409 |
| POST | `/api/auth/login` | 200, 401 |

Modifica los entregables anteriores, y por eso va último:

- `[Authorize]` en todos los controllers
- El `UsuarioId` sale del token y desaparece de los DTOs de entrada
- Cada consulta se filtra por el usuario autenticado
- `Categoria` pasa a tener FK `UsuarioId`, y el índice único `Nombre` se convierte en `(UsuarioId, Nombre)`
- Hash de contraseña con `PasswordHasher` o BCrypt
- La clave de firma del JWT va en `user-secrets`, nunca en `appsettings.json`

## 6. Presupuestos (opcional)

`feat: API de presupuestos con control de excedentes`

Fijar un tope mensual por categoría y saber cuánto queda disponible.

| Método | Ruta | Códigos |
|---|---|---|
| GET | `/api/presupuestos` | 200 |
| POST | `/api/presupuestos` | 201, 400, 409 |
| PUT | `/api/presupuestos/{id}` | 204, 400, 404 |
| DELETE | `/api/presupuestos/{id}` | 204, 404 |
| GET | `/api/presupuestos/estado?anio=&mes=` | presupuestado, gastado y disponible por categoría |

Convierte la aplicación de registro histórico en herramienta de control.
