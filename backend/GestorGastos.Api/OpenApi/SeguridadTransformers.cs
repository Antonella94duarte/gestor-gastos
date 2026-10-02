// OpenApi/SeguridadTransformers.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace GestorGastos.Api.OpenApi;

// Declara el esquema Bearer una vez, para que Swagger muestre el botón Authorize.
public sealed class SeguridadDocumentTransformer : IOpenApiDocumentTransformer
{
    public const string Esquema = "Bearer";

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes[Esquema] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Token devuelto por /api/auth/login. Swagger agrega el prefijo 'Bearer'."
        };

        return Task.CompletedTask;
    }
}

// Marca como protegidas solo las operaciones que realmente lo están.
public sealed class SeguridadOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        var metadata = context.Description.ActionDescriptor.EndpointMetadata;

        var requiereAuth = metadata.OfType<IAuthorizeData>().Any()
                           && !metadata.OfType<IAllowAnonymous>().Any();

        if (!requiereAuth) return Task.CompletedTask;

        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(SeguridadDocumentTransformer.Esquema)] = []
            }
        ];

        return Task.CompletedTask;
    }
}
