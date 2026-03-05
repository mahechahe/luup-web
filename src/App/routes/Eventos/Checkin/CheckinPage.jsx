import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  Lock,
  ClipboardCheck,
  Package,
  Boxes,
  User,
  IdCard,
} from 'lucide-react';
import {
  getEventoDetailService,
  getEventAttendanceService,
} from '../services/eventServices';
import { useUserStore } from '@/App/context/userStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AttendanceEditModal from './AttendanceEditModal';
import { Station1Tab } from '@/App/routes/Eventos/Checkin/components/Station1Tab';
import { Station2Tab } from '@/App/routes/Eventos/Checkin/components/Station2Tab';
import { Station3Tab } from '@/App/routes/Eventos/Checkin/components/Station3Tab';

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

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATIONS = [
  {
    id: 1,
    label: 'Estación 1',
    sublabel: 'Check-in · Uniforme',
    Icon: ClipboardCheck,
    activeClass: 'bg-emerald-100 text-emerald-800 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 2,
    label: 'Estación 2',
    sublabel: 'Maleta · Almuerzo · Refrigerio',
    Icon: Package,
    activeClass: 'bg-indigo-100 text-indigo-800 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 3,
    label: 'Estación 3',
    sublabel: 'Dotación · Insumos',
    Icon: Boxes,
    activeClass: 'bg-violet-100 text-violet-800 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
];

export default function CheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const userStationId = user?.stationId ?? null;
  const canAccess = (id) => userStationId === null || userStationId === id;
  const defaultTab = userStationId ?? 1;

  const [activeStation, setActiveStation] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (!res.status) {
        setError(res.errors ?? 'Evento no encontrado');
        setLoading(false);
        return;
      }
      setEvent(res.event);
    });
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    getEventAttendanceService(eventId, filters).then((res) => {
      if (res.status && res.data)
        setCollaborators(res.data?.data?.collaborators ?? []);
      setLoading(false);
      setRefreshing(false);
    });
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

  const handleStationChange = (id) => {
    setActiveStation(id);
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const totalItems = collaborators.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  const handleAttendanceUpdated = (userId, attendance) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, attendance } : c))
    );
  };

  const handleUniformSaved = (userId, size) => {
    setCollaborators((prev) =>
      prev.map((c) =>
        c.userId === userId
          ? { ...c, uniform: !!size, uniformSize: size || null }
          : c
      )
    );
  };

  const handleStation2ActionSaved = (userId, station2) => {
    setCollaborators((prev) =>
      prev.map((c) =>
        c.userId === userId
          ? {
              ...c,
              attendance: {
                ...c.attendance,
                receivedSuitcase: station2.suitcase,
                receivedLunch: station2.lunch,
                receivedSnack: station2.snack,
                snackDetail: station2.snackDetail ?? c.attendance?.snackDetail ?? null,
              },
            }
          : c
      )
    );
  };

  // Actualiza dotación localmente tras confirmar en estación 3
  const handleDotacionSaved = (userId, cart) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.userId !== userId) return c;
        const existing = c.dotacion ?? [];
        const merged = [...existing];
        cart.forEach(({ item, cantidad }) => {
          const idx = merged.findIndex((d) => d.itemId === item.id);
          if (idx >= 0) merged[idx] = { ...merged[idx], cantidad: merged[idx].cantidad + cantidad };
          else merged.push({ itemId: item.id, itemNombre: item.nombre, cantidad });
        });
        return { ...c, dotacion: merged };
      })
    );
  };

  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">El evento no existe</h2>
          <Button onClick={() => navigate('/eventos/listado')} className="bg-[#234465] hover:bg-[#234465]/90">
            Ir al listado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/eventos/${eventId}`)}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">
              Check-in / Check-out
            </h1>
            {!loading && event && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{event.name}</p>
                <Badge
                  className={`text-[10px] border-0 shrink-0 ${
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
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="shrink-0 h-8 w-8 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* ── Tabs de estaciones ── */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-border px-4">
        <div className="flex gap-1 py-2">
          {STATIONS.map(({ id, label, sublabel, Icon, activeClass, inactiveClass, lockedClass }) => {
            const accessible = canAccess(id);
            const isActive = activeStation === id;
            return (
              <button
                key={id}
                onClick={() => accessible && handleStationChange(id)}
                disabled={!accessible}
                className={`relative flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  !accessible ? lockedClass : isActive ? activeClass : inactiveClass
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[13px]">{label}</span>
                  {!accessible && <Lock className="w-3 h-3" />}
                </div>
                <span className={`text-[12px] font-normal leading-tight text-center ${
                  isActive ? 'text-current opacity-70' : 'text-muted-foreground'
                }`}>
                  {sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">

          {/* Título + fecha */}
          <div>
            {loading ? (
              <>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-4 w-52" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[#234465]">
                  {STATIONS.find((s) => s.id === activeStation)?.label}
                </h2>
                {event && formatEventDate(event.date) && (
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {formatEventDate(event.date)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Controles centralizados (estaciones 1 y 2) ── */}
          {activeStation <= 2 && (
            <div className="bg-white rounded-xl border border-border p-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre…"
                    value={filterInput.name}
                    onChange={(e) => setFilterInput((f) => ({ ...f, name: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-full"
                  />
                </div>

                <div className="relative w-40 shrink-0">
                  <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cédula…"
                    value={filterInput.cedula}
                    onChange={(e) => setFilterInput((f) => ({ ...f, cedula: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 w-full"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  className="h-9 bg-[#234465] hover:bg-[#234465]/90 text-white gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="h-9 gap-1.5 text-muted-foreground shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="text-xs">Limpiar</span>
                  </Button>
                )}
              </div>

              <div className="border-t border-border" />

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground shrink-0">Estado:</span>
                <div className="flex gap-1.5">
                  {[['all', 'Todos'], ['pending', 'Pendientes'], ['done', 'Listos']].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => { setStatusFilter(val); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        statusFilter === val
                          ? 'bg-[#234465] text-white shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Station 1 ── */}
          {activeStation === 1 && (
            <Station1Tab
              collaborators={collaborators}
              loading={loading}
              eventId={eventId}
              pageSize={pageSize}
              currentPage={safePage}
              filter={statusFilter}
              onAttendanceUpdated={handleAttendanceUpdated}
              onUniformSaved={handleUniformSaved}
              onEdit={setEditTarget}
            />
          )}

          {/* Paginación — solo estación 1 */}
          {activeStation === 1 && !loading && totalItems > 0 && (
            <div className="bg-white rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium shrink-0">Filas:</span>
                  <div className="flex border border-border rounded-md overflow-hidden">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setPageSize(size); setCurrentPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold transition ${
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
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-foreground">{totalItems}</span>
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition ${
                          safePage === item
                            ? 'bg-[#234465] text-white'
                            : 'border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Station 2 ── */}
          {activeStation === 2 && (
            <Station2Tab
              collaborators={collaborators}
              loading={loading}
              filter={statusFilter}
              onActionSaved={handleStation2ActionSaved}
            />
          )}

          {/* ── Station 3 ── */}
          {activeStation === 3 && (
            <Station3Tab
              collaborators={collaborators}
              loading={loading}
              filter={statusFilter}
              onDotacionSaved={handleDotacionSaved}
            />
          )}
        </div>
      </div>

      <AttendanceEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        collaborator={editTarget}
        eventId={eventId}
        onUpdated={handleAttendanceUpdated}
        onUniformSaved={handleUniformSaved}
      />
    </div>
  );
}