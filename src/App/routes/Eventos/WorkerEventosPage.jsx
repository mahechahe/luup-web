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
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getWorkerCurrentEventService,
  getWorkerEventHistoryService,
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

const DATE_TYPE_LABEL = {
  single_date: 'Fecha única',
  stages: 'Etapas',
};

const ROLE_CONFIG = {
  coordinator: {
    label: 'Coordinador',
    icon: ShieldCheck,
    className: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  supervisor: {
    label: 'Supervisor',
    icon: UserCheck,
    className: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  worker: {
    label: 'Worker',
    icon: HardHat,
    className: 'bg-slate-50 text-slate-600 border-slate-200',
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
  if (event.dateType === 'stages') {
    return (
      <span>
        {formatDate(event.startDate)} — {formatDate(event.endDate)}
      </span>
    );
  }
  return <span>{formatDate(event.date)}</span>;
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {['w-40', 'w-20', 'w-32', 'w-44', 'w-24'].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-muted rounded-full ${w}`} />
        </td>
      ))}
    </tr>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <tr>
      <td colSpan={5}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Calendar className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin historial</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Aún no tienes eventos registrados en tu historial.
            </p>
          </div>
        </div>
      </td>
    </tr>
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
        <span className="font-semibold text-foreground">{from}–{to}</span> de{' '}
        <span className="font-semibold text-foreground">{total}</span>
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

/* ── Card: Evento actual ─────────────────────────────────── */
function CurrentEventCard({ currentEvent, loading }) {
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
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin evento asignado</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Actualmente no estás asignado a ningún evento activo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30 shadow-sm bg-brand/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">
                Evento actual asignado
              </p>
              <p className="text-xl font-bold text-foreground">
                {currentEvent.name}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentEvent.location}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <EventDateDisplay event={currentEvent} />
                </span>
              </div>
            </div>
          </div>
          <RoleBadge role={currentEvent.role} />
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

  // Cargar evento actual
  useEffect(() => {
    const fetchCurrent = async () => {
      setLoadingCurrent(true);
      const res = await getWorkerCurrentEventService();
      if (res.status) {
        setCurrentEvent(res.currentEvent);
      } else {
        toast.error(res.errors ?? 'Error al cargar el evento actual.');
      }
      setLoadingCurrent(false);
    };
    fetchCurrent();
  }, []);

  // Cargar historial
  const fetchHistory = useCallback(async (page) => {
    setLoadingHistory(true);
    const res = await getWorkerEventHistoryService({ page, limit: PAGE_LIMIT });
    if (res.status) {
      setHistory(res.history);
      setPagination(res.pagination);
    } else {
      toast.error(res.errors ?? 'Error al cargar el historial.');
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const HISTORY_COLUMNS = ['Nombre', 'Tipo', 'Fecha', 'Ubicación', 'Tu rol'];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Volver */}
        <Button
          variant="ghost"
          size="sm"
          className="group gap-2 text-muted-foreground hover:text-brand -ml-2"
          onClick={() => navigate('/eventos')}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver a selección
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Mis Eventos
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu evento actual asignado e historial de participación.
          </p>
        </div>

        {/* Card evento actual */}
        <CurrentEventCard
          currentEvent={currentEvent}
          loading={loadingCurrent}
        />

        {/* Tabla historial */}
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              {loadingHistory ? (
                <span className="text-muted-foreground animate-pulse">
                  Cargando historial...
                </span>
              ) : (
                `${pagination.total} evento${pagination.total !== 1 ? 's' : ''} en tu historial`
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
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
                  {loadingHistory ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : history.length === 0 ? (
                    <EmptyState />
                  ) : (
                    history.map((ev) => (
                      <tr
                        key={ev.eventId}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-foreground">
                            {ev.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`text-xs font-medium ${
                              ev.dateType === 'stages'
                                ? 'bg-brand/10 text-brand border-0'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {DATE_TYPE_LABEL[ev.dateType] ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          <EventDateDisplay event={ev} />
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {ev.location ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <RoleBadge role={ev.role} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
