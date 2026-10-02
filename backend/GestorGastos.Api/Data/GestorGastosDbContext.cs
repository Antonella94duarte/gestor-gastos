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

        // Compuesto: dos usuarios pueden tener cada uno su categoría "Comida".
        modelBuilder.Entity<Categoria>()
            .HasIndex(c => new { c.UsuarioId, c.Nombre })
            .IsUnique();

        // Restrict y no Cascade: si fuera Cascade, al borrar un usuario
        // PostgreSQL intentaría borrar sus categorías mientras el Restrict de
        // Transaccion -> Categoria todavía las referencia. Borrar una cuenta
        // debe limpiar transacciones y categorías explícitamente, en ese orden.
        modelBuilder.Entity<Categoria>()
            .HasOne(c => c.Usuario)
            .WithMany()
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

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