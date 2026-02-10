import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/App/pages/Login";
import Dashboard from "@/App/pages/Dashboard";
import ProtectedRoute from "@/App/auth/ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Si el usuario entra a cualquier otra ruta, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}