// Models/Categoria.cs
public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public TipoMovimiento Tipo { get; set; }
    public ICollection<Transaccion> Transacciones { get; set; } = new List<Transaccion>();
}