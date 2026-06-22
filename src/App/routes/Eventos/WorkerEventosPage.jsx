import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  HardHat,
  Check,
  X,
  AlertTriangle,
  LogIn,
  LogOut,
  FileText,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getWorkerCurrentEventService,
  getWorkerEventHistoryService,
  getWorkerAttendanceService,
} from './services/eventServices';

const PAGE_LIMIT = 10;

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  const normalized = iso.toString().replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const ROLE_CONFIG = {
  coordinator: {
    label: 'Coordinador',
    icon: ShieldCheck,
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-400/20',
  },
  supervisor: {
    label: 'Supervisor',
    icon: UserCheck,
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20',
  },
  worker: {
    label: 'Colaborador',
    icon: HardHat,
    className:
      'bg-slate-50 text-luup-blue-dark border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/10',
  },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.worker;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function EventDateDisplay({ event }) {
  if (event.dateType === 'stages')
    return (
      <span>
        {formatDate(event.startDate)} — {formatDate(event.endDate)}
      </span>
    );
  return <span>{formatDate(event.date)}</span>;
}

/* ── Skeletons ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {['w-40', 'w-24', 'w-32', 'w-20', 'w-24', 'w-24'].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-muted rounded-full ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="relative isolate min-h-64 overflow-hidden px-6 py-12 text-center sm:min-h-72">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_32%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand/15" />

      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 scale-150 rounded-full bg-brand/5 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-card shadow-[0_12px_32px_rgba(221,116,25,0.12)]">
            <Calendar className="h-7 w-7 text-brand" strokeWidth={1.8} />
          </div>
        </div>
        <span className="mb-3 rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Todo listo por aquí
        </span>
        <p className="text-lg font-bold tracking-tight text-foreground">
          Tu historial empezará aquí
        </p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Cuando finalices tu primer evento podrás consultar aquí tu asistencia,
          horario y rol.
        </p>
      </div>
    </div>
  );
}

/* ── Paginación ──────────────────────────────────────────── */
function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border flex-wrap gap-2">
      <p className="text-xs text-muted-foreground">
        Mostrando{' '}
        <span className="font-semibold text-foreground">
          {from}–{to}
        </span>{' '}
        de <span className="font-semibold text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          return (
            <span key={p} className="flex items-center gap-1">
              {prev && p - prev > 1 && (
                <span className="text-muted-foreground text-xs px-1">…</span>
              )}
              <Button
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className={`h-8 w-8 text-xs ${
                  p === page
                    ? 'bg-brand text-brand-foreground hover:bg-brand/90 border-brand'
                    : ''
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </span>
          );
        })}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Modal detalle evento ─────────────────────────────────── */
function EventDetailModal({ event, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    getWorkerAttendanceService(event.eventId).then((res) => {
      if (res.status) setDetail(res.attendance);
      else toast.error('Error al cargar el detalle.');
      setLoading(false);
    });
  }, [event]);

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-0.5">
            Detalle del evento
          </p>
          <DialogTitle className="leading-tight">{event?.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {event?.location ?? '—'}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {event && <EventDateDisplay event={event} />}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-muted rounded-full w-28" />
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-24 mt-2" />
              <div className="h-16 bg-muted rounded-xl" />
            </div>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se encontró información de asistencia.
            </p>
          ) : (
            <>
              <RoleBadge role={event?.role} />

              {/* Bloque asistencia */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Asistencia
                </p>

                {detail.attended === true ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Asistió
                  </span>
                ) : detail.attended === false ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold">
                    <X className="w-3.5 h-3.5" /> No asistió
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-xs font-semibold">
                    Sin registro
                  </span>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <LogIn className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Entrada
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {formatTime(detail.entryTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Salida
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {formatTime(detail.exitTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {detail.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {detail.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Incidencias */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Incidencias ({detail.incidents?.length ?? 0})
                </p>
                {!detail.incidents || detail.incidents.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Sin incidencias registradas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {inc.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatTime(inc.time)}
                            </span>
                          </div>
                          {inc.note && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inc.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Card: Evento actual ─────────────────────────────────── */
function CurrentEventCard({ currentEvent, loading, navigate }) {
  if (loading) {
    return (
      <Card className="border-border shadow-sm animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-muted rounded w-48 mb-3" />
          <div className="h-6 bg-muted rounded w-64 mb-2" />
          <div className="h-4 bg-muted rounded w-40" />
        </CardContent>
      </Card>
    );
  }
  if (!currentEvent) {
    return (
      <Card className="gap-0 overflow-hidden border-border bg-gradient-to-br from-card via-card to-muted/25 py-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Clock className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ahora mismo
            </p>
            <p className="mt-1 font-bold text-foreground">
              Sin evento asignado
            </p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Te avisaremos cuando tengas un nuevo evento activo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="group relative gap-0 overflow-hidden border-brand/25 bg-gradient-to-br from-brand/[0.09] via-card to-card py-0 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:from-brand/[0.11] dark:via-card dark:to-card">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/80 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full border border-brand/10" />
      <div className="pointer-events-none absolute -right-4 -top-10 h-32 w-32 rounded-full border border-dashed border-brand/10" />

      <CardContent className="relative grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-start gap-4 sm:items-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 shadow-inner">
            <div className="absolute inset-2 rounded-xl border border-brand/15" />
            <CheckCircle2
              className="relative h-6 w-6 text-brand"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand">
                Evento actual
              </p>
              <span className="h-1 w-1 rounded-full bg-brand/60" />
              <span className="text-[11px] font-medium text-muted-foreground">
                Asignación activa
              </span>
            </div>
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {currentEvent.name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                {currentEvent.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5 text-brand" />
                <EventDateDisplay event={currentEvent} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:pl-[4.5rem] md:flex-col md:items-end md:pl-0">
          <RoleBadge role={currentEvent.role} />
          <Button
            className="group/button ml-auto min-w-36 gap-2 bg-brand text-brand-foreground shadow-[0_8px_20px_rgba(221,116,25,0.22)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_12px_24px_rgba(221,116,25,0.3)] sm:ml-0"
            onClick={() => navigate(`/eventos/${currentEvent.eventId}/worker`)}
          >
            Entrar al evento
            <ChevronRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Vista principal ─────────────────────────────────────── */
function WorkerEventosPage() {
  const navigate = useNavigate();
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    getWorkerCurrentEventService().then((res) => {
      if (res.status) setCurrentEvent(res.currentEvent);
      else toast.error(res.errors ?? 'Error al cargar el evento actual.');
      setLoadingCurrent(false);
    });
  }, []);

  const fetchHistory = useCallback(async (page) => {
    setLoadingHistory(true);
    const res = await getWorkerEventHistoryService({ page, limit: PAGE_LIMIT });
    if (res.status) {
      setHistory(res.history);
      setPagination(res.pagination);
    } else toast.error(res.errors ?? 'Error al cargar el historial.');
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const HISTORY_COLUMNS = [
    'Nombre',
    'Fecha',
    'Ubicación',
    'Asistencia',
    'Horario',
    'Rol',
  ];

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-background px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="group gap-2 text-muted-foreground hover:text-brand -ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver a selección
        </Button>

        <div className="flex flex-col gap-2 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-[0_8px_20px_rgba(221,116,25,0.25)]">
                <Calendar className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Mis eventos
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Revisa tu asignación actual y el registro de tus participaciones
              anteriores.
            </p>
          </div>
        </div>

        <CurrentEventCard
          currentEvent={currentEvent}
          loading={loadingCurrent}
          navigate={navigate}
        />

        {/* Historial */}
        <Card className="gap-0 overflow-hidden border-border py-0 shadow-sm">
          <CardHeader className="min-h-16 grid-cols-[1fr_auto] items-center gap-4 border-b border-border/70 bg-card px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Actividad anterior
              </p>
              <CardTitle className="mt-1 text-base font-bold text-foreground">
                Historial de eventos
              </CardTitle>
            </div>
            <div className="shrink-0 rounded-full border border-border bg-muted/45 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {loadingHistory
                ? 'Cargando…'
                : `${pagination.total} ${
                    pagination.total === 1 ? 'evento' : 'eventos'
                  }`}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!loadingHistory && history.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      {HISTORY_COLUMNS.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory
                      ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                          <SkeletonRow key={i} />
                        ))
                      : history.map((ev) => (
                          <tr
                            key={ev.eventId}
                            onClick={() => setSelectedEvent(ev)}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="font-semibold text-foreground">
                                {ev.name}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                              <EventDateDisplay event={ev} />
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {ev.location ?? '—'}
                            </td>

                            {/* Asistencia */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {ev.attended === true ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                  <Check className="w-3 h-3" /> Asistió
                                </span>
                              ) : ev.attended === false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                                  <X className="w-3 h-3" /> No asistió
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Horario */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span className="text-muted-foreground">
                                  <span className="font-semibold mr-1">E</span>
                                  <span
                                    className={
                                      ev.entryTime
                                        ? 'text-foreground font-medium'
                                        : ''
                                    }
                                  >
                                    {formatTime(ev.entryTime)}
                                  </span>
                                </span>
                                <span className="text-muted-foreground">
                                  <span className="font-semibold mr-1">S</span>
                                  <span
                                    className={
                                      ev.exitTime
                                        ? 'text-foreground font-medium'
                                        : ''
                                    }
                                  >
                                    {formatTime(ev.exitTime)}
                                  </span>
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <RoleBadge role={ev.role} />
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loadingHistory && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={fetchHistory}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

export default WorkerEventosPage;
