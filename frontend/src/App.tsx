import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./componentes/Layout";
import { AuthProvider } from "./auth/AuthContext";
import { RutaProtegida } from "./auth/RutaProtegida";
import { Categorias } from "./paginas/Categorias";
import { EnConstruccion } from "./paginas/EnConstruccion";
import { Inicio } from "./paginas/Inicio";
import { Login } from "./paginas/Login";
import { Registro } from "./paginas/Registro";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Todo lo de adentro exige sesión. */}
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route
                path="transacciones"
                element={<EnConstruccion titulo="Movimientos" />}
              />
              <Route path="categorias" element={<Categorias />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
