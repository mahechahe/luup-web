import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App/auth/AuthContext";
import { loginRequest } from "@/App/service/authService";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginRequest(email, password);
      login(data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error en login:", error);
      alert(error.response?.data?.message || "Credenciales incorrectas o error de servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-card text-card-foreground px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border border-border bg-muted/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
          {/* Logo Icon */}
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <CardTitle className="text-4xl font-bold tracking-tight">
            Iniciar sesión
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Bienvenido de vuelta, ingresa tus datos.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border-input focus-visible:ring-primary transition-all"
              />
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted pr-10 border-input focus-visible:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón Principal */}
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Footer del Card */}
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <button 
                onClick={() => navigate("/registro")} 
                className="text-primary font-semibold hover:underline cursor-pointer transition-all"
              >
                Regístrate aquí
              </button>
            </p>

            <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
              Versión 1.0.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}