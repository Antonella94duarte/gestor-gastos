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
