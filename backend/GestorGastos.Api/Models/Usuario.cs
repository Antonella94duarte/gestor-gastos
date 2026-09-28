// Models/Usuario.cs
public class Usuario
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public ICollection<Transaccion> Transacciones { get; set; } = new List<Transaccion>();
}