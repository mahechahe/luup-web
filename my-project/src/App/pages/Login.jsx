import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Importamos Loader2 para el feedback visual
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/App/auth/AuthContext";
import { authService } from "@/App/service/authService"; // Importamos el servicio de conexión

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar errores previos

    // Validaciones básicas antes de enviar al servidor
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true); // Bloquear el botón y mostrar spinner

    try {
      // Llamada real al backend
      const data = await authService.login(email, password);
      
      // Suponiendo que tu backend devuelve { token: "...", user: {...} }
      login(data.token, data.user); 
      
      // Redirigir al usuario
      navigate("/dashboard");
    } catch (err) {
      // Manejo de errores del servidor (401, 404, 500, etc.)
      const message = err.response?.data?.message || "Error al conectar con el servidor";
      setError(message);
    } finally {
      setIsLoading(false); // Liberar el botón
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border border-border bg-muted/50">
        <CardHeader className="text-center space-y-1">
          {/* Logo */}
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            LO
          </div>

          <CardTitle className="text-3xl font-bold leading-tight">
            Iniciar sesión
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para continuar
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Mostrar error si existe */}
            {error && (
              <div className="p-3 text-sm font-medium bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-background focus-visible:ring-primary"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background pr-10 focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Login button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Register */}
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <span className="text-primary font-medium hover:underline cursor-pointer">
              Regístrate aquí
            </span>
          </p>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Versión 1.0.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
}





