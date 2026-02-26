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
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function roleLabel(role) {
  const map = { supervisor: 'Supervisor', coordinador: 'Coordinador', colaborador: 'Colaborador' };
  return map[role] ?? role;
}

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}

/* Avatar con color por inicial */
const AVATAR_COLORS = [
  'from-[#234465] to-[#3a6b9f]',
  'from-[#DD7419] to-[#f59e0b]',
  'from-[#059669] to-[#34d399]',
  'from-[#7c3aed] to-[#a78bfa]',
  'from-[#dc2626] to-[#f87171]',
  'from-[#0891b2] to-[#67e8f9]',
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function Avatar({ firstName }) {
  const initial = (firstName?.[0] ?? '?').toUpperCase();
  const color = getAvatarColor(firstName);
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold text-sm">{initial}</span>
    </div>
  );
}

/* ── Skeletons ───────────────────────────────────────────── */
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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-muted rounded-full w-36" />
        <div className="h-3 bg-muted rounded-full w-24" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-muted rounded-md w-20" />
          <div className="h-5 bg-muted rounded-md w-14" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="h-3 bg-muted rounded-full w-16" />
      </div>
    </div>
  );
}

const COLUMNS = ['Nombre', 'Rol', 'Zonas', 'Asistió', 'Horario', ''];
const PAGE_SIZE_OPTIONS = [25, 50, 100];

/* ── Componente principal ────────────────────────────────── */
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

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (!res.status) { setError(res.errors ?? 'Evento no encontrado'); setLoading(false); return; }
      setEvent(res.event);
    });
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    getEventAttendanceService(eventId, filters).then((res) => {
      if (res.status && res.data) setCollaborators(res.data?.data?.collaborators ?? []);
      setLoading(false);
      setRefreshing(false);
    });
  }, [eventId, filters, refreshKey]);

  const handleRefresh = () => { setRefreshing(true); setRefreshKey((k) => k + 1); };
  const handleSearch = () => { setFilters(filterInput); setCurrentPage(1); };
  const handleClearFilters = () => { setFilterInput({ name: '', cedula: '' }); setFilters({ name: '', cedula: '' }); setCurrentPage(1); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';

  const totalItems = collaborators.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginated = collaborators.slice(startIdx, startIdx + pageSize);

  const handleAttendanceUpdated = (userId, attendance) => {
    setCollaborators((prev) => prev.map((c) => (c.userId === userId ? { ...c, attendance } : c)));
  };

  const handleQuickAttendance = async (collab, attended) => {
    setSavingIds((prev) => new Set(prev).add(collab.userId));
    const body = {
      eventId: Number(eventId), userId: collab.userId, attended,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: collab.attendance?.notes ?? null,
    };
    const res = await upsertAttendanceService(body);
    if (res.status) handleAttendanceUpdated(collab.userId, { attended, entryTime: body.entryTime, exitTime: body.exitTime, notes: body.notes });
    setSavingIds((prev) => { const next = new Set(prev); next.delete(collab.userId); return next; });
  };

  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">El evento relacionado no existe</h2>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <Button onClick={() => navigate('/eventos/listado')} className="bg-[#234465] hover:bg-[#234465]/90">Ir al listado</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/eventos/${eventId}`)} className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">Check-in / Check-out</h1>
            {!loading && event && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{event.name}</p>
                <Badge className={`text-[10px] border-0 shrink-0 ${event.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                  {event.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing} className="shrink-0 h-8 w-8 p-0">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-3">

          {/* Título */}
          <div>
            {loading ? (<><Skeleton className="h-7 w-32 mb-1" /><Skeleton className="h-4 w-52" /></>) : (
              <>
                <h2 className="text-xl font-bold text-[#234465]">Asistencia</h2>
                {event && formatEventDate(event.date) && (
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{formatEventDate(event.date)}</p>
                )}
              </>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[130px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Buscar nombre…" value={filterInput.name}
                onChange={(e) => setFilterInput((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-full" />
            </div>
            <div className="relative flex-1 min-w-[110px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Cédula…" value={filterInput.cedula}
                onChange={(e) => setFilterInput((f) => ({ ...f, cedula: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-full" />
            </div>
            <Button onClick={handleSearch} className="h-9 bg-[#234465] hover:bg-[#234465]/90 text-white gap-1.5 shrink-0">
              <Search className="w-3.5 h-3.5" /><span className="hidden sm:inline">Buscar</span>
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="h-9 gap-1.5 text-muted-foreground shrink-0">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Stats + page size */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? <span className="inline-block h-4 w-28 bg-muted rounded-full animate-pulse" /> : (
                <><span className="font-medium text-foreground">{totalItems}</span> colaborador{totalItems !== 1 ? 'es' : ''}</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Filas por página:</span>
              <div className="flex border border-border rounded-md overflow-hidden">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button key={size} onClick={() => { setPageSize(size); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-medium transition ${pageSize === size ? 'bg-[#234465] text-white' : 'bg-white text-foreground hover:bg-muted'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── MOBILE: tarjetas ── */}
          <div className="sm:hidden space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : collaborators.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No hay colaboradores asignados</p>
              </div>
            ) : (
              paginated.map((collab) => (
                <div key={collab.userId} className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3">
                  <Avatar firstName={collab.firstName} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{collab.firstName} {collab.lastName}</p>
                    <p className="text-[11px] text-muted-foreground">{collab.cedula} · {collab.phone ?? '—'}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(collab.role)}`}>
                        {roleLabel(collab.role)}
                      </span>
                      {collab.zones?.map((zone, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]">{zone}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {savingIds.has(collab.userId) ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <button
                          onClick={() => handleQuickAttendance(collab, !collab.attendance?.attended)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${collab.attendance?.attended ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-border hover:border-[#234465]'}`}
                        >
                          {collab.attendance?.attended && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </button>
                      )}
                      {collab.attendance?.notes && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7493B2]/20 text-[#234465] text-[10px] font-bold">N</span>
                      )}
                    </div>
                    <div className="text-[11px] text-right leading-relaxed">
                      <span className="text-muted-foreground font-semibold">E </span>
                      <span className="text-foreground font-medium">{collab.attendance?.entryTime ? formatTime(collab.attendance.entryTime) : '—'}</span>
                      <br />
                      <span className="text-muted-foreground font-semibold">S </span>
                      <span className="text-foreground font-medium">{collab.attendance?.exitTime ? formatTime(collab.attendance.exitTime) : '—'}</span>
                    </div>
                    <button onClick={() => setEditTarget(collab)} className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── DESKTOP: tabla ── */}
          <div className="hidden sm:block bg-white rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : collaborators.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-12">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <UserCheck className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No hay colaboradores asignados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((collab) => (
                    <tr key={collab.userId} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={collab.firstName} />
                          <div>
                            <span className="text-sm font-medium text-foreground block leading-snug">{collab.firstName} {collab.lastName}</span>
                            <span className="text-xs text-muted-foreground">{collab.cedula}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={`text-xs border-0 ${roleBadgeClass(collab.role)} mb-1`}>{roleLabel(collab.role)}</Badge>
                        <span className="text-xs text-muted-foreground block">{collab.phone ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {collab.zones?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {collab.zones.map((zone, idx) => (
                              <Badge key={idx} className="text-xs border-0 bg-muted text-foreground">{zone}</Badge>
                            ))}
                          </div>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {savingIds.has(collab.userId) ? (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          ) : (
                            <button
                              onClick={() => handleQuickAttendance(collab, !collab.attendance?.attended)}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${collab.attendance?.attended ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-border hover:border-[#234465]'}`}
                            >
                              {collab.attendance?.attended && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </button>
                          )}
                          {collab.attendance?.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7493B2]/20 text-[#234465] text-[10px] font-bold cursor-default select-none">N</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">{collab.attendance.notes}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-foreground"><span className="text-xs font-semibold text-muted-foreground mr-1">E</span>{collab.attendance?.entryTime ? formatTime(collab.attendance.entryTime) : '—'}</span>
                          <span className="text-sm text-foreground"><span className="text-xs font-semibold text-muted-foreground mr-1">S</span>{collab.attendance?.exitTime ? formatTime(collab.attendance.exitTime) : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => setEditTarget(collab)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition">
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
            <div className="flex items-center justify-between pt-1 pb-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)}</span> de <span className="font-medium text-foreground">{totalItems}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                  .map((item, idx) => item === '...' ? (
                    <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <button key={item} onClick={() => setCurrentPage(item)} className={`h-8 min-w-8 px-2 rounded-md text-xs font-medium transition ${safePage === item ? 'bg-[#234465] text-white' : 'border border-border text-foreground hover:bg-muted'}`}>{item}</button>
                  ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition">
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
