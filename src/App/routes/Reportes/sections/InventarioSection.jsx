import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Clock,
  FileSpreadsheet,
  Package,
  PackageOpen,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ExcelLoadingModal } from '../components/AttendanceFeedback';
import {
  getInventoryReportSummaryService,
  getInventoryReportCollaboratorsService,
  generateInventoryExcelService,
} from '../services/reportesServices';

const DETAIL_PAGE_LIMIT = 15;
const EMPTY_DETAIL_FILTERS = { nombre: '', itemNombre: '' };
const EMPTY_TOTALS = {
  cantidadCargada: 0,
  asignado: 0,
  disponible: 0,
  devuelto: 0,
  usado: 0,
  danado: 0,
  pendiente: 0,
};

const VIEWS = [
  { value: 'resumen', label: 'Resumen por ítem' },
  { value: 'detalle', label: 'Detalle por colaborador' },
];

const STATUS_OPTIONS = [
  { value: undefined, label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'completo', label: 'Completos' },
];

function StatChip({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl text-center ${
        highlight ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'
      }`}
    >
      <Icon className="w-4 h-4 mb-0.5" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function ItemSummaryCard({ item }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{item.nombre}</p>
        {item.pendiente > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">
            {item.pendiente} pendiente{item.pendiente !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <Badge variant="outline" className="tabular-nums">
          {item.cantidadCargada} cargado{item.cantidadCargada !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          {item.asignado} asignado{item.asignado !== 1 ? 's' : ''}
        </Badge>
        <Badge
          variant="outline"
          className="tabular-nums bg-brand/10 text-brand border-brand/20"
        >
          {item.disponible} disponible{item.disponible !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          {item.devuelto} devuelto{item.devuelto !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          {item.usado} usado{item.usado !== 1 ? 's' : ''}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'tabular-nums',
            item.danado > 0 &&
              'text-red-500 border-red-200 dark:border-red-900/40'
          )}
        >
          {item.danado} dañado{item.danado !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
}

function CollaboratorDetailRow({ row }) {
  const isPending = row.status === 'pendiente';
  const fullName = `${row.firstName} ${row.lastName}`.trim() || 'Sin nombre';

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {fullName}
          </p>
          {row.cedula && (
            <p className="text-xs text-muted-foreground">CC {row.cedula}</p>
          )}
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            isPending
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}
        >
          {isPending ? 'Pendiente' : 'Completo'}
        </span>
      </div>
      <p className="text-base font-semibold text-foreground mt-1.5">
        {row.itemName}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Badge variant="outline" className="tabular-nums">
          {row.quantity} asignado{row.quantity !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          {row.returnedQuantity} devuelto
          {row.returnedQuantity !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          {row.usedQuantity} usado{row.usedQuantity !== 1 ? 's' : ''}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'tabular-nums',
            row.damagedQuantity > 0 &&
              'text-red-500 border-red-200 dark:border-red-900/40'
          )}
        >
          {row.damagedQuantity} dañado{row.damagedQuantity !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
}

export default function InventarioSection({ eventId }) {
  const [view, setView] = useState('resumen');
  const [excelLoading, setExcelLoading] = useState(false);

  const [summaryItems, setSummaryItems] = useState([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summarySearch, setSummarySearch] = useState('');

  const [detailRows, setDetailRows] = useState([]);
  const [detailPagination, setDetailPagination] = useState({
    page: 1,
    limit: DETAIL_PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailFilters, setDetailFilters] = useState(EMPTY_DETAIL_FILTERS);
  const [appliedDetailFilters, setAppliedDetailFilters] =
    useState(EMPTY_DETAIL_FILTERS);
  const [statusFilter, setStatusFilter] = useState(undefined);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    const res = await getInventoryReportSummaryService(eventId);
    if (res.status) {
      setSummaryItems(res.items);
      setTotals(res.totals);
    } else {
      toast.error(res.errors ?? 'Error al cargar el resumen de inventario.');
    }
    setSummaryLoading(false);
  }, [eventId]);

  const fetchDetail = useCallback(
    async (page, filters, status) => {
      setDetailLoading(true);
      const res = await getInventoryReportCollaboratorsService(eventId, {
        page,
        limit: DETAIL_PAGE_LIMIT,
        nombre: filters.nombre || undefined,
        itemNombre: filters.itemNombre || undefined,
        status,
      });
      if (res.status) {
        setDetailRows(res.items);
        setDetailPagination(res.pagination);
      } else {
        toast.error(res.errors ?? 'Error al cargar el detalle de inventario.');
      }
      setDetailLoading(false);
    },
    [eventId]
  );

  useEffect(() => {
    if (!eventId) return;
    fetchSummary();
  }, [eventId, fetchSummary]);

  useEffect(() => {
    if (!eventId) return;
    fetchDetail(1, EMPTY_DETAIL_FILTERS, undefined);
  }, [eventId, fetchDetail]);

  const handleRefresh = () => {
    fetchSummary();
    fetchDetail(detailPagination.page, appliedDetailFilters, statusFilter);
  };

  const handleApplyDetailFilters = () => {
    setAppliedDetailFilters(detailFilters);
    fetchDetail(1, detailFilters, statusFilter);
  };

  const handleClearDetailFilters = () => {
    setDetailFilters(EMPTY_DETAIL_FILTERS);
    setAppliedDetailFilters(EMPTY_DETAIL_FILTERS);
    fetchDetail(1, EMPTY_DETAIL_FILTERS, statusFilter);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    fetchDetail(1, appliedDetailFilters, value);
  };

  const handleGenerateExcel = async () => {
    setExcelLoading(true);
    const res = await generateInventoryExcelService(eventId);
    setExcelLoading(false);
    if (res.status && res.url) {
      window.open(res.url, '_blank');
    } else {
      toast.error(res.errors ?? 'Error al generar el Excel.');
    }
  };

  const filteredSummaryItems = useMemo(() => {
    const term = summarySearch.toLowerCase().trim();
    if (!term) return summaryItems;
    return summaryItems.filter((it) => it.nombre?.toLowerCase().includes(term));
  }, [summaryItems, summarySearch]);

  const loading = view === 'resumen' ? summaryLoading : detailLoading;
  const hasActiveDetailFilters = Boolean(
    appliedDetailFilters.nombre || appliedDetailFilters.itemNombre
  );

  return (
    <div className="flex flex-col gap-4">
      <ExcelLoadingModal open={excelLoading} />

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleGenerateExcel}
          disabled={excelLoading || loading}
          className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted transition-colors disabled:opacity-40"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar Excel
        </button>
        <button
          onClick={handleRefresh}
          disabled={loading || excelLoading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar inventario"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!summaryLoading && totals.cantidadCargada > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <StatChip
            icon={Boxes}
            label="Cargado"
            value={totals.cantidadCargada}
            highlight
          />
          <StatChip icon={Package} label="Asignado" value={totals.asignado} />
          <StatChip icon={Clock} label="Pendiente" value={totals.pendiente} />
          <StatChip icon={AlertTriangle} label="Dañado" value={totals.danado} />
        </div>
      )}

      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              view === v.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'resumen' ? (
        <>
          {!summaryLoading && summaryItems.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-9"
                placeholder="Buscar ítem..."
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
              />
              {summarySearch && (
                <button
                  onClick={() => setSummarySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {summaryLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 animate-pulse h-24"
                />
              ))}
            </div>
          ) : summaryItems.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Sin inventario cargado"
              description="Este evento aún no tiene ítems de inventario cargados."
            />
          ) : filteredSummaryItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="No se encontraron ítems con ese nombre."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSummaryItems.map((item) => (
                <ItemSummaryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Filtros
              </p>
              {hasActiveDetailFilters && (
                <button
                  onClick={handleClearDetailFilters}
                  className="flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <X className="w-3 h-3" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-3">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusFilter(opt.value)}
                  disabled={detailLoading}
                  className={cn(
                    'flex-1 rounded-lg text-xs font-medium transition-all',
                    statusFilter === opt.value
                      ? 'bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Nombre del colaborador"
                value={detailFilters.nombre}
                onChange={(e) =>
                  setDetailFilters((f) => ({ ...f, nombre: e.target.value }))
                }
              />
              <Input
                placeholder="Nombre del ítem"
                value={detailFilters.itemNombre}
                onChange={(e) =>
                  setDetailFilters((f) => ({
                    ...f,
                    itemNombre: e.target.value,
                  }))
                }
              />
              <Button
                onClick={handleApplyDetailFilters}
                disabled={detailLoading}
              >
                Buscar
              </Button>
            </div>
          </div>

          {detailLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 animate-pulse h-20"
                />
              ))}
            </div>
          ) : detailRows.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Sin resultados"
              description="No hay asignaciones de inventario para los filtros aplicados."
            />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {detailRows.map((row) => (
                  <CollaboratorDetailRow key={row.id} row={row} />
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() =>
                    fetchDetail(
                      detailPagination.page - 1,
                      appliedDetailFilters,
                      statusFilter
                    )
                  }
                  disabled={detailPagination.page <= 1 || detailLoading}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  {detailPagination.page} / {detailPagination.totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    fetchDetail(
                      detailPagination.page + 1,
                      appliedDetailFilters,
                      statusFilter
                    )
                  }
                  disabled={
                    detailPagination.page >= detailPagination.totalPages ||
                    detailLoading
                  }
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
