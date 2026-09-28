# Gestor de Gastos Personales

API REST para registrar gastos personales: usuarios, categorías y transacciones.

.NET 10 · ASP.NET Core · EF Core 10 · PostgreSQL 18 · Swagger UI

## Requisitos

- .NET SDK 10.0
- Docker Desktop
- `dotnet-ef`: `dotnet tool install --global dotnet-ef`

## Puesta en marcha

**1. Base de datos**

```bash
docker compose up -d
```

Levanta PostgreSQL 18 en `127.0.0.1:5433`. La base y el usuario se crean solos en el primer arranque.

**2. Migraciones**

```bash
cd backend/GestorGastos.Api
dotnet ef database update
```

**3. API**

```bash
dotnet run --launch-profile http
```

Swagger UI: <http://localhost:5124/swagger>

## Comandos

```bash
# base de datos
docker compose up -d                    # levantar
docker compose down                     # apagar (conserva datos)
docker compose down -v                  # apagar y borrar datos
docker exec -it gestorgastos-db psql -U postgres -d gestorgastos

# migraciones (desde backend/GestorGastos.Api/)
dotnet ef migrations add <Nombre>
dotnet ef database update
dotnet ef migrations remove

# app
dotnet build
dotnet run --launch-profile http        # http://localhost:5124
dotnet run --launch-profile https       # https://localhost:7133
```

## Configuración

Cadena de conexión en `backend/GestorGastos.Api/appsettings.json`. Debe coincidir con las credenciales de `docker-compose.yml`.

Se usa el puerto 5433 para no chocar con una instalación nativa de PostgreSQL en el 5432.

Las credenciales están en claro porque es una base local de desarrollo expuesta solo en `127.0.0.1`. Fuera de desarrollo, usar `dotnet user-secrets` o la variable `ConnectionStrings__DefaultConnection`.

## Problemas frecuentes

**`dotnet ef` no se encuentra** — La herramienta se instala en `%USERPROFILE%\.dotnet\tools`. Agregá esa carpeta al PATH o invocá el ejecutable por ruta completa.

**`MSB1003: Especifique un archivo de proyecto`** — No hay `.sln`. Los comandos `dotnet` van desde `backend/GestorGastos.Api/`.

**`28P01: la autentificación password falló`** — Verificá que la cadena de conexión use `Port=5433`. Las variables `POSTGRES_*` solo aplican al crear el volumen: si cambiaste credenciales, recreá con `docker compose down -v && docker compose up -d`.

**Contenedor `unhealthy`** — El volumen debe montarse en `/var/lib/postgresql`, no en `/var/lib/postgresql/data`. PostgreSQL 18 cambió esa convención.

**El pull de la imagen falla con `EOF`** — El CDN de Docker Hub no es alcanzable. Usar el mirror:

```bash
docker pull mirror.gcr.io/library/postgres:18
docker tag mirror.gcr.io/library/postgres:18 postgres:18
```

**`Build failed` al crear una migración** — `migrations add` compila primero. Corré `dotnet build` para ver el error real.

## Estructura

```
gestor-gastos/
├─ docker-compose.yml
└─ backend/GestorGastos.Api/
   ├─ Models/           # Usuario, Categoria, Transaccion
   ├─ Data/             # GestorGastosDbContext
   ├─ Controllers/
   ├─ Migrations/
   ├─ Program.cs
   └─ appsettings.json
```
