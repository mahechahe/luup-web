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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const DATE_TYPE_LABEL = { single_date: 'Fecha única', stages: 'Etapas' };

const ROLE_CONFIG = {
  coordinator: { label: 'Coordinador', icon: ShieldCheck, className: 'bg-purple-50 text-purple-600 border-purple-200' },
  supervisor:  { label: 'Supervisor',  icon: UserCheck,   className: 'bg-blue-50 text-blue-600 border-blue-200' },
  worker:      { label: 'Colaborador', icon: HardHat,     className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.worker;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function EventDateDisplay({ event }) {
  if (event.dateType === 'stages') return <span>{formatDate(event.startDate)} — {formatDate(event.endDate)}</span>;
  return <span>{formatDate(event.date)}</span>;
}

/* ── Skeletons ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {['w-40', 'w-24', 'w-32', 'w-20', 'w-24', 'w-24'].map((w, i) => (
        <td key={i} className="px-4 py-3.5"><div className={`h-3.5 bg-muted rounded-full ${w}`} /></td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Calendar className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Sin historial</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Aún no tienes eventos registrados en tu historial.</p>
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
        Mostrando <span className="font-semibold text-foreground">{from}–{to}</span> de{' '}
        <span className="font-semibold text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          return (
            <span key={p} className="flex items-center gap-1">
              {prev && p - prev > 1 && <span className="text-muted-foreground text-xs px-1">…</span>}
              <Button
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className={`h-8 w-8 text-xs ${p === page ? 'bg-brand text-brand-foreground hover:bg-brand/90 border-brand' : ''}`}
                onClick={() => onPageChange(p)}
              >{p}</Button>
            </span>
          );
        })}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
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

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-0.5">Detalle del evento</p>
            <h3 className="text-lg font-bold text-foreground leading-tight">{event.name}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{event.location ?? '—'}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /><EventDateDisplay event={event} />
              </span>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-muted rounded-full w-28" />
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-24 mt-2" />
              <div className="h-16 bg-muted rounded-xl" />
            </div>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground text-center py-8">No se encontró información de asistencia.</p>
          ) : (
            <>
              <RoleBadge role={event.role} />

              {/* Bloque asistencia */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asistencia</p>

                {detail.attended === true ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Asistió
                  </span>
                ) : detail.attended === false ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                    <X className="w-3.5 h-3.5" /> No asistió
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-xs font-semibold">
                    Sin registro
                  </span>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <LogIn className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Entrada</p>
                      <p className="text-sm font-bold text-foreground">{formatTime(detail.entryTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Salida</p>
                      <p className="text-sm font-bold text-foreground">{formatTime(detail.exitTime)}</p>
                    </div>
                  </div>
                </div>

                {detail.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{detail.notes}</p>
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
                    <p className="text-sm text-muted-foreground">Sin incidencias registradas.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.incidents.map((inc) => (
                      <div key={inc.id} className="rounded-xl border border-border bg-white p-3 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{inc.name}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{formatTime(inc.time)}</span>
                          </div>
                          {inc.note && <p className="text-xs text-muted-foreground mt-0.5">{inc.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
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
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin evento asignado</p>
            <p className="text-sm text-muted-foreground mt-0.5">Actualmente no estás asignado a ningún evento activo.</p>
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
              <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">Evento actual asignado</p>
              <p className="text-xl font-bold text-foreground">{currentEvent.name}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />{currentEvent.location}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" /><EventDateDisplay event={currentEvent} />
                </span>
              </div>
            </div>
          </div>
          <RoleBadge role={currentEvent.role} />
        </div>
        <Button className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => navigate(`/eventos/${currentEvent.eventId}/worker`)}>
          Entrar al evento
        </Button>
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
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
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
    if (res.status) { setHistory(res.history); setPagination(res.pagination); }
    else toast.error(res.errors ?? 'Error al cargar el historial.');
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const HISTORY_COLUMNS = ['Nombre', 'Fecha', 'Ubicación', 'Asistencia', 'Horario', 'Rol'];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <Button variant="ghost" size="sm" className="group gap-2 text-muted-foreground hover:text-brand -ml-2" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver a selección
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Mis Eventos</h2>
          </div>
          <p className="text-sm text-muted-foreground">Tu evento actual asignado e historial de participación.</p>
        </div>

        <CurrentEventCard currentEvent={currentEvent} loading={loadingCurrent} navigate={navigate} />

        {/* Historial */}
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              {loadingHistory ? (
                <span className="text-muted-foreground animate-pulse">Cargando historial...</span>
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
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, i) => <SkeletonRow key={i} />)
                  ) : history.length === 0 ? (
                    <EmptyState />
                  ) : (
                    history.map((ev) => (
                      <tr
                        key={ev.eventId}
                        onClick={() => setSelectedEvent(ev)}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-foreground">{ev.name}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          <EventDateDisplay event={ev} />
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{ev.location ?? '—'}</td>

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
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Horario */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-muted-foreground">
                              <span className="font-semibold mr-1">E</span>
                              <span className={ev.entryTime ? 'text-foreground font-medium' : ''}>{formatTime(ev.entryTime)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-semibold mr-1">S</span>
                              <span className={ev.exitTime ? 'text-foreground font-medium' : ''}>{formatTime(ev.exitTime)}</span>
                            </span>
                          </div>
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
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={fetchHistory} />
            )}
          </CardContent>
        </Card>
      </div>

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

export default WorkerEventosPage;