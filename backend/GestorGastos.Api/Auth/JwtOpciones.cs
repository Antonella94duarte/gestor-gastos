// Auth/JwtOpciones.cs
namespace GestorGastos.Api.Auth;

public class JwtOpciones
{
    public const string Seccion = "Jwt";

    public string Emisor { get; set; } = string.Empty;
    public string Audiencia { get; set; } = string.Empty;
    public int MinutosExpiracion { get; set; } = 480;

    // Solo desde user-secrets o variable de entorno; nunca en appsettings.json.
    public string ClaveFirma { get; set; } = string.Empty;
}
