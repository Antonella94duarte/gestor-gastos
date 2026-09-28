using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestorGastos.Api.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaBorradoRestrict : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transacciones_Categorias_CategoriaId",
                table: "Transacciones");

            migrationBuilder.AddForeignKey(
                name: "FK_Transacciones_Categorias_CategoriaId",
                table: "Transacciones",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transacciones_Categorias_CategoriaId",
                table: "Transacciones");

            migrationBuilder.AddForeignKey(
                name: "FK_Transacciones_Categorias_CategoriaId",
                table: "Transacciones",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
