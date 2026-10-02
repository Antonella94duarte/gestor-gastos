using GestorGastos.Api.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private const string UniqueViolation = "23505";

    private readonly GestorGastosDbContext _db;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly IGeneradorDeTokens _tokens;

    public AuthController(
        GestorGastosDbContext db,
        IPasswordHasher<Usuario> hasher,
        IGeneradorDeTokens tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    /// <summary>Registra un usuario y devuelve su token.</summary>
    /// <response code="409">Ya existe un usuario con ese email.</response>
    [HttpPost("registro")]
    [ProducesResponseType(typeof(TokenDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TokenDto>> Registro(UsuarioCreateDto dto)
    {
        var usuario = new Usuario { Email = dto.Email.Trim().ToLowerInvariant() };
        usuario.PasswordHash = _hasher.HashPassword(usuario, dto.Password);

        _db.Usuarios.Add(usuario);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: UniqueViolation })
        {
            return Conflict(new ErrorResponse($"Ya existe un usuario con el email '{usuario.Email}'."));
        }

        var (token, expiraEn) = _tokens.Generar(usuario);

        return Created(
            string.Empty,
            new TokenDto(token, expiraEn, new UsuarioDto(usuario.Id, usuario.Email)));
    }

    /// <summary>Inicia sesión y devuelve un token.</summary>
    /// <response code="401">Email o contraseña incorrectos.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(TokenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TokenDto>> Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        // Mismo mensaje exista o no el usuario: decir cuál de los dos falló
        // permitiría averiguar qué emails están registrados.
        var credencialesInvalidas = new ErrorResponse("Email o contraseña incorrectos.");

        if (usuario is null) return Unauthorized(credencialesInvalidas);

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, dto.Password);

        if (resultado == PasswordVerificationResult.Failed)
        {
            return Unauthorized(credencialesInvalidas);
        }

        // El hash quedó con parámetros viejos: se actualiza aprovechando que
        // acá está la contraseña en claro.
        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.PasswordHash = _hasher.HashPassword(usuario, dto.Password);
            await _db.SaveChangesAsync();
        }

        var (token, expiraEn) = _tokens.Generar(usuario);

        return Ok(new TokenDto(token, expiraEn, new UsuarioDto(usuario.Id, usuario.Email)));
    }
}
