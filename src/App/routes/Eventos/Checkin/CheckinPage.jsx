import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserCheck, ChevronLeft, ChevronRight, Pencil, Check, Loader2, Search, X, RefreshCw } from 'lucide-react';
import {
  getEventoDetailService,
  getEventAttendanceService,
  upsertAttendanceService,
} from '../services/eventServices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AttendanceEditModal from './AttendanceEditModal';

/* ── Helpers ─────────────────────────────────────────────── */
function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatEventDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.toString().replace(' ', 'T'));
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function roleLabel(role) {
  const map = {
    supervisor: 'Supervisor',
    coordinador: 'Coordinador',
    colaborador: 'Colaborador',
  };
  return map[role] ?? role;
}

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}

/* ── Skeleton ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-muted rounded-full w-24" />
        </td>
      ))}
    </tr>
  );
}

const COLUMNS = [
  'Nombre',
  'Rol',
  'Zonas',
  'Asistió',
  'Horario',
  '',
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/* ── Componente ──────────────────────────────────────────── */
export default function CheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [savingIds, setSavingIds] = useState(new Set());
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Carga inicial del evento (solo una vez)
  useEffect(() => {
    const loadEvent = async () => {
      const eventRes = await getEventoDetailService(eventId);
      if (!eventRes.status) {
        setError(eventRes.errors ?? 'Evento no encontrado');
        setLoading(false);
        return;
      }
      setEvent(eventRes.event);
    };
    loadEvent();
  }, [eventId]);

  // Refetch de colaboradores cuando cambian los filtros o se refresca
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      const attendanceRes = await getEventAttendanceService(eventId, filters);
      if (attendanceRes.status && attendanceRes.data) {
        setCollaborators(attendanceRes.data?.data?.collaborators ?? []);
      }
      setLoading(false);
      setRefreshing(false);
    };
    fetchAttendance();
  }, [eventId, filters, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const handleSearch = () => {
    setFilters(filterInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterInput({ name: '', cedula: '' });
    setFilters({ name: '', cedula: '' });
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';

  /* ── Paginación ────────────────────────────────────────── */
  const totalItems = collaborators.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginated = collaborators.slice(startIdx, startIdx + pageSize);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  /* ── Actualizar asistencia en local ───────────────────── */
  const handleAttendanceUpdated = (userId, attendance) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, attendance } : c))
    );
  };

  /* ── Check rápido de asistencia ────────────────────────── */
  const handleQuickAttendance = async (collab, attended) => {
    setSavingIds((prev) => new Set(prev).add(collab.userId));

    const body = {
      eventId: Number(eventId),
      userId: collab.userId,
      attended,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: collab.attendance?.notes ?? null,
    };

    const res = await upsertAttendanceService(body);
    if (res.status) {
      handleAttendanceUpdated(collab.userId, {
        attended,
        entryTime: body.entryTime,
        exitTime: body.exitTime,
        notes: body.notes,
      });
    }

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(collab.userId);
      return next;
    });
  };

  /* ── Error: Evento no existe ───────────────────────────── */
  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              El evento relacionado no existe
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          </div>
          <Button
            onClick={() => navigate('/eventos/listado')}
            className="bg-[#234465] hover:bg-[#234465]/90"
          >
            Ir al listado de eventos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-white px-5 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/eventos/${eventId}`)}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">
              Check-in / Check-out
            </h1>
            {!loading && event && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{event.name}</p>
                <Badge
                  className={`text-xs border-0 ${
                    event.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {event.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Título de sección */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-36 mb-1.5" />
                  <Skeleton className="h-4 w-60" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[#234465]">Asistencia</h2>
                  {event && formatEventDate(event.date) && (
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {formatEventDate(event.date)}
                    </p>
                  )}
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="shrink-0 gap-2 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Nombre */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre…"
                value={filterInput.name}
                onChange={(e) =>
                  setFilterInput((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-52"
              />
            </div>

            {/* Cédula */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cédula…"
                value={filterInput.cedula}
                onChange={(e) =>
                  setFilterInput((f) => ({ ...f, cedula: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-48"
              />
            </div>

            {/* Botón Buscar */}
            <Button
              onClick={handleSearch}
              className="h-9 bg-[#234465] hover:bg-[#234465]/90 text-white gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar
            </Button>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-9 gap-1.5 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Barra de controles */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="inline-block h-4 w-32 bg-muted rounded-full animate-pulse" />
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {totalItems}
                  </span>{' '}
                  colaborador{totalItems !== 1 ? 'es' : ''}
                </>
              )}
            </p>

            {/* Selector de filas por página */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Filas por página:
              </span>
              <div className="flex border border-border rounded-md overflow-hidden">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      pageSize === size
                        ? 'bg-[#234465] text-white'
                        : 'bg-white text-foreground hover:bg-muted'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : collaborators.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-12">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <UserCheck className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            No hay colaboradores asignados
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Asigna colaboradores a las zonas del evento para
                            poder registrar su asistencia.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((collab) => (
                    <tr
                      key={collab.userId}
                      className="hover:bg-muted/20 transition"
                    >
                      {/* Nombre + Documento */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-foreground block leading-snug">
                          {collab.firstName} {collab.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {collab.cedula}
                        </span>
                      </td>

                      {/* Rol + Celular */}
                      <td className="px-4 py-3.5">
                        <Badge
                          className={`text-xs border-0 ${roleBadgeClass(collab.role)} mb-1`}
                        >
                          {roleLabel(collab.role)}
                        </Badge>
                        <span className="text-xs text-muted-foreground block">
                          {collab.phone ?? '—'}
                        </span>
                      </td>

                      {/* Zonas */}
                      <td className="px-4 py-3.5">
                        {collab.zones && collab.zones.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {collab.zones.map((zone, idx) => (
                              <Badge
                                key={idx}
                                className="text-xs border-0 bg-muted text-foreground"
                              >
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* Asistió */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {savingIds.has(collab.userId) ? (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          ) : (
                            <button
                              onClick={() =>
                                handleQuickAttendance(
                                  collab,
                                  !collab.attendance?.attended
                                )
                              }
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                collab.attendance?.attended
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-white border-border hover:border-[#234465]'
                              }`}
                            >
                              {collab.attendance?.attended && (
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                              )}
                            </button>
                          )}
                          {collab.attendance?.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7493B2]/20 text-[#234465] text-[10px] font-bold cursor-default select-none">
                                  N
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                {collab.attendance.notes}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      {/* Horario (Entrada + Salida) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-foreground">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">E</span>
                            {collab.attendance?.entryTime
                              ? formatTime(collab.attendance.entryTime)
                              : '—'}
                          </span>
                          <span className="text-sm text-foreground">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">S</span>
                            {collab.attendance?.exitTime
                              ? formatTime(collab.attendance.exitTime)
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Editar */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setEditTarget(collab)}
                          className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          title="Editar asistencia"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && totalItems > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium text-foreground">
                  {startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">{totalItems}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  disabled={safePage === 1}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      if (Math.abs(p - safePage) <= 1) return true;
                      return false;
                    })
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-xs text-muted-foreground"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`h-8 min-w-8 px-2 rounded-md text-xs font-medium transition ${
                            safePage === item
                              ? 'bg-[#234465] text-white'
                              : 'border border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={safePage === totalPages}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AttendanceEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        collaborator={editTarget}
        eventId={eventId}
        onUpdated={handleAttendanceUpdated}
      />
    </div>
  );
}
