import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth solo puede usarse dentro de <AuthProvider>.");
  }

  return contexto;
}
