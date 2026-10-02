// Dtos/UsuarioDtos.cs
using System.ComponentModel.DataAnnotations;

// Salida: sin PasswordHash. El hash no sale nunca de la base.
public record UsuarioDto(int Id, string Email);

public record UsuarioCreateDto
{
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    [MaxLength(255, ErrorMessage = "El email no puede superar los 255 caracteres.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    [MaxLength(128, ErrorMessage = "La contraseña no puede superar los 128 caracteres.")]
    public string Password { get; init; } = string.Empty;
}
