using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestorGastos.Api.Migrations
{
    /// <inheritdoc />
    public partial class CategoriasPorUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categorias_Nombre",
                table: "Categorias");

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Categorias",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Las categorías que ya existen pasan al primer usuario registrado.
            // Sin esto quedarían con UsuarioId = 0 y la FK no se podría crear.
            migrationBuilder.Sql(@"
                UPDATE ""Categorias""
                SET ""UsuarioId"" = (SELECT MIN(""Id"") FROM ""Usuarios"")
                WHERE EXISTS (SELECT 1 FROM ""Usuarios"");");

            // Si no había ningún usuario, esas categorías son huérfanas.
            migrationBuilder.Sql(@"DELETE FROM ""Categorias"" WHERE ""UsuarioId"" = 0;");

            // El default era solo para poder agregar la columna NOT NULL.
            migrationBuilder.Sql(@"ALTER TABLE ""Categorias"" ALTER COLUMN ""UsuarioId"" DROP DEFAULT;");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_UsuarioId_Nombre",
                table: "Categorias",
                columns: new[] { "UsuarioId", "Nombre" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Categorias_Usuarios_UsuarioId",
                table: "Categorias",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categorias_Usuarios_UsuarioId",
                table: "Categorias");

            migrationBuilder.DropIndex(
                name: "IX_Categorias_UsuarioId_Nombre",
                table: "Categorias");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Categorias");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_Nombre",
                table: "Categorias",
                column: "Nombre",
                unique: true);
        }
    }
}
