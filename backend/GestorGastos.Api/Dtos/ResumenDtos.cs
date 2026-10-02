// Dtos/ResumenDtos.cs

public record ResumenMensualDto(
    int Anio,
    int Mes,
    decimal TotalIngresos,
    decimal TotalGastos,
    decimal Balance,
    int CantidadMovimientos);

public record CategoriaResumenDto(
    int CategoriaId,
    string Nombre,
    decimal Total,
    decimal Porcentaje,
    int Cantidad);

public record ResumenPorCategoriaDto(
    TipoMovimiento Tipo,
    decimal Total,
    IReadOnlyList<CategoriaResumenDto> Categorias);

public record MesEvolucionDto(
    int Anio,
    int Mes,
    decimal Ingresos,
    decimal Gastos,
    decimal Balance);
