import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess, isClientUser } from '@/App/utils/roles';
import ReportEventHeader from './components/ReportEventHeader';
import AsistenciasSection from './sections/AsistenciasSection';
import IngresosSection from './sections/IngresosSection';
import SalidasSection from './sections/SalidasSection';
import FotosSection from './sections/FotosSection';
import ZonasSection from './sections/ZonasSection';
import InventarioSection from './sections/InventarioSection';

/* En móvil las tabs van en fila desplazable con su ancho natural; desde md
   vuelven a la grilla de columnas iguales. Con 6 tabs repartidas en el ancho de
   un celular el texto no cabe y se desborda (el trigger trae whitespace-nowrap). */
const TAB_TRIGGER_CLASS =
  'flex-none px-3 md:flex-1 md:px-2 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm';

export default function ReporteEventoPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  const canView = (roleId) => hasAdminAccess(roleId) || isClientUser(roleId);
  /* El inventario es informacion interna: el cliente no debe verlo. */
  const canViewInventory = !isClientUser(user?.roleId);
  const tabCount = canViewInventory ? 6 : 5;
  const backTo =
    location.state?.backTo ??
    (isClientUser(user?.roleId) ? '/cliente/eventos' : '/reportes');

  useEffect(() => {
    if (user && !canView(user.roleId)) navigate('/dashboard');
  }, [user, navigate]);

  if (user && !canView(user.roleId)) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="max-w-7xl mx-auto space-y-6">
        <ReportEventHeader eventId={eventId} onBack={() => navigate(backTo)} />

        <Tabs defaultValue="asistencias" className="w-full">
          {/* gridTemplateColumns solo surte efecto cuando el display es grid,
              así que en móvil (flex) queda inerte sin necesidad de limpiarlo. */}
          <TabsList
            className="w-full h-10 rounded-xl bg-muted p-1 flex justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:overflow-visible"
            style={{
              gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))`,
            }}
          >
            <TabsTrigger value="asistencias" className={TAB_TRIGGER_CLASS}>
              Asistencias
            </TabsTrigger>
            <TabsTrigger value="ingresos" className={TAB_TRIGGER_CLASS}>
              Ingresos
            </TabsTrigger>
            <TabsTrigger value="salidas" className={TAB_TRIGGER_CLASS}>
              Salidas
            </TabsTrigger>
            {canViewInventory && (
              <TabsTrigger value="inventario" className={TAB_TRIGGER_CLASS}>
                Inventario
              </TabsTrigger>
            )}
            <TabsTrigger value="fotos" className={TAB_TRIGGER_CLASS}>
              Fotos
            </TabsTrigger>
            <TabsTrigger value="zonas" className={TAB_TRIGGER_CLASS}>
              Zonas
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

          {canViewInventory && (
            <TabsContent value="inventario" className="mt-4">
              <InventarioSection eventId={eventId} />
            </TabsContent>
          )}

          <TabsContent value="fotos" className="mt-4">
            <FotosSection eventId={eventId} />
          </TabsContent>

          <TabsContent value="zonas" className="mt-4">
            <ZonasSection eventId={eventId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
