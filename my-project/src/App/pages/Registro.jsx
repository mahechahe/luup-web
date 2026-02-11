import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { registerRequest } from "@/App/service/authService";

export default function Registro() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerRequest(formData);
      alert("Registro exitoso");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Error al registrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-card text-card-foreground px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border border-border bg-muted/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
          {/* Icono de Usuario */}
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <UserPlus className="h-6 w-6" />
          </div>

          <CardTitle className="text-4xl font-bold tracking-tight">
            Crear cuenta
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa tus datos para registrarte
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fila Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                  id="nombre" 
                  required 
                  value={formData.nombre} 
                  onChange={handleChange}
                  placeholder="Juan"
                  className="bg-muted border-input focus-visible:ring-primary transition-all" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input 
                  id="apellido" 
                  required 
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className="bg-muted border-input focus-visible:ring-primary transition-all" 
                />
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                className="bg-muted border-input focus-visible:ring-primary transition-all" 
              />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input 
                id="celular" 
                type="tel" 
                required 
                value={formData.celular}
                onChange={handleChange}
                placeholder="55 1234 5678"
                className="bg-muted border-input focus-visible:ring-primary transition-all" 
              />
            </div>

            {/* Botón de Registro */}
            <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          {/* Footer del Card */}
          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <button 
                type="button"
                onClick={() => navigate("/login")} 
                className="text-primary font-semibold hover:underline cursor-pointer transition-all"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}