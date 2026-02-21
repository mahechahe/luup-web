import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, PackageOpen, RefreshCw } from 'lucide-react';
import { getEventoDetailService, getEventZonesWithStaffService } from '../services/eventServices';
import { EventoHeader } from '../Canvas/components/EventoHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZoneCard } from './components/ZoneCard';
import { ZoneCardSkeleton } from './components/ZoneCardSkeleton';
import { EmptyZones } from './components/EmptyZones';
import { IncidentFormModal } from './components/IncidentFormModal';
import { IncidentHistoryModal } from './components/IncidentHistoryModal';
import { WasteFormModal } from './components/WasteFormModal';

export default function ZonasPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState(null);
  const [zones, setZones] = useState([]);

  // Incidencias: { [userId]: Incident[] }
  const [incidents, setIncidents] = useState({});
  const [incidentTarget, setIncidentTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  // Basuras: { [zoneId]: WasteEntry[] }
  const [wasteEntries, setWasteEntries] = useState({});
  const [wasteTarget, setWasteTarget] = useState(null); // zone object

  // Extrae incidents de cada persona en las zonas y los indexa por userId
  const parseIncidents = (zones) => {
    const map = {};
    zones.forEach((z) => {
      const people = [z.supervisor, z.coordinator, ...z.collaborators].filter(Boolean);
      people.forEach((p) => {
        if (p.incidents?.length) map[p.userId] = p.incidents;
      });
    });
    return map;
  };

  const fetchZones = useCallback(async () => {
    const res = await getEventZonesWithStaffService(eventId);
    if (res.status) {
      setZones(res.zones);
      setIncidents(parseIncidents(res.zones));
    }
  }, [eventId]);

  useEffect(() => {
    Promise.all([
      getEventoDetailService(eventId),
      getEventZonesWithStaffService(eventId),
    ]).then(([eventRes, zonesRes]) => {
      if (eventRes.status) setEvent(eventRes.event);
      if (zonesRes.status) {
        setZones(zonesRes.zones);
        setIncidents(parseIncidents(zonesRes.zones));
      }
      setLoading(false);
    });
  }, [eventId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchZones();
    setRefreshing(false);
  };

  const handleSaveIncident = (userId, incident) => {
    setIncidents((prev) => ({
      ...prev,
      [userId]: [...(prev[userId] ?? []), incident],
    }));
  };

  const handleSaveWaste = (zoneId, entry) => {
    setWasteEntries((prev) => ({
      ...prev,
      [zoneId]: [...(prev[zoneId] ?? []), entry],
    }));
  };

  const generales = zones.filter((z) => z.category === 'general');
  const acopios = zones.filter((z) => z.category === 'acopio');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate(`/eventos/${eventId}`)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Título + botón refrescar */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-44 mb-1.5" />
                <Skeleton className="h-4 w-52" />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#234465]">Zonas del evento</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {zones.length} zona{zones.length !== 1 ? 's' : ''} configurada{zones.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="shrink-0 gap-2 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <ZoneCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="h-auto p-1 gap-1 bg-muted/60">
              <TabsTrigger
                value="general"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-[#234465] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Layers className="w-4 h-4" />
                Zona general
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold">
                  {generales.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="acopio"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-[#DD7419] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <PackageOpen className="w-4 h-4" />
                Centro de Acopio
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold">
                  {acopios.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-5">
              {generales.length === 0 ? (
                <EmptyZones message="No hay zonas generales configuradas." />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {generales.map((zone) => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      incidents={incidents}
                      onAddIncident={(person) => setIncidentTarget(person)}
                      onViewHistory={(person) => setHistoryTarget(person)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="acopio" className="mt-5">
              {acopios.length === 0 ? (
                <EmptyZones message="No hay centros de acopio configurados." />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {acopios.map((zone) => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      incidents={incidents}
                      wasteEntries={wasteEntries[zone.id] ?? []}
                      onAddIncident={(person) => setIncidentTarget(person)}
                      onViewHistory={(person) => setHistoryTarget(person)}
                      onAddWaste={() => setWasteTarget(zone)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Modal: nueva incidencia */}
      <IncidentFormModal
        open={incidentTarget !== null}
        onClose={() => setIncidentTarget(null)}
        person={incidentTarget}
        eventId={eventId}
        onSave={handleSaveIncident}
      />

      {/* Modal: historial */}
      <IncidentHistoryModal
        open={historyTarget !== null}
        onClose={() => setHistoryTarget(null)}
        person={historyTarget}
        incidents={historyTarget ? (incidents[historyTarget.userId] ?? []) : []}
      />

      {/* Modal: registrar basura */}
      <WasteFormModal
        open={wasteTarget !== null}
        onClose={() => setWasteTarget(null)}
        zone={wasteTarget}
        onSave={handleSaveWaste}
      />
    </div>
  );
}
