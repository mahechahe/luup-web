import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateEventDrawer } from './components/CreateEventDrawer';
import { EditEventDrawer } from './components/EditEventDrawer';
import { FilterEventDrawer } from './components/FilterEventDrawer';
import { getEventosService } from './services/eventServices';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';

const PAGE_LIMIT = 10;
const EMPTY_FILTERS = { name: '', location: '', dateFrom: '', dateTo: '' };

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  // PostgreSQL puede devolver "YYYY-MM-DD HH:mm:ss+TZ" — normalizar a ISO
  const normalized = iso.toString().replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ── Skeleton row ─────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-muted rounded-full w-40 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-28" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-20" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-32" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-44" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-20" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded-md" />
          <div className="h-8 w-8 bg-muted rounded-md md:w-24" />
        </div>
      </td>
    </tr>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ hasFilter }) {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Calendar className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {hasFilter ? 'Sin resultados' : 'Sin eventos registrados'}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {hasFilter
                ? 'No hay eventos que coincidan con los filtros aplicados.'
                : 'Aún no hay eventos en el sistema.'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

const DATE_TYPE_LABEL = {
  single_date: 'Fecha única',
  stages: 'Etapas',
};

function EventDateCell({ ev }) {
  if (ev.dateType === 'stages') {
    return (
      <span>
        {formatDate(ev.startDate)}
        {' — '}
        {formatDate(ev.endDate)}
      </span>
    );
  }
  return <span>{formatDate(ev.date)}</span>;
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

/* ── Vista principal ─────────────────────────────────────── */
function EventosPage() {
  const navigate = useNavigate();

  // --- CAMBIO: El usuario se obtiene DENTRO del componente ---
  const user = useUserStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const hasActiveFilter = Object.values(activeFilters).some((v) => v !== '');

  const fetchData = useCallback(async (page, filters) => {
    setLoading(true);
    const body = {
      page,
      limit: PAGE_LIMIT,
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      ),
    };
    const res = await getEventosService(body);

    if (res.status) {
      setEvents(res.events);
      setPagination(res.pagination);
    } else {
      toast.error(res.errors ?? 'Error al cargar los eventos.');
    }
    setLoading(false);
  }, []);

  // --- CAMBIO: El useEffect ahora está DENTRO del componente y valida el rol ---
  useEffect(() => {
    // VALIDACIÓN ANTES DE LA PETICIÓN
    if (user) {
      if (hasAdminAccess(user.roleId)) {
        fetchData(1, EMPTY_FILTERS); // Si es Admin o SuperAdmin, carga normal
      } else {
        navigate('/eventos/mis-eventos'); // Si es trabajador, lo mandamos a su página
      }
    }
  }, [user, navigate, fetchData]);

  function handlePageChange(newPage) {
    fetchData(newPage, activeFilters);
  }

  function handleApplyFilters(filters) {
    const merged = { ...EMPTY_FILTERS, ...filters };
    setActiveFilters(merged);
    fetchData(1, merged);
  }

  function handleClearFilters() {
    setActiveFilters(EMPTY_FILTERS);
    fetchData(1, EMPTY_FILTERS);
  }

  // Bloqueo de renderizado para no admin (mientras redirige)
  if (user && !hasAdminAccess(user.roleId)) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#234465] px-6 py-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Gestión de eventos
              </p>
              <h2 className="text-2xl font-extrabold text-white leading-tight">Eventos</h2>
              <p className="text-sm text-white/60 mt-0.5">Gestiona los eventos de LUUP.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 h-9 font-semibold shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" /> Crear evento
            </Button>
            <Button
              variant="outline"
              className={`gap-1.5 h-9 border-white/20 text-white hover:bg-white/20 hover:text-white ${
                hasActiveFilter ? 'bg-[#DD7419]/30 border-[#DD7419]/60' : 'bg-white/10'
              }`}
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="w-4 h-4" /> Filtrar
            </Button>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                className="gap-1.5 h-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleClearFilters}
              >
                <X className="w-4 h-4" /> Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => fetchData(pagination.page, activeFilters)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </Button>
          </div>
        </div>

        {/* ── Tabla ───────────────────────────────────────── */}
        <Card className="gap-0 overflow-hidden border-border p-0 shadow-sm">
          <div className="flex items-center justify-between px-5 h-12 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#234465]/10 dark:bg-white/10 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-[#234465] dark:text-white" />
              </div>
              {loading ? (
                <div className="h-4 w-36 bg-muted rounded-full animate-pulse" />
              ) : (
                <span className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">{pagination.total}</span>{' '}
                  evento{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {hasActiveFilter && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                Filtros activos
              </span>
            )}
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border hidden md:table-cell">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border hidden md:table-cell">
                      Fechas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border hidden md:table-cell">
                      Ubicación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border hidden md:table-cell">
                      Creado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : events.length === 0 ? (
                    <EmptyState hasFilter={hasActiveFilter} />
                  ) : (
                    events.map((ev) => (
                      <tr
                        key={ev.eventId}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* Nombre — siempre visible; en móvil muestra fecha y ubicación como subtexto */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">
                            {ev.name}
                          </span>
                          <span className="text-xs text-muted-foreground md:hidden block mt-0.5">
                            <EventDateCell ev={ev} />
                            {ev.location && <> · {ev.location}</>}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
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
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground hidden md:table-cell">
                          <EventDateCell ev={ev} />
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                          {ev.location ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground hidden md:table-cell">
                          {formatDate(ev.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-xs border-brand/40 text-brand hover:bg-brand/10 hover:border-brand"
                              onClick={() => {
                                setSelectedEvent(ev);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Editar
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-xs border-sky-300 text-sky-600 hover:bg-sky-50 hover:border-sky-500"
                              onClick={() => navigate(`/eventos/${ev.eventId}`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Ver detalle
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <FilterEventDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        activeFilters={activeFilters}
      />

      <CreateEventDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchData(1, activeFilters)}
      />

      <EditEventDrawer
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedEvent(null);
        }}
        onSuccess={() => fetchData(pagination.page, activeFilters)}
        event={selectedEvent}
      />
    </div>
  );
}

export default EventosPage;
