import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, UserCheck, ChevronLeft, ChevronRight,
  RefreshCw, Search, X, Lock, ClipboardCheck,
  Package, Boxes,
} from 'lucide-react';
import {
  getEventoDetailService,
  getEventAttendanceService,
  upsertAttendanceService,
} from '../services/eventServices';
import { useUserStore } from '@/App/context/userStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AttendanceEditModal from './AttendanceEditModal';
import { Station1Tab } from '@/App/routes/Eventos/Checkin/components/Station1Tab';
import { Station2Tab } from '@/App/routes/Eventos/Checkin/components/Station2Tab';

/* ── Helpers ── */
function formatEventDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.toString().replace(' ', 'T'));
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/* ── Configuración de estaciones ── */
const STATIONS = [
  {
    id: 1,
    label: 'Estación 1',
    sublabel: 'Check-in · Uniforme',
    Icon: ClipboardCheck,
    color: 'emerald',
    activeClass: 'bg-emerald-600 text-white shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 2,
    label: 'Estación 2',
    sublabel: 'Maleta · Almuerzo · Refrigerio',
    Icon: Package,
    color: 'indigo',
    activeClass: 'bg-indigo-600 text-white shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 3,
    label: 'Estación 3',
    sublabel: 'Insumos',
    Icon: Boxes,
    color: 'orange',
    activeClass: 'bg-[#DD7419] text-white shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
];

/* ── Componente principal ── */
export default function CheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  // stationId del usuario: null = superadmin (ve todo), 1|2|3 = solo esa estación
  // TODO: obtener del backend — user.stationAssignment para este evento
  const userStationId = user?.stationId ?? null; // null = ve todo

  const canAccess = (stationId) =>
    userStationId === null || userStationId === stationId;

  // Tab activo: arranca en la estación que le corresponde al usuario
  const defaultTab = userStationId ?? 1;
  const [activeStation, setActiveStation] = useState(defaultTab);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
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

  const handleAttendanceUpdated = (userId, attendance) => {
    setCollaborators((prev) => prev.map((c) => c.userId === userId ? { ...c, attendance } : c));
  };

  const handleUniformSaved = (userId, size) => {
    setCollaborators((prev) => prev.map((c) => c.userId === userId ? { ...c, uniformSize: size } : c));
  };

  const handleStation2ActionSaved = (userId, station2) => {
    setCollaborators((prev) => prev.map((c) => c.userId === userId ? { ...c, station2 } : c));
  };

  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">El evento no existe</h2>
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

      {/* ── Tabs de estaciones ── */}
      <div className="shrink-0 bg-white border-b border-border px-4">
        <div className="flex gap-1 py-2">
          {STATIONS.map(({ id, label, sublabel, Icon, activeClass, inactiveClass, lockedClass }) => {
            const accessible = canAccess(id);
            const isActive = activeStation === id;
            const isComingSoon = id === 3; // Estación 3 aún no implementada

            return (
              <button
                key={id}
                onClick={() => accessible && !isComingSoon && setActiveStation(id)}
                disabled={!accessible || isComingSoon}
                className={`relative flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  !accessible || isComingSoon
                    ? lockedClass
                    : isActive
                    ? activeClass
                    : inactiveClass
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                  {(!accessible || isComingSoon) && <Lock className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] font-normal leading-tight text-center ${
                  isActive ? 'text-white/80' : 'text-muted-foreground'
                }`}>
                  {isComingSoon ? 'Próximamente' : sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">

          {/* Título + fecha */}
          <div>
            {loading ? (<><Skeleton className="h-7 w-32 mb-1" /><Skeleton className="h-4 w-52" /></>) : (
              <>
                <h2 className="text-xl font-bold text-[#234465]">
                  {STATIONS.find((s) => s.id === activeStation)?.label}
                </h2>
                {event && formatEventDate(event.date) && (
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{formatEventDate(event.date)}</p>
                )}
              </>
            )}
          </div>

          {/* Filtros globales + page size (solo estación 1 y 2 los usan) */}
          {activeStation <= 2 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
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

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">Filas:</span>
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
          )}

          {/* ── Contenido por estación ── */}
          {activeStation === 1 && (
            <Station1Tab
              collaborators={collaborators}
              loading={loading}
              eventId={eventId}
              pageSize={pageSize}
              currentPage={safePage}
              onAttendanceUpdated={handleAttendanceUpdated}
              onUniformSaved={handleUniformSaved}
            />
          )}

          {activeStation === 2 && (
            <Station2Tab
              collaborators={collaborators}
              loading={loading}
              onActionSaved={handleStation2ActionSaved}
            />
          )}

          {activeStation === 3 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#DD7419]/10 flex items-center justify-center mx-auto mb-4">
                <Boxes className="w-7 h-7 text-[#DD7419]" />
              </div>
              <h3 className="text-base font-bold text-foreground">Módulo de Insumos</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                Este módulo está en construcción. Pronto podrás gestionar el inventario de insumos por evento.
              </p>
            </div>
          )}

          {/* Paginación */}
          {activeStation === 1 && !loading && totalItems > 0 && (
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