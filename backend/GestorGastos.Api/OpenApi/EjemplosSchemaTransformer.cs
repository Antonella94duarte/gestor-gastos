// OpenApi/EjemplosSchemaTransformer.cs
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace GestorGastos.Api.OpenApi;

// Los ejemplos que Swagger muestra en "Example Value". Con el generador nativo
// de .NET 10 esto va por transformers; los filtros de Swashbuckle no aplican.
public sealed class EjemplosSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(
        OpenApiSchema schema,
        OpenApiSchemaTransformerContext context,
        CancellationToken cancellationToken)
    {
        var tipo = context.JsonTypeInfo.Type;

        // En OpenAPI 3.1 el campo es "examples" (lista), no "example".
        if (tipo == typeof(CategoriaInputDto))
        {
            schema.Examples =
            [
                new JsonObject { ["nombre"] = "Supermercado", ["tipo"] = "Gasto" },
                new JsonObject { ["nombre"] = "Sueldo", ["tipo"] = "Ingreso" }
            ];
        }
        else if (tipo == typeof(CategoriaDto))
        {
            schema.Examples =
            [
                new JsonObject { ["id"] = 1, ["nombre"] = "Supermercado", ["tipo"] = "Gasto" }
            ];
        }
        else if (tipo == typeof(UsuarioCreateDto))
        {
            schema.Examples =
            [
                new JsonObject { ["email"] = "liz@ejemplo.com", ["password"] = "unaClaveSegura123" }
            ];
        }
        else if (tipo == typeof(UsuarioDto))
        {
            schema.Examples =
            [
                new JsonObject { ["id"] = 1, ["email"] = "liz@ejemplo.com" }
            ];
        }
        else if (tipo == typeof(TransaccionInputDto))
        {
            schema.Examples =
            [
                new JsonObject
                {
                    ["monto"] = 2500.50,
                    ["fecha"] = "2026-10-01T13:30:00-03:00",
                    ["descripcion"] = "Almuerzo",
                    ["categoriaId"] = 1,
                    ["usuarioId"] = 1
                }
            ];
        }
        else if (tipo == typeof(TransaccionDto))
        {
            schema.Examples =
            [
                new JsonObject
                {
                    ["id"] = 1,
                    ["monto"] = 2500.50,
                    ["fecha"] = "2026-10-01T16:30:00Z",
                    ["descripcion"] = "Almuerzo",
                    ["categoriaId"] = 1,
                    ["categoriaNombre"] = "Comida",
                    ["tipo"] = "Gasto",
                    ["usuarioId"] = 1
                }
            ];
        }
        else if (tipo == typeof(ErrorResponse))
        {
            schema.Examples =
            [
                new JsonObject
                {
                    ["mensaje"] = "La categoría 'Comida' tiene transacciones asociadas y no se puede eliminar."
                }
            ];
        }

        return Task.CompletedTask;
    }
}
