import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  XCircle,
  XCircle as XCircleIcon,
} from 'lucide-react';
import {
  getWorkerCurrentEventService,
  getWorkerAttendanceService,
  getWorkerZonesService,
} from './services/eventServices';
import { getEventoDetailService } from './services/eventServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const ROLE_LABELS = {
  worker: 'Colaborador',
  supervisor: 'Supervisor',
  coordinator: 'Coordinador',
  responsable_acopio: 'Responsable de acopio',
};

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

  const status =
    attended === null || attended === undefined
      ? {
          label: 'Pendiente de check-in',
          helper: 'Tu asistencia aún no ha sido registrada',
          icon: Clock,
          cardClass: 'border-border',
          iconClass: 'bg-muted text-muted-foreground',
          pillClass: 'border-border bg-muted/60 text-muted-foreground',
        }
      : attended
        ? {
            label: 'Asistencia confirmada',
            helper: 'Tu ingreso al evento quedó registrado',
            icon: CheckCircle2,
            cardClass: 'border-emerald-200/80 dark:border-emerald-800/70',
            iconClass:
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
            pillClass:
              'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
          }
        : {
            label: 'Asistencia no registrada',
            helper: 'No figuras como asistente en este evento',
            icon: XCircle,
            cardClass: 'border-destructive/25',
            iconClass: 'bg-destructive/10 text-destructive',
            pillClass:
              'border-destructive/20 bg-destructive/10 text-destructive',
          };
  const StatusIcon = status.icon;

  return (
    <Card
      className={`gap-0 overflow-hidden py-0 shadow-sm ${status.cardClass}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${status.iconClass}`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Tu estado en el evento
              </p>
              <p className="mt-1 font-bold text-foreground">{status.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {status.helper}
              </p>
            </div>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${status.pillClass}`}
          >
            {attended ? 'Check-in completo' : 'Sin confirmar'}
          </span>
        </div>

        <div className="grid grid-cols-2 border-y border-border/70 bg-muted/20">
          <div className="flex items-center gap-3 border-r border-border/70 px-5 py-4 sm:px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <LogIn className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Entrada
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                {formatTime(entryTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <LogOut className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Salida
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                {formatTime(exitTime)}
              </p>
            </div>
          </div>
        </div>

        {incidents.length > 0 && (
          <div className="p-5 sm:p-6">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <Coffee className="w-3.5 h-3.5" />
              Breaks e incidencias
            </p>
            <div className="flex flex-wrap gap-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground"
                >
                  <span className="font-medium">{inc.name}</span>
                  <span className="text-muted-foreground">· {inc.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {incidents.length === 0 && attended && (
          <div className="flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground sm:px-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Sin breaks o incidencias registradas.
          </div>
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
    <Card className="gap-0 overflow-hidden border-border py-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand">
              Ubicación operativa
            </p>
            <h2 className="mt-1 font-bold text-foreground">
              Tus zonas asignadas
            </h2>
          </div>
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {zones.length} {zones.length === 1 ? 'zona' : 'zonas'}
          </span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <div
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: zone.color }}
              />
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${zone.color}20` }}
              >
                <MapPin className="h-4 w-4" style={{ color: zone.color }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {zone.name}
                </p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {zone.category}
                </p>
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

  const isSupervisorOrCoordinator =
    role === 'supervisor' ||
    role === 'coordinator' ||
    role === 'responsable_acopio';

  const modules = [
    {
      id: 'zonas',
      title: 'Mis Zonas',
      description:
        'Visualiza las zonas del evento a las que estás asignado y gestiona el personal.',
      icon: Layers,
      color: 'bg-[#DD7419]',
      path: `/eventos/${eventId}/zonas`,
    },
  ];

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-background px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero del evento */}
        <header className="relative isolate overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/[0.09] via-card to-card px-5 py-5 shadow-sm sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full border border-brand/10" />
          <div className="pointer-events-none absolute -right-5 -top-14 -z-10 h-40 w-40 rounded-full border border-dashed border-brand/15" />
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/eventos/mis-eventos')}
              aria-label="Volver a mis eventos"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/70 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-x-0.5 hover:border-brand/30 hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              {loading ? (
                <>
                  <Skeleton className="mb-2 h-3.5 w-28" />
                  <Skeleton className="mb-2 h-7 w-56" />
                  <Skeleton className="h-4 w-40" />
                </>
              ) : (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-brand">
                      <Activity className="h-3.5 w-3.5" />
                      Centro de operación
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                      Evento activo
                    </span>
                  </div>
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {currentEvent?.name ?? 'Evento'}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand" />
                      {currentEvent?.location || 'Ubicación por confirmar'}
                    </span>
                    {role && (
                      <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs font-semibold">
                        {ROLE_LABELS[role] ?? role}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="mt-5 space-y-5 sm:mt-6">
          {/* Evento inactivo */}
          {!eventoActivo && !loading && (
            <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <XCircleIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Evento no disponible
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Este evento ya no está activo. No puedes gestionar zonas ni
                registrar incidencias.
              </p>
            </div>
          )}

          {eventoActivo && (
            <>
              {/* Recuadro de estado siempre visible */}
              <AttendanceCard
                attendance={attendance}
                loading={loadingAttendance}
              />

              {/* Colaborador: solo ve su zona de solo lectura */}
              {role === 'worker' && (
                <ZonasReadOnly eventId={eventId} loading={loading} />
              )}

              {/* Supervisor/Coordinator: ve módulos con acciones */}
              {isSupervisorOrCoordinator && (
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Módulos disponibles
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {modules.map((module) => {
                      const hasCheckIn = !!attendance?.entryTime;
                      const disabled = module.id === 'zonas' && !hasCheckIn;

                      return (
                        <div key={module.id} className="flex flex-col gap-2">
                          <button
                            onClick={() => !disabled && navigate(module.path)}
                            disabled={disabled || loadingAttendance}
                            className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-300 ${
                              disabled || loadingAttendance
                                ? 'cursor-not-allowed border-border opacity-50'
                                : 'cursor-pointer border-border hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md'
                            }`}
                          >
                            <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                module.color
                              } ${
                                !disabled && !loadingAttendance
                                  ? 'transition-transform duration-300 group-hover:scale-105'
                                  : ''
                              }`}
                            >
                              <module.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-brand">
                                {module.title}
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                          </button>

                          {disabled && !loadingAttendance && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                                Debes registrar tu{' '}
                                <span className="font-semibold">check-in</span>{' '}
                                en el evento antes de acceder a tus zonas.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
