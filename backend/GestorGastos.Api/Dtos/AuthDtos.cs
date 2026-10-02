// Dtos/AuthDtos.cs
using System.ComponentModel.DataAnnotations;

public record LoginDto
{
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Password { get; init; } = string.Empty;
}

public record TokenDto(string Token, DateTime ExpiraEn, UsuarioDto Usuario);
