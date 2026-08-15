import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, PackageOpen, RefreshCw, Search, X, ClipboardList } from 'lucide-react';
import {
  getEventoDetailService,
  getEventZonesWithStaffService,
  getWorkerZonesService,
  getWorkerCurrentEventService,
  transferPersonZoneService,
  getZoneWasteHistoryService,
  getZoneTruckExitsService,
  getZoneRequirementsService,
  getWasteDistributionsService,
  deleteWasteDistributionService,
} from '../services/eventServices';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess, isClientUser } from '@/App/utils/roles';
import { eventBasePath } from '@/App/utils/eventNav';
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
import { TruckExitFormModal } from './components/TruckExitFormModal';
import { TransferZoneModal } from './components/TransferZoneModal';
import { RequirementFormModal } from './components/RequirementFormModal';
import { WasteDistributionModal } from './components/WasteDistributionModal';

const COORDINATOR_CAN_TRANSFER_ANY_ZONE = false;

export default function ZonasPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const isAdmin = hasAdminAccess(user?.roleId);
  const isClient = isClientUser(user?.roleId);
  const [eventRole, setEventRole] = useState(null);
  const isCoordinator = eventRole === 'coordinator';
  const canTransfer = isAdmin || isCoordinator;
  // El cliente ve todo (como un admin) pero nunca puede registrar/editar nada.
  const canEditZone = !isClient;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState(null);
  const [zones, setZones] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [incidents, setIncidents] = useState({});
  const [incidentTarget, setIncidentTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  const [wasteEntries, setWasteEntries] = useState({});
  const [wasteLoading, setWasteLoading] = useState({});
  const [wasteTarget, setWasteTarget] = useState(null);
  const [wasteDistributions, setWasteDistributions] = useState({});
  const [wasteDistributionsLoading, setWasteDistributionsLoading] = useState({});
  const [wasteDistributionTarget, setWasteDistributionTarget] = useState(null);

  const [truckExits, setTruckExits] = useState({});
  const [truckExitsLoading, setTruckExitsLoading] = useState({});
  const [truckExitTarget, setTruckExitTarget] = useState(null);
  const [truckExitBalances, setTruckExitBalances] = useState({});

  const [requirements, setRequirements] = useState({});
  const [requirementsLoading, setRequirementsLoading] = useState({});
  const [requirementTarget, setRequirementTarget] = useState(null);

  const [transferTarget, setTransferTarget] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);

  const fetchWasteEntries = useCallback(async (zones) => {
    const acopioZones = zones.filter((z) => z.category === 'acopio');
    if (acopioZones.length === 0) return;
    setWasteLoading((prev) => {
      const next = { ...prev };
      acopioZones.forEach((z) => { next[z.id] = true; });
      return next;
    });
    await Promise.all(
      acopioZones.map(async (zone) => {
        const res = await getZoneWasteHistoryService(zone.id);
        if (res.status) setWasteEntries((prev) => ({ ...prev, [zone.id]: res.logs }));
        setWasteLoading((prev) => ({ ...prev, [zone.id]: false }));
      })
    );
  }, []);

  const fetchTruckExits = useCallback(async (zones) => {
    const acopioZones = zones.filter((z) => z.category === 'acopio');
    if (acopioZones.length === 0) return;
    setTruckExitsLoading((prev) => {
      const next = { ...prev };
      acopioZones.forEach((z) => { next[z.id] = true; });
      return next;
    });
    await Promise.all(
      acopioZones.map(async (zone) => {
        const res = await getZoneTruckExitsService(zone.id);
        if (res.status) {
          setTruckExits((prev) => ({ ...prev, [zone.id]: res.exits }));
          setTruckExitBalances((prev) => ({
            ...prev,
            [zone.id]: {
              remainingQuantity: res.remainingQuantity,
              remainingWeightKg: res.remainingWeightKg,
            },
          }));
        }
        setTruckExitsLoading((prev) => ({ ...prev, [zone.id]: false }));
      })
    );
  }, []);

  const fetchWasteDistribution = useCallback(async (zoneId) => {
    setWasteDistributionsLoading((prev) => ({ ...prev, [zoneId]: true }));
    const res = await getWasteDistributionsService(zoneId);
    if (res.status) {
      setWasteDistributions((prev) => ({ ...prev, [zoneId]: res.summary }));
    }
    setWasteDistributionsLoading((prev) => ({ ...prev, [zoneId]: false }));
  }, []);

  const fetchWasteDistributions = useCallback(async (zones) => {
    const acopioZones = zones.filter((zone) => zone.category === 'acopio');
    await Promise.all(acopioZones.map((zone) => fetchWasteDistribution(zone.id)));
  }, [fetchWasteDistribution]);

  const fetchRequirements = useCallback(async (zones) => {
    const generalZones = zones.filter((z) => z.category === 'general');
    if (generalZones.length === 0) return;
    setRequirementsLoading((prev) => {
      const next = { ...prev };
      generalZones.forEach((z) => { next[z.id] = true; });
      return next;
    });
    await Promise.all(
      generalZones.map(async (zone) => {
        const res = await getZoneRequirementsService(zone.id);
        if (res.status) setRequirements((prev) => ({ ...prev, [zone.id]: res.requirements }));
        setRequirementsLoading((prev) => ({ ...prev, [zone.id]: false }));
      })
    );
  }, []);

  // ✅ parseIncidents incluye responsableAcopio (array) además de supervisor, coordinador y colaboradores
  const parseIncidents = (zones) => {
    const map = {};
    zones.forEach((z) => {
      const people = [
        z.supervisor,
        z.coordinator,
        ...(z.responsableAcopio ?? []),
        ...z.collaborators,
      ].filter(Boolean);
      people.forEach((p) => { if (p.incidents?.length) map[p.userId] = p.incidents; });
    });
    return map;
  };

  const fetchZones = useCallback(async () => {
    const res = isAdmin || isClient
      ? await getEventZonesWithStaffService(eventId)
      : await getWorkerZonesService(eventId);
    if (res.status) {
      setZones(res.zones);
      setIncidents(parseIncidents(res.zones));
      fetchWasteEntries(res.zones);
      fetchTruckExits(res.zones);
      fetchWasteDistributions(res.zones);
      fetchRequirements(res.zones);
    }
  }, [eventId, isAdmin, isClient, fetchWasteEntries, fetchTruckExits, fetchWasteDistributions, fetchRequirements]);

  useEffect(() => {
    const fetchAll = async () => {
      const zonesPromise = isAdmin || isClient
        ? getEventZonesWithStaffService(eventId)
        : getWorkerZonesService(eventId);

      const [eventRes, zonesRes, workerRes] = await Promise.all([
        getEventoDetailService(eventId),
        zonesPromise,
        isClient ? Promise.resolve({ status: false }) : getWorkerCurrentEventService(),
      ]);

      if (eventRes.status) setEvent(eventRes.event);
      if (zonesRes.status) {
        setZones(zonesRes.zones);
        setIncidents(parseIncidents(zonesRes.zones));
        fetchWasteEntries(zonesRes.zones);
        fetchTruckExits(zonesRes.zones);
        fetchWasteDistributions(zonesRes.zones);
        fetchRequirements(zonesRes.zones);
      }
      if (workerRes.status && workerRes.currentEvent) setEventRole(workerRes.currentEvent.role);
      setLoading(false);
    };
    fetchAll();
  }, [eventId, isAdmin, isClient, fetchWasteEntries, fetchTruckExits, fetchWasteDistributions, fetchRequirements]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchZones();
    setRefreshing(false);
  };

  const handleSaveIncident = (userId, incident) => {
    setIncidents((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), incident] }));
  };

  const refreshTruckExitBalance = useCallback(async (zoneId) => {
    const res = await getZoneTruckExitsService(zoneId);
    if (res.status) {
      setTruckExitBalances((prev) => ({
        ...prev,
        [zoneId]: {
          remainingQuantity: res.remainingQuantity,
          remainingWeightKg: res.remainingWeightKg,
        },
      }));
    }
  }, []);

  const handleSaveWaste = (zoneId, entry) => {
    setWasteEntries((prev) => ({ ...prev, [zoneId]: [...(prev[zoneId] ?? []), entry] }));
    fetchWasteDistribution(zoneId);
    refreshTruckExitBalance(zoneId);
  };

  const handleSaveWasteDistribution = (zoneId, summary) => {
    setWasteDistributions((prev) => ({ ...prev, [zoneId]: summary }));
  };

  const handleDeleteWasteDistribution = async (zoneId, distributionId) => {
    const res = await deleteWasteDistributionService(zoneId, distributionId);
    if (res.status) handleSaveWasteDistribution(zoneId, res.summary);
    return res;
  };

  const handleSaveTruckExit = async (zoneId, exit) => {
    setTruckExits((prev) => ({ ...prev, [zoneId]: [...(prev[zoneId] ?? []), exit] }));
    await refreshTruckExitBalance(zoneId);
  };

  const handleSaveRequirement = (zoneId, requirement) => {
    setRequirements((prev) => ({ ...prev, [zoneId]: [requirement, ...(prev[zoneId] ?? [])] }));
  };

  const getAvailableZones = () => {
    if (isAdmin) return zones;
    if (isCoordinator) {
      if (COORDINATOR_CAN_TRANSFER_ANY_ZONE) return zones;
      return zones.filter((z) => z.coordinator?.userId === user?.userId);
    }
    return [];
  };

  const handleTransferConfirm = async (person, fromZoneId, toZoneId) => {
    setTransferLoading(true);
    const res = await transferPersonZoneService({ userId: person.userId, fromZoneId, toZoneId, eventId });
    if (res.status) { await fetchZones(); setTransferTarget(null); }
    else console.error(res.errors);
    setTransferLoading(false);
  };

  // Filtrar zonas por búsqueda de personal
  const filterZonesBySearch = (zoneList) => {
    if (!searchQuery.trim()) return zoneList;
    const q = searchQuery.toLowerCase();
    return zoneList.filter((zone) => {
      // ✅ Incluir responsableAcopio en la búsqueda
      const people = [
        zone.coordinator,
        zone.supervisor,
        ...(zone.responsableAcopio ?? []),
        ...zone.collaborators,
      ].filter(Boolean);
      return people.some((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.cedula?.toLowerCase().includes(q) ||
        zone.name?.toLowerCase().includes(q)
      );
    });
  };

  const generales = filterZonesBySearch(zones.filter((z) => z.category === 'general'));
  const acopios = filterZonesBySearch(zones.filter((z) => z.category === 'acopio'));

  const handleBack = () => {
    if (isAdmin || isClient) navigate(eventBasePath(eventId, user?.roleId));
    else navigate(`/eventos/${eventId}/worker`);
  };

  const renderZoneCard = (zone) => (
    <ZoneCard
      key={zone.id}
      zone={zone}
      incidents={incidents}
      wasteEntries={wasteEntries[zone.id] ?? []}
      wasteLoading={!!wasteLoading[zone.id]}
      wasteDistribution={wasteDistributions[zone.id]}
      wasteDistributionLoading={!!wasteDistributionsLoading[zone.id]}
      truckExits={truckExits[zone.id] ?? []}
      truckExitsLoading={!!truckExitsLoading[zone.id]}
      onAddIncident={canEditZone ? (person) => setIncidentTarget(person) : undefined}
      onViewHistory={(person) => setHistoryTarget(person)}
      requirements={requirements[zone.id] ?? []}
      requirementsLoading={!!requirementsLoading[zone.id]}
      onAddRequirement={canEditZone ? () => setRequirementTarget(zone) : undefined}
      onAddWaste={canEditZone ? () => setWasteTarget(zone) : undefined}
      onAddWasteDistribution={canEditZone ? () => setWasteDistributionTarget({ zone, distribution: null }) : undefined}
      onEditWasteDistribution={canEditZone ? (distribution) => setWasteDistributionTarget({ zone, distribution }) : undefined}
      onDeleteWasteDistribution={canEditZone ? (distributionId) => handleDeleteWasteDistribution(zone.id, distributionId) : undefined}
      onAddTruckExit={canEditZone ? () => setTruckExitTarget(zone) : undefined}
      onTransfer={canTransfer ? (person, zoneId) => setTransferTarget({ person, zoneId }) : undefined}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EventoHeader loading={loading} event={event} onBack={handleBack} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div className="rounded-2xl bg-[#234465] px-6 py-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Gestión de zonas
              </p>
              {loading ? (
                <><Skeleton className="h-7 w-40 mb-1.5 bg-white/20" /><Skeleton className="h-3.5 w-32 bg-white/15" /></>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold text-white leading-tight">
                    {isAdmin || isClient ? 'Zonas del evento' : 'Mis Zonas'}
                  </h2>
                  <p className="text-sm text-white/60 mt-0.5">
                    {zones.length} zona{zones.length !== 1 ? 's' : ''} configurada{zones.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[174px]">
            {isAdmin && (
              <Button
                onClick={() => navigate(`/eventos/${eventId}/zonas/asignacion-masiva`)}
                className="w-full gap-2 h-9 bg-[#DD7419] text-white hover:bg-[#c96512]"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Asignación masiva
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="w-full gap-2 h-9 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Buscador de personal */}
        {!loading && zones.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar persona o zona…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-9 w-full sm:w-36 rounded-lg" />
              <Skeleton className="h-9 w-full sm:w-36 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <ZoneCardSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="h-auto p-1 gap-1 bg-muted/60 flex-row w-full">
              <TabsTrigger
                value="general"
                className="flex-1  justify-center flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-[#234465] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Zona general</span>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-black/10 data-[state=active]:bg-white/20">
                  {generales.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="acopio"
                className="flex-1  justify-center flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-[#DD7419] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <PackageOpen className="w-4 h-4 shrink-0" />
                <span>Centro de Acopio</span>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-black/10 data-[state=active]:bg-white/20">
                  {acopios.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-5">
              {generales.length === 0 ? (
                <EmptyZones message={searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay zonas generales configuradas.'} />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {generales.map((zone) => renderZoneCard(zone))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="acopio" className="mt-5">
              {acopios.length === 0 ? (
                <EmptyZones message={searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay centros de acopio configurados.'} />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {acopios.map((zone) => renderZoneCard(zone))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <IncidentFormModal
        open={incidentTarget !== null}
        onClose={() => setIncidentTarget(null)}
        person={incidentTarget}
        eventId={eventId}
        onSave={handleSaveIncident}
      />

      <IncidentHistoryModal
        open={historyTarget !== null}
        onClose={() => setHistoryTarget(null)}
        person={historyTarget}
        incidents={historyTarget ? (incidents[historyTarget.userId] ?? []) : []}
      />

      <WasteFormModal
        open={wasteTarget !== null}
        onClose={() => setWasteTarget(null)}
        zone={wasteTarget}
        onSave={handleSaveWaste}
      />

      <WasteDistributionModal
        open={wasteDistributionTarget !== null}
        onClose={() => setWasteDistributionTarget(null)}
        zone={wasteDistributionTarget?.zone}
        distribution={wasteDistributionTarget?.distribution}
        summary={wasteDistributionTarget ? wasteDistributions[wasteDistributionTarget.zone.id] : null}
        onSave={handleSaveWasteDistribution}
      />

      <TruckExitFormModal
        open={truckExitTarget !== null}
        onClose={() => setTruckExitTarget(null)}
        zone={truckExitTarget}
        remainingWeightKg={truckExitTarget ? truckExitBalances[truckExitTarget.id]?.remainingWeightKg : undefined}
        onSave={handleSaveTruckExit}
      />

      <RequirementFormModal
        open={requirementTarget !== null}
        onClose={() => setRequirementTarget(null)}
        zone={requirementTarget}
        onSave={handleSaveRequirement}
      />

      <TransferZoneModal
        open={transferTarget !== null}
        onClose={() => setTransferTarget(null)}
        person={transferTarget?.person}
        currentZoneId={transferTarget?.zoneId}
        availableZones={getAvailableZones()}
        onConfirm={handleTransferConfirm}
        loading={transferLoading}
      />
    </div>
  );
}
