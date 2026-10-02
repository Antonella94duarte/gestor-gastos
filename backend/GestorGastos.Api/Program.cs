using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using GestorGastos.Api.Auth;
using GestorGastos.Api.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

// Sin esto, "sub" llega renombrado como ClaimTypes.NameIdentifier.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Enums como texto ("Gasto") en vez de su número.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(options =>
{
    options.AddSchemaTransformer<EjemplosSchemaTransformer>();
    options.AddDocumentTransformer<SeguridadDocumentTransformer>();
    options.AddOperationTransformer<SeguridadOperationTransformer>();

    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "Gestor de Gastos API",
            Version = "v1",
            Description = "API para registrar y analizar gastos e ingresos personales."
        };
        return Task.CompletedTask;
    });
});
builder.Services.AddDbContext<GestorGastosDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// PBKDF2 con los parámetros por defecto de ASP.NET Core Identity.
builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

builder.Services.Configure<JwtOpciones>(builder.Configuration.GetSection(JwtOpciones.Seccion));
builder.Services.AddScoped<IGeneradorDeTokens, GeneradorDeTokens>();

var jwt = builder.Configuration.GetSection(JwtOpciones.Seccion).Get<JwtOpciones>()
          ?? throw new InvalidOperationException("Falta la sección 'Jwt' en la configuración.");

if (string.IsNullOrWhiteSpace(jwt.ClaveFirma))
{
    // Falla al arrancar y no al primer login, que sería mucho más confuso.
    throw new InvalidOperationException(
        "Falta 'Jwt:ClaveFirma'. Configurala con: dotnet user-secrets set \"Jwt:ClaveFirma\" \"<clave>\"");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Emisor,
            ValidAudience = jwt.Audiencia,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.ClaveFirma)),
            // Por defecto tolera 5 minutos de desfasaje al vencer el token.
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // UI en /swagger, apuntada al documento del generador nativo.
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "GestorGastos API v1");
    });
}

app.UseHttpsRedirection();

// UseAuthentication va antes que UseAuthorization: primero se identifica
// quién es, después si puede.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
