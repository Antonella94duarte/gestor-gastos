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

## 3. Usuarios ✅

`feat: API de registro de usuarios con hash de contraseña`

Poder dar de alta usuarios desde el front, sin depender de scripts ni datos sembrados a mano.

| Método | Ruta | Códigos |
|---|---|---|
| GET | `/api/usuarios` | 200 |
| GET | `/api/usuarios/{id}` | 200, 404 |
| POST | `/api/usuarios` | 201, 400, 409 |

- Contraseña hasheada con `PasswordHasher<Usuario>` (PBKDF2), disponible en el framework compartido sin paquete extra
- `UsuarioDto` no expone `PasswordHash`; la contraseña en claro no se persiste ni se registra
- Email normalizado a minúsculas antes de guardar, para que el índice único no distinga mayúsculas
- Email duplicado devuelve 409 capturando la violación del índice único

Sin login ni JWT todavía: eso va en el entregable 6. El `GET` de listado es temporal y se restringirá cuando cada usuario solo pueda consultarse a sí mismo.

## 4. Transacciones ✅

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
- El `UsuarioId` se recibe en el DTO de entrada y se valida contra `Usuarios`; pasará a salir del token en el entregable 6

## 5. Resumen ✅

`feat: API de resumen con balance y totales por categoría`

Responder en qué se va la plata y si sobró a fin de mes.

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/resumen/mensual?anio=&mes=&usuarioId=&offsetHoras=` | total ingresos, total gastos, balance y cantidad |
| GET | `/api/resumen/por-categoria?desde=&hasta=&tipo=&usuarioId=` | total, cantidad y porcentaje por categoría |
| GET | `/api/resumen/evolucion?meses=&usuarioId=&offsetHoras=` | serie mensual, con los meses vacíos en cero |

- Todos aceptan `offsetHoras` para agrupar en la zona del usuario y no en UTC
- Las agregaciones se resuelven con `GROUP BY` en PostgreSQL; en C# solo quedan los porcentajes y el relleno de meses, sobre resultados ya acotados
- `por-categoria` usa `tipo=Gasto` por defecto y calcula los porcentajes sobre el total de ese tipo
- `evolucion` recorta `meses` a un máximo de 36

## 6. Autenticación ✅

`feat: autenticación con JWT y datos por usuario`

Que cada usuario vea únicamente sus propios movimientos.

| Método | Ruta | Códigos |
|---|---|---|
| POST | `/api/auth/registro` | 201, 400, 409 |
| POST | `/api/auth/login` | 200, 400, 401 |
| GET | `/api/usuarios/me` | 200, 401, 404 |

- `[Authorize]` en todos los controllers; solo `/api/auth/*` queda anónimo
- El `UsuarioId` sale del token y desapareció de los DTOs y de los query params
- Cada controller filtra desde una propiedad `MisX`, y usa `FirstOrDefaultAsync` en lugar de `FindAsync` para que un recurso ajeno dé 404
- `Categoria` tiene FK `UsuarioId` y su índice único pasó a `(UsuarioId, Nombre)`
- La clave de firma vive en user-secrets; la app no arranca si falta
- Swagger muestra el botón Authorize solo en las operaciones protegidas

## 7. Presupuestos (opcional)

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

## 8. Registro por voz (candidato, sin fecha)

`feat: registro de movimientos por voz con extracción vía LLM`

Cargar un gasto dictándolo: *"gasté 2500 en el super"*.

| Método | Ruta | Códigos |
|---|---|---|
| POST | `/api/movimientos/interpretar` | 200, 400, 422 |

Devuelve la interpretación (`monto`, `categoriaId`, `fecha`, `descripcion`) **sin guardar**: el usuario confirma y recién ahí se usa `POST /api/transacciones`.

- Dos etapas: voz → texto (Whisper, Azure Speech o Web Speech API) y texto → JSON estructurado
- **El LLM nunca genera SQL ni accede a la base.** Devuelve JSON, el código valida, y se reutilizan los endpoints existentes
- Proveedores detrás de `ITranscriptor` e `IExtractorDeMovimientos`, para poder cambiarlos y testear sin gastar tokens
- Requiere el entregable 5 (auth) hecho
