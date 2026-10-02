using GestorGastos.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/usuarios")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class UsuariosController : ControllerBase
{
    private readonly GestorGastosDbContext _db;

    public UsuariosController(GestorGastosDbContext db) => _db = db;

    /// <summary>Devuelve los datos del usuario autenticado.</summary>
    /// <remarks>
    /// No hay endpoint para listar usuarios ni para consultar otro: cada uno
    /// solo accede a sí mismo. El registro está en POST /api/auth/registro.
    /// </remarks>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UsuarioDto>> Me()
    {
        var usuario = await _db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == User.ObtenerId())
            .Select(u => new UsuarioDto(u.Id, u.Email))
            .FirstOrDefaultAsync();

        // 404 solo si la cuenta fue borrada con el token todavía vigente.
        return usuario is null ? NotFound() : Ok(usuario);
    }
}
