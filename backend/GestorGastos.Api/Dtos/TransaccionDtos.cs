// Dtos/TransaccionDtos.cs
using System.ComponentModel.DataAnnotations;

// Salida: incluye nombre y tipo de la categoría para que el cliente no tenga
// que pedirlos aparte. Salen del mismo join, proyectados.
public record TransaccionDto(
    int Id,
    decimal Monto,
    DateTime Fecha,
    string Descripcion,
    int CategoriaId,
    string CategoriaNombre,
    TipoMovimiento Tipo,
    int UsuarioId);

public record TransaccionInputDto
{
    [Required(ErrorMessage = "El monto es obligatorio.")]
    // ParseLimitsInInvariantCulture: sin esto, Range parsea "0.01" con la cultura
    // del sistema y revienta donde el separador decimal es la coma.
    [Range(typeof(decimal), "0.01", "9999999999999999.99",
        ParseLimitsInInvariantCulture = true,
        ErrorMessage = "El monto debe ser mayor que cero.")]
    public decimal? Monto { get; init; }

    // DateTimeOffset y no DateTime: obliga al cliente a declarar su offset y
    // evita la ambigüedad de un instante sin zona. Se guarda como UTC.
    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTimeOffset? Fecha { get; init; }

    [MaxLength(200, ErrorMessage = "La descripción no puede superar los 200 caracteres.")]
    public string Descripcion { get; init; } = string.Empty;

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    public int? CategoriaId { get; init; }

    // Pasará a salir del token con la autenticación (entregable 6).
    [Required(ErrorMessage = "El usuario es obligatorio.")]
    public int? UsuarioId { get; init; }
}
