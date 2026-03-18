import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, ArrowLeft, CheckCircle2, XCircle, Clock, LogIn, LogOut, Coffee, MapPin, XCircle as XCircleIcon } from 'lucide-react';
import { getWorkerCurrentEventService, getWorkerAttendanceService, getWorkerZonesService } from './services/eventServices';
import { getEventoDetailService } from './services/eventServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/* ── Recuadro de estado ──────────────────────────────────── */
function AttendanceCard({ attendance, loading }) {
  if (loading) {
    return (
      <Card className="border-border shadow-sm animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-muted rounded w-48 mb-3" />
          <div className="h-6 bg-muted rounded w-32 mb-4" />
          <div className="flex gap-6">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const attended = attendance?.attended;
  const entryTime = attendance?.entryTime;
  const exitTime = attendance?.exitTime;
  const incidents = attendance?.incidents ?? [];

  return (
    <Card className={`shadow-sm ${attended ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-border'}`}>
      <CardContent className="p-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Tu estado en el evento
        </p>

        <div className="flex items-center gap-2 mb-4">
          {attended === null || attended === undefined ? (
            <><Clock className="w-5 h-5 text-muted-foreground" /><span className="text-base font-semibold text-muted-foreground">Pendiente de check-in</span></>
          ) : attended ? (
            <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-base font-semibold text-emerald-700">Asistió al evento</span></>
          ) : (
            <><XCircle className="w-5 h-5 text-destructive" /><span className="text-base font-semibold text-destructive">No asistió</span></>
          )}
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Entrada</p>
              <p className="text-sm font-semibold text-foreground">{formatTime(entryTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Salida</p>
              <p className="text-sm font-semibold text-foreground">{formatTime(exitTime)}</p>
            </div>
          </div>
        </div>

        {incidents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" />
              Breaks e incidencias
            </p>
            <div className="flex flex-wrap gap-2">
              {incidents.map((inc) => (
                <div key={inc.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground">
                  <span className="font-medium">{inc.name}</span>
                  <span className="text-muted-foreground">· {inc.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {incidents.length === 0 && attended && (
          <p className="text-xs text-muted-foreground">Sin breaks o incidencias registradas.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Zonas de solo lectura para colaborador ──────────────── */
function ZonasReadOnly({ eventId, loading: parentLoading }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    getWorkerZonesService(eventId).then((res) => {
      if (res.status) setZones(res.zones);
      setLoading(false);
    });
  }, [eventId]);

  if (loading || parentLoading) {
    return (
      <Card className="border-border shadow-sm animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-muted rounded w-32 mb-3" />
          <div className="h-4 bg-muted rounded w-48" />
        </CardContent>
      </Card>
    );
  }

  if (zones.length === 0) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Tu zona asignada
        </p>
        <div className="flex flex-col gap-3">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
              <div>
                <p className="text-sm font-semibold text-foreground">{zone.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{zone.category}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Vista principal ─────────────────────────────────────── */
export default function WorkerEventoModulesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [eventoActivo, setEventoActivo] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    getWorkerCurrentEventService().then((res) => {
      if (res.status && res.currentEvent) {
        setCurrentEvent(res.currentEvent);
        setRole(res.currentEvent.role);
      }
      setLoading(false);
    });

    getEventoDetailService(eventId).then((res) => {
      if (res.status) setEventoActivo(res.event?.isActive === 1);
    });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    getWorkerAttendanceService(eventId).then((res) => {
      if (res.status) setAttendance(res.attendance);
      setLoadingAttendance(false);
    });
  }, [eventId]);

  const isSupervisorOrCoordinator = role === 'supervisor' || role === 'coordinator' || role === 'responsable_acopio';

  const modules = [
    {
      id: 'zonas',
      title: 'Mis Zonas',
      description: 'Visualiza las zonas del evento a las que estás asignado y gestiona el personal.',
      icon: Layers,
      color: 'bg-[#DD7419]',
      path: `/eventos/${eventId}/zonas`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/eventos/mis-eventos')}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {loading ? (
              <>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3.5 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-base font-bold text-foreground">{currentEvent?.name ?? 'Evento'}</h1>
                <p className="text-xs text-muted-foreground">{currentEvent?.location}</p>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Evento inactivo */}
        {!eventoActivo && !loading && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Evento no disponible</h2>
            <p className="text-sm text-muted-foreground">
              Este evento ya no está activo. No puedes gestionar zonas ni registrar incidencias.
            </p>
          </div>
        )}

        {eventoActivo && (
          <>
            {/* Recuadro de estado siempre visible */}
            <AttendanceCard attendance={attendance} loading={loadingAttendance} />

            {/* Colaborador: solo ve su zona de solo lectura */}
            {role === 'worker' && (
              <ZonasReadOnly eventId={eventId} loading={loading} />
            )}

            {/* Supervisor/Coordinator: ve módulos con acciones */}
            {isSupervisorOrCoordinator && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Módulos disponibles
                </p>
                <div className="grid grid-cols-1 gap-4">
                  {modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => navigate(module.path)}
                      className="group relative bg-card rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-[#234465] dark:hover:border-[#7493B2] hover:shadow-md transition-all duration-300 text-left flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-[#234465] dark:group-hover:text-[#7493B2] transition-colors">
                          {module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
