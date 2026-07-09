import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  HardHat,
  LogIn,
  LogOut,
  Shirt,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getWorkerCurrentEventService,
  getWorkerEventHistoryService,
} from './services/eventServices';
import { getEventDateStatus } from './utils/eventDateStatus';

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

/* ── Chip ─────────────────────────────────────────────────── */
function Chip({ label, value, positive, negative }) {
  const base =
    'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border';
  if (value === true)
    return (
      <span
        className={`${base} ${
          positive ??
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
        }`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {label}
      </span>
    );
  if (value === false)
    return (
      <span
        className={`${base} ${
          negative ??
          'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60'
        }`}
      >
        <XCircle className="w-3 h-3" />
        Sin {label.toLowerCase()}
      </span>
    );
  return null;
}

/* ── Skeletons ────────────────────────────────────────────── */
function HistoryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-muted rounded-full w-40" />
          <div className="h-3 bg-muted rounded-full w-56" />
        </div>
        <div className="h-6 bg-muted rounded-full w-20" />
      </div>
    </div>
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
    <div className="flex items-center justify-between px-1 py-3 flex-wrap gap-2">
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

/* ── Card: historial de evento (expandible) ──────────────── */
function WorkerEventHistoryCard({ event }) {
  const [open, setOpen] = useState(false);

  const attendedKey =
    event.attended === true
      ? 'true'
      : event.attended === false
        ? 'false'
        : 'null';
  const attendedConfig = {
    true: {
      icon: CheckCircle2,
      label: 'Asistió',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      accentClass: 'border-l-emerald-500',
    },
    false: {
      icon: XCircle,
      label: 'No asistió',
      badgeClass:
        'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
      accentClass: 'border-l-red-500',
    },
    null: {
      icon: Clock,
      label: 'Pendiente',
      badgeClass: 'bg-muted text-muted-foreground border-border',
      accentClass: 'border-l-muted-foreground/30',
    },
  };
  const att = attendedConfig[attendedKey];
  const AttIcon = att.icon;

  const hasRecords = event.attendanceRecords?.length > 0;
  const hasInventory = event.inventoryItems?.length > 0;
  const hasIncidents = event.incidents?.length > 0;

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden border-l-4 ${att.accentClass}`}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {event.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {event.location ?? '—'} · <EventDateDisplay event={event} />
            </p>
            <div className="mt-1.5 sm:hidden">
              <RoleBadge role={event.role} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex">
            <RoleBadge role={event.role} />
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${att.badgeClass}`}
          >
            <AttIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{att.label}</span>
          </span>
          <span
            className={`text-muted-foreground text-xs transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {/* ── Registros de asistencia ── */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Registros de asistencia{' '}
              {hasRecords ? `(${event.attendanceRecords.length})` : ''}
            </p>
            {hasRecords ? (
              event.attendanceRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-lg bg-muted/40 border border-border p-3 space-y-3"
                >
                  {/* Date + times */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {rec.dateRegister && (
                      <span className="text-xs font-semibold text-foreground">
                        {formatDate(rec.dateRegister)}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LogIn className="w-3.5 h-3.5" />
                        {formatTime(rec.entryTime)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LogOut className="w-3.5 h-3.5" />
                        {formatTime(rec.exitTime)}
                      </span>
                    </div>
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <Chip label="Uniforme" value={rec.uniform} />
                    {rec.uniform && rec.uniformSize && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                        <Shirt className="w-3 h-3" />
                        Talla {rec.uniformSize}
                      </span>
                    )}
                    {rec.uniform && rec.returnedUniform === true && (
                      <Chip label="Devolvió uniforme" value={true} />
                    )}
                    {rec.uniform && rec.returnedUniform === false && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                        <XCircle className="w-3 h-3" />
                        No devolvió uniforme
                      </span>
                    )}
                    <Chip label="Snack" value={rec.receivedSnack} />
                    <Chip label="Almuerzo" value={rec.receivedLunch} />
                    <Chip label="Maletín" value={rec.receivedSuitcase} />
                  </div>
                  {rec.snackDetail && (
                    <p className="text-xs text-muted-foreground">
                      Snack: {rec.snackDetail}
                    </p>
                  )}
                  {rec.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      &quot;{rec.notes}&quot;
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin registros de asistencia.
              </p>
            )}
          </div>

          {/* ── Inventario ── */}
          {hasInventory && (
            <div className="px-4 py-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Inventario asignado ({event.inventoryItems.length})
              </p>
              {event.inventoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {item.quantity} asig.
                    </span>
                    {item.returnedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                        {item.returnedQuantity} dev.
                      </span>
                    )}
                    {item.usedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                        {item.usedQuantity} usado
                      </span>
                    )}
                    {item.damagedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60">
                        {item.damagedQuantity} dañado
                      </span>
                    )}
                    {item.pendingQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                        {item.pendingQuantity} pendiente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Incidencias ── */}
          <div className="px-4 py-4 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Incidencias {hasIncidents ? `(${event.incidents.length})` : ''}
            </p>
            {hasIncidents ? (
              event.incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">
                      {inc.name}
                    </span>
                    {inc.time && (
                      <span className="text-muted-foreground ml-1.5">
                        · {inc.time}
                      </span>
                    )}
                    {inc.note && (
                      <p className="text-muted-foreground mt-0.5">{inc.note}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin incidencias registradas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
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
  const dateStatus = getEventDateStatus(currentEvent);
  const canEnter = dateStatus === 'active' || dateStatus === 'unknown';

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

        <div className="flex flex-col items-end gap-2 sm:pl-[4.5rem] md:pl-0">
          <div className="flex items-center gap-3">
            <RoleBadge role={currentEvent.role} />
            <Button
              className="group/button ml-auto min-w-36 gap-2 bg-brand text-brand-foreground shadow-[0_8px_20px_rgba(221,116,25,0.22)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_12px_24px_rgba(221,116,25,0.3)] sm:ml-0"
              disabled={!canEnter}
              onClick={() =>
                canEnter && navigate(`/eventos/${currentEvent.eventId}/worker`)
              }
            >
              {dateStatus === 'upcoming'
                ? 'Aún no comienza'
                : dateStatus === 'ended'
                  ? 'Evento finalizado'
                  : 'Entrar al evento'}
              <ChevronRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
            </Button>
          </div>
          {!canEnter && (
            <p className="max-w-52 text-right text-[11px] leading-4 text-muted-foreground">
              {dateStatus === 'upcoming'
                ? 'Podrás ingresar el día del evento.'
                : 'Este evento ya finalizó.'}
            </p>
          )}
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
          <CardContent className="p-4 sm:p-5">
            {!loadingHistory && history.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {loadingHistory
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <HistoryCardSkeleton key={i} />
                    ))
                  : history.map((ev) => (
                      <WorkerEventHistoryCard key={ev.eventId} event={ev} />
                    ))}
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
    </div>
  );
}

export default WorkerEventosPage;
