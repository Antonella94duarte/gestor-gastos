// Dtos/ErrorResponse.cs

// Cuerpo de los errores de negocio (409). Tipado y no anónimo para que
// OpenAPI pueda describirlo.
public record ErrorResponse(string Mensaje);
