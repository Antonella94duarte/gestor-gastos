// Data/GestorGastosDbContext.cs
using Microsoft.EntityFrameworkCore;

public class GestorGastosDbContext : DbContext
{
    public GestorGastosDbContext(DbContextOptions<GestorGastosDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Transaccion> Transacciones => Set<Transaccion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Integridad + búsqueda del login.
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Evita categorías repetidas. Pasará a ser (UsuarioId, Nombre) con JWT.
        modelBuilder.Entity<Categoria>()
            .HasIndex(c => c.Nombre)
            .IsUnique();

        // Como texto y no como int: la base queda legible al consultarla a mano.
        modelBuilder.Entity<Categoria>()
            .Property(c => c.Tipo)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<Transaccion>()
            .Property(t => t.Monto)
            .HasPrecision(18, 2);

        // Cubre el filtro por usuario y rango de fechas.
        modelBuilder.Entity<Transaccion>()
            .HasIndex(t => new { t.UsuarioId, t.Fecha });

        // Restrict: borrar una categoría en uso no debe arrastrar sus transacciones.
        modelBuilder.Entity<Transaccion>()
            .HasOne(t => t.Categoria)
            .WithMany(c => c.Transacciones)
            .HasForeignKey(t => t.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}