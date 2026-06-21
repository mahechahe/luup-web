import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import ReportEventHeader from './components/ReportEventHeader';
import AsistenciasSection from './sections/AsistenciasSection';
import IngresosSection from './sections/IngresosSection';
import SalidasSection from './sections/SalidasSection';
import FotosSection from './sections/FotosSection';

export default function ReporteEventoPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.backTo ?? '/reportes';
  const { user } = useUserStore();

  useEffect(() => {
    if (user && !hasAdminAccess(user.roleId)) navigate('/dashboard');
  }, [user, navigate]);

  if (user && !hasAdminAccess(user.roleId)) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="max-w-7xl mx-auto space-y-6">
        <ReportEventHeader
          eventId={eventId}
          onBack={() => navigate(backTo)}
        />

        <Tabs defaultValue="asistencias" className="w-full">
          <TabsList className="w-full h-10 rounded-xl bg-muted p-1">
            <TabsTrigger
              value="asistencias"
              className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Asistencias
            </TabsTrigger>
            <TabsTrigger
              value="ingresos"
              className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Ingresos
            </TabsTrigger>
            <TabsTrigger
              value="salidas"
              className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Salidas
            </TabsTrigger>
            <TabsTrigger
              value="fotos"
              className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Fotos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asistencias" className="mt-4">
            <AsistenciasSection eventId={eventId} />
          </TabsContent>

          <TabsContent value="ingresos" className="mt-4">
            <IngresosSection eventId={eventId} />
          </TabsContent>

          <TabsContent value="salidas" className="mt-4">
            <SalidasSection eventId={eventId} />
          </TabsContent>

          <TabsContent value="fotos" className="mt-4">
            <FotosSection eventId={eventId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
