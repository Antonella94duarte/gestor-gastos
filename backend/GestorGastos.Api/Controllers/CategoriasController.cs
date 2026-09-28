using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GestorGastos.Api.Controllers;

[ApiController]
[Route("api/categorias")]
public class CategoriasController : ControllerBase
{
    private const string UniqueViolation = "23505";

    private readonly GestorGastosDbContext _db;

    public CategoriasController(GestorGastosDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoriaDto>>> Get([FromQuery] TipoMovimiento? tipo)
    {
        var query = _db.Categorias.AsNoTracking();

        if (tipo is not null)
        {
            query = query.Where(c => c.Tipo == tipo);
        }

        var categorias = await query
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaDto(c.Id, c.Nombre, c.Tipo))
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoriaDto>> GetById(int id)
    {
        var categoria = await _db.Categorias
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoriaDto(c.Id, c.Nombre, c.Tipo))
            .FirstOrDefaultAsync();

        return categoria is null ? NotFound() : Ok(categoria);
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaDto>> Create(CategoriaInputDto dto)
    {
        var categoria = new Categoria { Nombre = dto.Nombre, Tipo = dto.Tipo!.Value };
        _db.Categorias.Add(categoria);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (EsNombreDuplicado(ex))
        {
            return Conflict(new { mensaje = $"Ya existe una categoría llamada '{dto.Nombre}'." });
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = categoria.Id },
            new CategoriaDto(categoria.Id, categoria.Nombre, categoria.Tipo));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoriaInputDto dto)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria is null) return NotFound();

        // El tipo de la transacción se deriva de su categoría: cambiarlo con
        // movimientos cargados convertiría gastos en ingresos retroactivamente.
        if (dto.Tipo!.Value != categoria.Tipo &&
            await _db.Transacciones.AnyAsync(t => t.CategoriaId == id))
        {
            return Conflict(new
            {
                mensaje = $"La categoría '{categoria.Nombre}' ya tiene transacciones: no se puede cambiar su tipo."
            });
        }

        categoria.Nombre = dto.Nombre;
        categoria.Tipo = dto.Tipo.Value;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (EsNombreDuplicado(ex))
        {
            return Conflict(new { mensaje = $"Ya existe una categoría llamada '{dto.Nombre}'." });
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria is null) return NotFound();

        // La FK es Restrict: sin este chequeo el error llega como 500 desde la base.
        var tieneTransacciones = await _db.Transacciones.AnyAsync(t => t.CategoriaId == id);
        if (tieneTransacciones)
        {
            return Conflict(new
            {
                mensaje = $"La categoría '{categoria.Nombre}' tiene transacciones asociadas y no se puede eliminar."
            });
        }

        _db.Categorias.Remove(categoria);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // El índice único es la única fuente confiable: un chequeo previo con AnyAsync
    // dejaría pasar duplicados entre la consulta y el insert.
    private static bool EsNombreDuplicado(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: UniqueViolation };
}
