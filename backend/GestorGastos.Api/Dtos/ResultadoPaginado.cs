// Dtos/ResultadoPaginado.cs

// Envoltorio de los listados que pueden crecer sin techo.
public record ResultadoPaginado<T>(IReadOnlyList<T> Items, int Total, int Pagina, int Tamano);
