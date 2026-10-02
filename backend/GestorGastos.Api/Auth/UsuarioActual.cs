// Auth/UsuarioActual.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace GestorGastos.Api.Auth;

public static class UsuarioActual
{
    /// <summary>Id del usuario autenticado, tomado del claim "sub" del token.</summary>
    /// <remarks>
    /// Solo se llama desde acciones con [Authorize]: si no hay token válido, el
    /// pipeline ya respondió 401 y nunca se llega acá.
    /// </remarks>
    public static int ObtenerId(this ClaimsPrincipal principal)
    {
        var valor = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.Parse(valor!);
    }
}
