using GestorGastos.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/transacciones")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class TransaccionesController : ControllerBase
{
    private const int TamanoPaginaPorDefecto = 20;
    private const int TamanoPaginaMaximo = 100;

    private readonly GestorGastosDbContext _db;

    public TransaccionesController(GestorGastosDbContext db) => _db = db;

    // Punto de entrada único: ninguna consulta accede a Transacciones sin
    // filtrar por el usuario autenticado.
    private IQueryable<Transaccion> MisTransacciones =>
        _db.Transacciones.Where(t => t.UsuarioId == User.ObtenerId());

    /// <summary>Lista las transacciones del usuario autenticado, con filtros y paginación.</summary>
    /// <param name="categoriaId">Filtra por categoría.</param>
    /// <param name="tipo">Gasto o Ingreso, según la categoría de cada transacción.</param>
    /// <param name="desde">Fecha mínima, inclusive.</param>
    /// <param name="hasta">Fecha máxima, inclusive.</param>
    /// <param name="pagina">Número de página, desde 1.</param>
    /// <param name="tamano">Cantidad por página. Máximo 100.</param>
    [HttpGet]
    [ProducesResponseType(typeof(ResultadoPaginado<TransaccionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ResultadoPaginado<TransaccionDto>>> Get(
        [FromQuery] int? categoriaId,
        [FromQuery] TipoMovimiento? tipo,
        [FromQuery] DateTimeOffset? desde,
        [FromQuery] DateTimeOffset? hasta,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = TamanoPaginaPorDefecto)
    {
        pagina = pagina < 1 ? 1 : pagina;
        tamano = Math.Clamp(tamano, 1, TamanoPaginaMaximo);

        var query = MisTransacciones.AsNoTracking();

        if (categoriaId is not null) query = query.Where(t => t.CategoriaId == categoriaId);
        if (tipo is not null) query = query.Where(t => t.Categoria.Tipo == tipo);
        if (desde is not null) query = query.Where(t => t.Fecha >= desde.Value.UtcDateTime);
        if (hasta is not null) query = query.Where(t => t.Fecha <= hasta.Value.UtcDateTime);

        // El COUNT va antes de paginar: es el total de coincidencias, no de la página.
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.Fecha)
            .ThenByDescending(t => t.Id)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(t => new TransaccionDto(
                t.Id,
                t.Monto,
                t.Fecha,
                t.Descripcion,
                t.CategoriaId,
                t.Categoria.Nombre,
                t.Categoria.Tipo))
            .ToListAsync();

        return Ok(new ResultadoPaginado<TransaccionDto>(items, total, pagina, tamano));
    }

    /// <summary>Obtiene una transacción por su id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TransaccionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransaccionDto>> GetById(int id)
    {
        var transaccion = await MisTransacciones
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new TransaccionDto(
                t.Id,
                t.Monto,
                t.Fecha,
                t.Descripcion,
                t.CategoriaId,
                t.Categoria.Nombre,
                t.Categoria.Tipo))
            .FirstOrDefaultAsync();

        return transaccion is null ? NotFound() : Ok(transaccion);
    }

    /// <summary>Registra una transacción.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TransaccionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TransaccionDto>> Create(TransaccionInputDto dto)
    {
        if (!await CategoriaValida(dto)) return ValidationProblem(ModelState);

        var transaccion = new Transaccion
        {
            Monto = dto.Monto!.Value,
            Fecha = dto.Fecha!.Value.UtcDateTime,
            Descripcion = dto.Descripcion.Trim(),
            CategoriaId = dto.CategoriaId!.Value,
            UsuarioId = User.ObtenerId()
        };

        _db.Transacciones.Add(transaccion);
        await _db.SaveChangesAsync();

        // Se relee proyectado para devolver el nombre y el tipo de la categoría.
        var creada = await _db.Transacciones
            .AsNoTracking()
            .Where(t => t.Id == transaccion.Id)
            .Select(t => new TransaccionDto(
                t.Id,
                t.Monto,
                t.Fecha,
                t.Descripcion,
                t.CategoriaId,
                t.Categoria.Nombre,
                t.Categoria.Tipo))
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = transaccion.Id }, creada);
    }

    /// <summary>Actualiza una transacción.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, TransaccionInputDto dto)
    {
        var transaccion = await MisTransacciones.FirstOrDefaultAsync(t => t.Id == id);
        if (transaccion is null) return NotFound();

        if (!await CategoriaValida(dto)) return ValidationProblem(ModelState);

        transaccion.Monto = dto.Monto!.Value;
        transaccion.Fecha = dto.Fecha!.Value.UtcDateTime;
        transaccion.Descripcion = dto.Descripcion.Trim();
        transaccion.CategoriaId = dto.CategoriaId!.Value;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Elimina una transacción.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var filas = await MisTransacciones
            .Where(t => t.Id == id)
            .ExecuteDeleteAsync();

        return filas == 0 ? NotFound() : NoContent();
    }

    // La categoría debe existir y pertenecer al usuario: de lo contrario se
    // podrían clasificar movimientos con categorías ajenas.
    private async Task<bool> CategoriaValida(TransaccionInputDto dto)
    {
        var existe = await _db.Categorias
            .AnyAsync(c => c.Id == dto.CategoriaId && c.UsuarioId == User.ObtenerId());

        if (!existe)
        {
            ModelState.AddModelError(nameof(dto.CategoriaId), "La categoría indicada no existe.");
        }

        return ModelState.IsValid;
    }
}
