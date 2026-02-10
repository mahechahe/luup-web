import { useState } from "react";
import { useAuth } from "@/App/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios"; 

export default function Dashboard() {
  const { logout, user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendProgress = async () => {
    setError("");
    setMessage("");
    try {
      setLoading(true);
      // Llama a http://localhost:3000/progreso
      const res = await api.post("/progreso", { 
        progreso: Number(progress) 
      });
      setMessage("¡Progreso actualizado!");
    } catch (err) {
      setError(err.response?.data?.message || "Error 404: Ruta no encontrada en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Bienvenido</h1>
        <Button variant="outline" size="sm" onClick={logout}>Salir</Button>
      </div>
      <div className="space-y-2">
        <label className="text-sm">Nivel de progreso: {progress}%</label>
        <Input 
          type="number" 
          value={progress} 
          onChange={(e) => setProgress(e.target.value)} 
        />
        <Button className="w-full" onClick={sendProgress} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Enviar a Backend"}
        </Button>
      </div>
      {message && <p className="text-green-500 text-center">{message}</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
}
