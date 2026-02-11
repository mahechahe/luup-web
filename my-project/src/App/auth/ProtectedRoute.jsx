import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Si aún estamos verificando el token, no renderizamos nada
  if (loading) return null; 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}