using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestorGastos.Api.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaNombreUnico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Categorias_Nombre",
                table: "Categorias",
                column: "Nombre",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categorias_Nombre",
                table: "Categorias");
        }
    }
}
