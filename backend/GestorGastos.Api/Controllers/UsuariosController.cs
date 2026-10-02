using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Produces("application/json")]
public class UsuariosController : ControllerBase
{
    private const string UniqueViolation = "23505";

    private readonly GestorGastosDbContext _db;
    private readonly IPasswordHasher<Usuario> _hasher;

    public UsuariosController(GestorGastosDbContext db, IPasswordHasher<Usuario> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    /// <summary>Lista los usuarios registrados.</summary>
    /// <remarks>
    /// Temporal: con autenticación, cada usuario solo podrá consultarse a sí mismo.
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UsuarioDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> Get()
    {
        var usuarios = await _db.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .Select(u => new UsuarioDto(u.Id, u.Email))
            .ToListAsync();

        return Ok(usuarios);
    }

    /// <summary>Obtiene un usuario por su id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UsuarioDto>> GetById(int id)
    {
        var usuario = await _db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UsuarioDto(u.Id, u.Email))
            .FirstOrDefaultAsync();

        return usuario is null ? NotFound() : Ok(usuario);
    }

    /// <summary>Registra un usuario nuevo.</summary>
    /// <response code="409">Ya existe un usuario con ese email.</response>
    [HttpPost]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UsuarioDto>> Create(UsuarioCreateDto dto)
    {
        var usuario = new Usuario { Email = dto.Email.Trim().ToLowerInvariant() };

        // La contraseña en claro no se guarda ni se registra en logs en ningún punto.
        usuario.PasswordHash = _hasher.HashPassword(usuario, dto.Password);

        _db.Usuarios.Add(usuario);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (EsEmailDuplicado(ex))
        {
            return Conflict(new ErrorResponse($"Ya existe un usuario con el email '{usuario.Email}'."));
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = usuario.Id },
            new UsuarioDto(usuario.Id, usuario.Email));
    }

    private static bool EsEmailDuplicado(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: UniqueViolation };
}
