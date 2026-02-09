import { BrowserRouter, Routes, Route } from "react-router-dom";
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

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

