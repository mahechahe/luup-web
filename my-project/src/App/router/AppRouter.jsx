import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/App/auth/AuthContext";
import Login from "@/App/pages/Login";
import Registro from "@/App/pages/Registro"; // Nueva página
import Dashboard from "@/App/pages/Dashboard";
import ProtectedRoute from "@/App/auth/ProtectedRoute";

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas: Si ya está autenticado, redirige al Dashboard */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/registro" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Registro />} 
        />

        {/* Rutas Privadas: Protegidas por el componente ProtectedRoute */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: Redirección inteligente según el estado de autenticación */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}