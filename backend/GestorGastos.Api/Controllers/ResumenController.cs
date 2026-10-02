using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Route("api/resumen")]
[Produces("application/json")]
public class ResumenController : ControllerBase
{
    private const int MesesMaximos = 36;

    private readonly GestorGastosDbContext _db;

    public ResumenController(GestorGastosDbContext db) => _db = db;

    /// <summary>Totales de ingresos, gastos y balance de un mes.</summary>
    /// <param name="anio">Año del período.</param>
    /// <param name="mes">Mes del período, de 1 a 12.</param>
    /// <param name="usuarioId">Filtra por usuario.</param>
    /// <param name="offsetHoras">
    /// Offset de la zona horaria del usuario respecto de UTC, por ejemplo -3.
    /// Las fechas se guardan en UTC: sin esto, un gasto de las 22:00 del último
    /// día del mes se contaría en el mes siguiente.
    /// </param>
    [HttpGet("mensual")]
    [ProducesResponseType(typeof(ResumenMensualDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ResumenMensualDto>> Mensual(
        [FromQuery] int anio,
        [FromQuery] int mes,
        [FromQuery] int? usuarioId,
        [FromQuery] int offsetHoras = 0)
    {
        if (!PeriodoValido(anio, mes, offsetHoras)) return ValidationProblem(ModelState);

        var offset = TimeSpan.FromHours(offsetHoras);
        var inicio = new DateTimeOffset(anio, mes, 1, 0, 0, 0, offset);
        var fin = inicio.AddMonths(1);

        var query = _db.Transacciones
            .AsNoTracking()
            .Where(t => t.Fecha >= inicio.UtcDateTime && t.Fecha < fin.UtcDateTime);

        if (usuarioId is not null) query = query.Where(t => t.UsuarioId == usuarioId);

        // Una sola consulta: PostgreSQL suma, acá solo se arma el DTO.
        var totales = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Ingresos = g.Sum(t => t.Categoria.Tipo == TipoMovimiento.Ingreso ? t.Monto : 0m),
                Gastos = g.Sum(t => t.Categoria.Tipo == TipoMovimiento.Gasto ? t.Monto : 0m),
                Cantidad = g.Count()
            })
            .FirstOrDefaultAsync();

        var ingresos = totales?.Ingresos ?? 0m;
        var gastos = totales?.Gastos ?? 0m;

        return Ok(new ResumenMensualDto(
            anio, mes, ingresos, gastos, ingresos - gastos, totales?.Cantidad ?? 0));
    }

    /// <summary>Totales por categoría dentro de un rango, con su peso relativo.</summary>
    /// <param name="desde">Inicio del rango, inclusive.</param>
    /// <param name="hasta">Fin del rango, inclusive.</param>
    /// <param name="tipo">Gasto o Ingreso. Los porcentajes se calculan sobre el total de este tipo.</param>
    /// <param name="usuarioId">Filtra por usuario.</param>
    [HttpGet("por-categoria")]
    [ProducesResponseType(typeof(ResumenPorCategoriaDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ResumenPorCategoriaDto>> PorCategoria(
        [FromQuery] DateTimeOffset? desde,
        [FromQuery] DateTimeOffset? hasta,
        [FromQuery] TipoMovimiento tipo = TipoMovimiento.Gasto,
        [FromQuery] int? usuarioId = null)
    {
        var query = _db.Transacciones
            .AsNoTracking()
            .Where(t => t.Categoria.Tipo == tipo);

        if (usuarioId is not null) query = query.Where(t => t.UsuarioId == usuarioId);
        if (desde is not null) query = query.Where(t => t.Fecha >= desde.Value.UtcDateTime);
        if (hasta is not null) query = query.Where(t => t.Fecha <= hasta.Value.UtcDateTime);

        var porCategoria = await query
            .GroupBy(t => new { t.CategoriaId, t.Categoria.Nombre })
            .Select(g => new
            {
                g.Key.CategoriaId,
                g.Key.Nombre,
                Total = g.Sum(t => t.Monto),
                Cantidad = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        var total = porCategoria.Sum(c => c.Total);

        // El porcentaje se calcula sobre el total ya materializado: son pocas
        // filas y evita una segunda consulta de agregación.
        var categorias = porCategoria
            .Select(c => new CategoriaResumenDto(
                c.CategoriaId,
                c.Nombre,
                c.Total,
                total == 0 ? 0 : Math.Round(c.Total * 100 / total, 2),
                c.Cantidad))
            .ToList();

        return Ok(new ResumenPorCategoriaDto(tipo, total, categorias));
    }

    /// <summary>Serie mensual de ingresos, gastos y balance para graficar.</summary>
    /// <param name="meses">Cantidad de meses hacia atrás, contando el actual. Máximo 36.</param>
    /// <param name="usuarioId">Filtra por usuario.</param>
    /// <param name="offsetHoras">Offset de la zona horaria del usuario respecto de UTC.</param>
    [HttpGet("evolucion")]
    [ProducesResponseType(typeof(IEnumerable<MesEvolucionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<MesEvolucionDto>>> Evolucion(
        [FromQuery] int meses = 12,
        [FromQuery] int? usuarioId = null,
        [FromQuery] int offsetHoras = 0)
    {
        if (!OffsetValido(offsetHoras)) return ValidationProblem(ModelState);

        meses = Math.Clamp(meses, 1, MesesMaximos);

        var offset = TimeSpan.FromHours(offsetHoras);
        var ahora = DateTimeOffset.UtcNow.ToOffset(offset);
        var primerMes = new DateTimeOffset(ahora.Year, ahora.Month, 1, 0, 0, 0, offset)
            .AddMonths(-(meses - 1));
        var fin = primerMes.AddMonths(meses);

        var query = _db.Transacciones
            .AsNoTracking()
            .Where(t => t.Fecha >= primerMes.UtcDateTime && t.Fecha < fin.UtcDateTime);

        if (usuarioId is not null) query = query.Where(t => t.UsuarioId == usuarioId);

        // El desplazamiento se aplica dentro de la consulta para que PostgreSQL
        // agrupe por el mes de la zona del usuario, no por el mes UTC.
        var agrupado = await query
            .GroupBy(t => new
            {
                Anio = t.Fecha.AddHours(offsetHoras).Year,
                Mes = t.Fecha.AddHours(offsetHoras).Month
            })
            .Select(g => new
            {
                g.Key.Anio,
                g.Key.Mes,
                Ingresos = g.Sum(t => t.Categoria.Tipo == TipoMovimiento.Ingreso ? t.Monto : 0m),
                Gastos = g.Sum(t => t.Categoria.Tipo == TipoMovimiento.Gasto ? t.Monto : 0m)
            })
            .ToListAsync();

        // Los meses sin movimientos se completan en cero para que la serie no
        // tenga huecos al graficarla. Son como mucho 36 elementos.
        var serie = Enumerable.Range(0, meses)
            .Select(i => primerMes.AddMonths(i))
            .Select(m =>
            {
                var dato = agrupado.FirstOrDefault(a => a.Anio == m.Year && a.Mes == m.Month);
                var ingresos = dato?.Ingresos ?? 0m;
                var gastos = dato?.Gastos ?? 0m;
                return new MesEvolucionDto(m.Year, m.Month, ingresos, gastos, ingresos - gastos);
            })
            .ToList();

        return Ok(serie);
    }

    private bool PeriodoValido(int anio, int mes, int offsetHoras)
    {
        if (anio < 1900 || anio > 9999)
        {
            ModelState.AddModelError(nameof(anio), "El año debe estar entre 1900 y 9999.");
        }

        if (mes < 1 || mes > 12)
        {
            ModelState.AddModelError(nameof(mes), "El mes debe estar entre 1 y 12.");
        }

        return OffsetValido(offsetHoras) && ModelState.IsValid;
    }

    private bool OffsetValido(int offsetHoras)
    {
        if (offsetHoras < -12 || offsetHoras > 14)
        {
            ModelState.AddModelError(nameof(offsetHoras), "El offset debe estar entre -12 y 14.");
        }

        return ModelState.IsValid;
    }
}
