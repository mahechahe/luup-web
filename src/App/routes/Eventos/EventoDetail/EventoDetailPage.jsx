import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEventoDetailService,
  uploadEventMapService,
} from '../services/eventServices';
import { generateId, IS_ADMIN } from './components/constants';
import { DeleteZoneModal } from './components/DeleteZoneModal';
import { ErrorState } from './components/ErrorState';
import { EventoHeader } from './components/EventoHeader';
import { ZonesCanvas } from './components/ZonesCanvas';
import { ZonesSidebar } from './components/ZonesSidebar';

function EventoDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  /* Datos del evento */
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  /* UI */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* Zonas */
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem(`zones_${eventId}`);
    return saved ? JSON.parse(saved) : [];
  });

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

  /* Persistir zonas */
  useEffect(() => {
    localStorage.setItem(`zones_${eventId}`, JSON.stringify(zones));
  }, [zones, eventId]);

  /* Cargar evento */
  useEffect(() => {
    setLoading(true);
    getEventoDetailService(eventId).then((res) => {
      if (res.status) {
        setEvent(res.event);
        if (res.event?.mapImageUrl) setPlanImage(res.event.mapImageUrl);
      } else {
        setError(res.errors ?? 'No se pudo cargar el evento.');
      }
      setLoading(false);
    });
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

  const confirmDeleteZone = (id) => {
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
        onBack={() => navigate('/eventos')}
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
        onConfirm={confirmDeleteZone}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default EventoDetailPage;
