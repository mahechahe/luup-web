import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // validar backend
    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    // Login fake
    login("fake-token-123");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-card text-card-foreground px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border border-border bg-muted">
        <CardHeader className="text-center space-y-1">
          {/* Logo */}
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            LO
          </div>

          <CardTitle className="text-4xl font-semibold leading-tight">
            Iniciar sesión
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Bienvenido de vuelta
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border border-input focus-visible:border-primary focus-visible:ring-primary"
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
                  className="bg-muted pr-10 border border-input focus-visible:border-primary focus-visible:ring-primary"
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
            <Button type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>

          {/* Register */}
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <span className="text-primary hover:underline cursor-pointer">
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






