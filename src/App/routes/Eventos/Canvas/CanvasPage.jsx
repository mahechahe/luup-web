import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteEventZoneService,
  getEventoDetailService,
  getEventZonesService,
  updateEventZonesService,
  uploadEventMapService,
} from '../services/eventServices';
import { generateId } from './components/constants';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { DeleteZoneModal } from './components/DeleteZoneModal';
import { ErrorState } from './components/ErrorState';
import { EventoHeader } from './components/EventoHeader';
import { LoadingModal } from './components/LoadingModal';
import { ZonesCanvas } from './components/ZonesCanvas';
import { ZonesSidebar } from './components/ZonesSidebar';
// ✅ FIX #3: se agrega ChevronDown y ChevronUp para el acordeón del layout
import { ChevronDown, ChevronUp, X } from 'lucide-react';

function CanvasPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useUserStore();
  const IS_ADMIN = hasAdminAccess(user?.roleId);

  /* Datos del evento */
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  /* UI */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // ✅ Modal de mapa fullscreen en móvil
  const [mapFullscreen, setMapFullscreen] = useState(false);
  // ✅ FIX #3: controla si el canvas acordeón está expandido en móvil
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingZone, setIsDeletingZone] = useState(false);

  /* Zonas */
  const [zones, setZones] = useState([]);

  /* Plano */
  const [planImage, setPlanImage] = useState(null); // URL del servidor (presignedUrl)
  const [pendingFile, setPendingFile] = useState(null); // File seleccionado sin subir
  const [pendingPreview, setPendingPreview] = useState(null); // data URL para preview local
  const [uploadingPlan, setUploadingPlan] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  /* Canvas */
  const [tool, setTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [polyPoints, setPolyPoints] = useState([]);

  /* ── Función para cargar zonas (reutilizable) ─────────── */
  const loadZones = async () => {
    const zonesRes = await getEventZonesService(eventId);
    if (zonesRes.status && zonesRes.data) {
      // Establecer imagen del plano
      if (zonesRes.data.event?.mapImageUrl) {
        setPlanImage(zonesRes.data.event.mapImageUrl);
      }

      // Procesar y establecer zonas
      const processedZones = zonesRes.data.zones.map((zone) => {
        // Construir array de personas combinando todos los roles
        const people = [];

        if (zone.supervisor) {
          people.push({
            id: zone.supervisor.userId,
            name: `${zone.supervisor.firstName} ${zone.supervisor.lastName}`.trim(),
            cedula: zone.supervisor.cedula,
            role: 'supervisor',
            status: 'confirmed',
          });
        }

        if (zone.coordinator) {
          people.push({
            id: zone.coordinator.userId,
            name: `${zone.coordinator.firstName} ${zone.coordinator.lastName}`.trim(),
            cedula: zone.coordinator.cedula,
            role: 'coordinador',
            status: 'confirmed',
          });
        }

        // ✅ Responsables de acopio — array, similar a collaborators
        if (zone.responsableAcopio?.length) {
          zone.responsableAcopio.forEach((r) => {
            people.push({
              id: r.userId,
              name: `${r.firstName} ${r.lastName}`.trim(),
              cedula: r.cedula,
              role: 'responsable_acopio',
              status: 'confirmed',
            });
          });
        }

        zone.collaborators.forEach((c) => {
          people.push({
            id: c.userId,
            name: `${c.firstName} ${c.lastName}`.trim(),
            cedula: c.cedula,
            role: 'colaborador',
            status: 'confirmed',
          });
        });

        // Retornar zona en formato interno
        return {
          id: zone.id,
          name: zone.name,
          type: zone.type,
          category: zone.category,
          color: zone.color,
          maxCapacity: zone.maxCapacity,
          notes: zone.notes || '',
          wasteLimit: zone.wasteLimit ?? null,
          weightLimit: zone.weightLimit ?? null,
          people,
          // ✅ Exponer responsableAcopio como array para ZoneLabel en canvas
          responsableAcopio: zone.responsableAcopio?.length
            ? zone.responsableAcopio.map((r) => ({
                userId: r.userId,
                name: `${r.firstName} ${r.lastName}`.trim(),
                cedula: r.cedula,
              }))
            : [],
          // Expandir geometría según el tipo
          ...(zone.type === 'rect'
            ? zone.geometry
            : { points: zone.geometry.points }),
        };
      });

      setZones(processedZones);
    }
  };

  /* Cargar evento y zonas */
  useEffect(() => {
    const loadEventData = async () => {
      setLoading(true);

      // Cargar información básica del evento
      const eventRes = await getEventoDetailService(eventId);
      if (!eventRes.status) {
        setError(eventRes.errors ?? 'No se pudo cargar el evento.');
        setLoading(false);
        return;
      }

      setEvent(eventRes.event);

      // Cargar zonas del evento
      await loadZones();

      setLoading(false);
    };

    loadEventData();
  }, [eventId]);

  /* ── Handlers de zonas ───────────────────────────────── */
  const updateZone = (id, updates) =>
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );

  const addZone = (zone) => setZones((prev) => [...prev, zone]);

  const addPeople = (zoneId, collaborators, role) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const newPeople = collaborators.map((c) => ({
      id: c.userId,
      name: `${c.firstName} ${c.lastName}`.trim(),
      cedula: c.cedula,
      role,
      status: 'confirmed',
    }));
    updateZone(zoneId, { people: [...zone.people, ...newPeople] });
  };

  const removePerson = (zoneId, personId) => {
    const zone = zones.find((z) => z.id === zoneId);
    updateZone(zoneId, {
      people: zone.people.filter((p) => p.id !== personId),
    });
  };

  const confirmDeleteZone = async (id) => {
    // Si la zona tiene ID numérico (existe en la DB), eliminarla del servidor
    if (typeof id === 'number' && id > 0) {
      setIsDeletingZone(true);
      const response = await deleteEventZoneService(id);
      setIsDeletingZone(false);

      if (!response.status) {
        // Si falla la eliminación en el servidor, no eliminar del estado local
        return;
      }
    }

    // Eliminar del estado local (zonas nuevas o después de eliminar del servidor)
    setZones((prev) => prev.filter((z) => z.id !== id));
    setDeleteId(null);
    setSelectedId(null);
  };

  /* ── Handlers polígono ───────────────────────────────── */
  const handleAddPolyPoint = (point) =>
    setPolyPoints((prev) => [...prev, point]);

  const finishPolygon = () => {
    if (polyPoints.length < 3) return;
    const newZone = {
      id: generateId(),
      name: `Zona ${zones.length + 1}`,
      type: 'polygon',
      points: polyPoints,
      color: '#3b82f6',
      people: [],
      maxCapacity: 10,
      category: 'general',
      notes: '',
    };
    addZone(newZone);
    setSelectedId(newZone.id);
    setPolyPoints([]);
    setTool('select');
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
    if (newTool !== 'poly') setPolyPoints([]);
  };

  /* ── Selección de archivo (sin subir todavía) ────────── */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPendingPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Resetear el input para permitir volver a seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setUploadError(null);
  };

  /* ── Subida efectiva al servidor ─────────────────────── */
  const handleUploadPlan = async () => {
    if (!pendingFile) return;
    setUploadingPlan(true);
    setUploadError(null);
    const res = await uploadEventMapService(eventId, pendingFile);
    setUploadingPlan(false);
    if (res.status) {
      setPlanImage(res.data.presignedUrl);
      setPendingFile(null);
      setPendingPreview(null);
    } else {
      setUploadError(res.errors);
    }
  };

  /* Imagen que se muestra en el canvas (preview local o URL del servidor) */
  const displayedPlan = pendingPreview || planImage;

  /* ── Guardar zonas ───────────────────────────────────── */
  const handleSaveZones = async () => {
    setIsSaving(true);

    // Preparar JSON con toda la información
    const zonesData = zones.map((zone) => {
      // Extraer IDs por rol
      const supervisor = zone.people.find((p) => p.role === 'supervisor');
      const coordinador = zone.people.find((p) => p.role === 'coordinador');
      // ✅ Responsables de acopio — ahora es un array como collaborators
      const responsablesAcopio = zone.people.filter((p) => p.role === 'responsable_acopio');
      const colaboradores = zone.people.filter((p) => p.role === 'colaborador');

      return {
        // Incluir zoneId solo si la zona ya existe en la DB (id numérico)
        // Las zonas nuevas tienen ID temporal (string), no se envía zoneId
        ...(typeof zone.id === 'number' && zone.id > 0
          ? { zoneId: zone.id }
          : {}),

        // Información básica
        name: zone.name,
        type: zone.type, // 'rect' o 'polygon'
        category: zone.category, // 'general' o 'acopio'
        color: zone.color,
        maxCapacity: zone.maxCapacity,
        notes: zone.notes || '',
        wasteLimit: zone.category === 'acopio' ? (zone.wasteLimit ?? null) : null,
        weightLimit: zone.category === 'acopio' ? (zone.weightLimit ?? null) : null,

        // Geometría de la zona
        geometry:
          zone.type === 'rect'
            ? {
                x: zone.x,
                y: zone.y,
                width: zone.width,
                height: zone.height,
              }
            : {
                points: zone.points, // Array de {x, y}
              },

        // Personas asignadas (solo IDs)
        supervisorId: supervisor ? supervisor.id : null,
        coordinadorId: coordinador ? coordinador.id : null,
        // ✅ guardado como array de IDs
        responsableAcopioIds: responsablesAcopio.map((r) => r.id),
        colaboradorIds: colaboradores.map((c) => c.id),
      };
    });

    const dataToSave = {
      eventId: Number(eventId),
      zones: zonesData,
    };

    // Llamar al servicio
    const response = await updateEventZonesService(dataToSave);

    if (response.status) {
      // Recargar zonas actualizadas desde el servidor
      await loadZones();
    }

    setIsSaving(false);
  };

  /* ── Error / not found ───────────────────────────────── */
  if (!loading && (error || !event)) {
    return (
      <ErrorState error={error} onNavigateBack={() => navigate('/eventos')} />
    );
  }

  /* Props compartidas del canvas — evita repetir en cada instancia */
  const sharedCanvasProps = {
    zones,
    selectedId,
    tool,
    planImage: displayedPlan,
    polyPoints,
    isAdmin: IS_ADMIN,
    loading,
    onAddZone: addZone,
    onUpdateZone: updateZone,
    onSelectZone: setSelectedId,
    onAddPolyPoint: handleAddPolyPoint,
    onFinishPolygon: finishPolygon,
    onChangeTool: setTool,
    onSelectPlan: () => fileInputRef.current.click(),
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Input oculto para seleccionar archivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate(`/eventos/${eventId}`)}
        onSave={handleSaveZones}
      />

      {/* ── Layout desktop: canvas + sidebar lado a lado ── */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        <ZonesCanvas
          {...sharedCanvasProps}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <ZonesSidebar
          isOpen={sidebarOpen}
          tool={tool}
          zones={zones}
          selectedId={selectedId}
          isAdmin={IS_ADMIN}
          polyPoints={polyPoints}
          pendingFile={pendingFile}
          uploadingPlan={uploadingPlan}
          uploadError={uploadError}
          hasPlan={!!planImage}
          onToolChange={handleToolChange}
          onFinishPolygon={finishPolygon}
          onSelectPlan={() => fileInputRef.current.click()}
          onUploadPlan={handleUploadPlan}
          onCancelPending={handleCancelPending}
          onSelectZone={setSelectedId}
          onUpdateZone={updateZone}
          onAddPeople={addPeople}
          onRemovePerson={removePerson}
          onDeleteRequest={setDeleteId}
        />
      </div>

      {/* ── Layout móvil: canvas h-[50vh] arriba + sidebar abajo (igual que antes) ── */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">

        {/* ✅ FIX #3: el canvas inline y el botón flotante se reemplazan por un
            acordeón al final del sidebar — el usuario toca "Ver layout" para
            expandir/colapsar el mapa sin salir de la página */}

        {/* Sidebar en la parte inferior, scrolleable */}
        <div className="flex-1 overflow-y-auto border-t border-border">
          <ZonesSidebar
            isOpen={true}
            tool={tool}
            zones={zones}
            selectedId={selectedId}
            isAdmin={IS_ADMIN}
            polyPoints={polyPoints}
            pendingFile={pendingFile}
            uploadingPlan={uploadingPlan}
            uploadError={uploadError}
            hasPlan={!!planImage}
            onToolChange={handleToolChange}
            onFinishPolygon={finishPolygon}
            onSelectPlan={() => fileInputRef.current.click()}
            onUploadPlan={handleUploadPlan}
            onCancelPending={handleCancelPending}
            onSelectZone={setSelectedId}
            onUpdateZone={updateZone}
            onAddPeople={addPeople}
            onRemovePerson={removePerson}
            onDeleteRequest={setDeleteId}
          />

          {/* ✅ FIX #3: acordeón Ver / Ocultar layout — se agrega al final del sidebar */}
          <div className="border-t border-border">
            <button
              onClick={() => setMapExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition active:bg-muted"
            >
              <span className="text-sm font-bold text-foreground">
                {mapExpanded ? 'Ocultar layout' : 'Ver layout'}
              </span>
              {mapExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>

            {/* Canvas expandible — h-[60vh] da espacio útil para interactuar */}
            {mapExpanded && (
              <div className="h-[60vh] border-t border-border">
                <ZonesCanvas
                  {...sharedCanvasProps}
                  sidebarOpen={false}
                  onToggleSidebar={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Modal fullscreen del mapa — solo móvil */}
{mapFullscreen && (
  <div
    className="fixed inset-0 z-50 bg-background flex flex-col md:hidden"
    style={{
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
  >
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
      <p className="text-sm font-bold text-foreground">
        {event?.name ?? 'Mapa del evento'}
      </p>
      <button
        onClick={() => setMapFullscreen(false)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Canvas fullscreen con pan táctil y zoom */}
    <div className="flex-1 overflow-hidden">
      <ZonesCanvas
        {...sharedCanvasProps}
        sidebarOpen={false}
        onToggleSidebar={() => {}}
      />
    </div>
  </div>
)}

      <DeleteZoneModal
        deleteId={deleteId}
        isDeleting={isDeletingZone}
        onConfirm={confirmDeleteZone}
        onCancel={() => setDeleteId(null)}
      />

      {/* Modal de guardado */}
      {isSaving && <LoadingModal />}
    </div>
  );
}

export default CanvasPage;