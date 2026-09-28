// Dtos/CategoriaDtos.cs
using System.ComponentModel.DataAnnotations;

// Salida: solo lo que se serializa, sin propiedades de navegación.
public record CategoriaDto(int Id, string Nombre, TipoMovimiento Tipo);

// Entrada: compartido por POST y PUT, que hoy aceptan los mismos campos.
public record CategoriaInputDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string Nombre { get; init; } = string.Empty;

    // Nullable a propósito: un enum no nullable tomaría 0 al faltar el campo
    // y [Required] no lo detectaría.
    [Required(ErrorMessage = "El tipo es obligatorio: Gasto o Ingreso.")]
    [EnumDataType(typeof(TipoMovimiento), ErrorMessage = "El tipo debe ser Gasto o Ingreso.")]
    public TipoMovimiento? Tipo { get; init; }
}
