import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteEventZoneService,
  getEventoDetailService,
  getEventZonesService,
  updateEventZonesService,
  uploadEventMapService,
} from '../services/eventServices';
import { generateId, IS_ADMIN } from './components/constants';
import { DeleteZoneModal } from './components/DeleteZoneModal';
import { ErrorState } from './components/ErrorState';
import { EventoHeader } from './components/EventoHeader';
import { LoadingModal } from './components/LoadingModal';
import { ZonesCanvas } from './components/ZonesCanvas';
import { ZonesSidebar } from './components/ZonesSidebar';

function CanvasPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  /* Datos del evento */
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  /* UI */
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        // Construir array de personas combinando supervisor, coordinador y colaboradores
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

        if (zone.coordinador) {
          people.push({
            id: zone.coordinador.userId,
            name: `${zone.coordinador.firstName} ${zone.coordinador.lastName}`.trim(),
            cedula: zone.coordinador.cedula,
            role: 'coordinador',
            status: 'confirmed',
          });
        }

        zone.colaboradores.forEach((c) => {
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
          people,
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

      <div className="flex flex-1 overflow-hidden relative">
        <ZonesCanvas
          zones={zones}
          selectedId={selectedId}
          tool={tool}
          planImage={displayedPlan}
          polyPoints={polyPoints}
          isAdmin={IS_ADMIN}
          sidebarOpen={sidebarOpen}
          loading={loading}
          onAddZone={addZone}
          onUpdateZone={updateZone}
          onSelectZone={setSelectedId}
          onAddPolyPoint={handleAddPolyPoint}
          onFinishPolygon={finishPolygon}
          onChangeTool={setTool}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onSelectPlan={() => fileInputRef.current.click()}
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
