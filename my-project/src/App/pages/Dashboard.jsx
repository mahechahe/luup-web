import { useAuth } from "@/app/auth/AuthContext";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Button onClick={logout}>Cerrar sesión</Button>
    </div>
  );
}