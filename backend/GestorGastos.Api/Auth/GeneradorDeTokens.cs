// Auth/GeneradorDeTokens.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GestorGastos.Api.Auth;

public interface IGeneradorDeTokens
{
    (string Token, DateTime ExpiraEn) Generar(Usuario usuario);
}

public class GeneradorDeTokens : IGeneradorDeTokens
{
    private readonly JwtOpciones _opciones;

    public GeneradorDeTokens(IOptions<JwtOpciones> opciones) => _opciones = opciones.Value;

    public (string Token, DateTime ExpiraEn) Generar(Usuario usuario)
    {
        var expiraEn = DateTime.UtcNow.AddMinutes(_opciones.MinutosExpiracion);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            // Identifica al token: necesario si más adelante se revocan.
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.ClaveFirma)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opciones.Emisor,
            audience: _opciones.Audiencia,
            claims: claims,
            expires: expiraEn,
            signingCredentials: credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEn);
    }
}
