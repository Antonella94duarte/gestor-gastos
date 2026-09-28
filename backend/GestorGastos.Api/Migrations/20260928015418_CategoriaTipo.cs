using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestorGastos.Api.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaTipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValue rellena las categorías ya existentes: "" no es un valor
            // válido del enum y rompería al leerlas.
            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Categorias",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Gasto");

            // Se quita el default para que el valor lo decida siempre la aplicación.
            migrationBuilder.Sql(@"ALTER TABLE ""Categorias"" ALTER COLUMN ""Tipo"" DROP DEFAULT;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Categorias");
        }
    }
}
