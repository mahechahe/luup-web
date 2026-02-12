import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateEventDrawer } from './components/CreateEventDrawer';
import { EditEventDrawer } from './components/EditEventDrawer';
import { FilterEventDrawer } from './components/FilterEventDrawer';
import { getEventosService } from './services/eventServices';

const PAGE_LIMIT = 10;
const EMPTY_FILTERS = { name: '', location: '', dateFrom: '', dateTo: '' };

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ── Skeleton row ─────────────────────────────────────────── */
function SkeletonRow() {
  const widths = ['w-40', 'w-24', 'w-44', 'w-20'];
  return (
    <tr className="border-b border-border animate-pulse">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-muted rounded-full ${w}`} />
        </td>
      ))}
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
        </div>
      </td>
    </tr>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ hasFilter }) {
  return (
    <tr>
      <td colSpan={5}>
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

const COLUMNS = ['Nombre', 'Fecha', 'Ubicación', 'Creado', 'Acciones'];

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
        <span className="font-semibold text-foreground">{from}–{to}</span>{' '}
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
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
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

  useEffect(() => {
    fetchData(1, EMPTY_FILTERS);
  }, [fetchData]);

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

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Eventos
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Gestiona los eventos de LUUP.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 h-9"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Crear evento
            </Button>

            <Button
              variant="outline"
              className={`gap-1.5 h-9 ${
                filterOpen || hasActiveFilter
                  ? 'border-brand text-brand bg-brand/5'
                  : ''
              }`}
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="w-4 h-4" />
              Filtrar
              {hasActiveFilter && (
                <span className="ml-1 w-2 h-2 rounded-full bg-brand" />
              )}
            </Button>

            <Button
              variant="ghost"
              className="gap-1.5 h-9 text-muted-foreground"
              disabled={!hasActiveFilter}
              onClick={handleClearFilters}
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        {!loading && (
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="secondary"
              className="gap-1.5 px-3 py-1 text-xs font-medium"
            >
              <Calendar className="w-3.5 h-3.5" />
              {pagination.total} total
            </Badge>
            {hasActiveFilter && (
              <Badge className="gap-1.5 px-3 py-1 text-xs font-medium bg-brand/10 text-brand hover:bg-brand/10 border-0">
                Filtros activos
              </Badge>
            )}
          </div>
        )}

        {/* ── Tabla ───────────────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              {loading ? (
                <span className="text-muted-foreground animate-pulse">
                  Cargando eventos...
                </span>
              ) : hasActiveFilter ? (
                <>
                  <span className="text-muted-foreground">Mostrando </span>
                  <span className="text-brand font-bold">{events.length}</span>
                  <span className="text-muted-foreground">
                    {' '}de {pagination.total} eventos
                  </span>
                </>
              ) : (
                `${pagination.total} evento${pagination.total !== 1 ? 's' : ''}`
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    {COLUMNS.map((col) => (
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
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : events.length === 0 ? (
                    <EmptyState hasFilter={hasActiveFilter} />
                  ) : (
                    events.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-foreground">
                            {ev.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          {formatDate(ev.date)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {ev.location ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          {formatDate(ev.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs border-brand/40 text-brand hover:bg-brand/10 hover:border-brand"
                              onClick={() => {
                                setSelectedEvent(ev);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs border-sky-300 text-sky-600 hover:bg-sky-50 hover:border-sky-500"
                              disabled
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver detalle
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
