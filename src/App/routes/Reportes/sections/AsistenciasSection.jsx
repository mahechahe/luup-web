import { useCallback, useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Package,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AttendanceCollaboratorCard from '../components/AttendanceCollaboratorCard';
import AttendanceFilterBar from '../components/AttendanceFilterBar';
import {
  CollaboratorCardSkeleton,
  ExcelLoadingModal,
} from '../components/AttendanceFeedback';
import {
  generateAttendanceExcelService,
  getAttendanceReportService,
} from '../services/reportesServices';

const PAGE_LIMIT = 25;
const EMPTY_FILTERS = { dateRegister: '', name: '', cedula: '' };

const ATTENDED_OPTIONS = [
  { value: null, label: 'Todos', icon: Users },
  { value: true, label: 'Asistieron', icon: UserCheck },
  { value: false, label: 'No asistieron', icon: UserX },
];


export default function AsistenciasSection({ eventId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [excelLoading, setExcelLoading] = useState(false);
  const [totals, setTotals] = useState({ total: 0, attended: 0, notAttended: 0, withLunch: 0, withInventory: 0 });
  const [attendedFilter, setAttendedFilter] = useState(null);

  const fetchReport = useCallback(
    async (page, activeFilters, attended) => {
      setLoading(true);
      const body = { eventId: Number(eventId), page, limit: PAGE_LIMIT };

      if (activeFilters.dateRegister) body.dateRegister = activeFilters.dateRegister;
      if (activeFilters.name) body.name = activeFilters.name;
      if (activeFilters.cedula) body.cedula = activeFilters.cedula;
      if (attended !== null && attended !== undefined) body.attended = attended;

      const response = await getAttendanceReportService(body);
      if (response.status) {
        setCollaborators(response.collaborators);
        setPagination(response.pagination);
        setTotals(response.totals);
      } else {
        toast.error(response.errors ?? 'Error al cargar el reporte.');
      }
      setLoading(false);
    },
    [eventId]
  );

  useEffect(() => {
    if (!eventId) return;
    fetchReport(1, EMPTY_FILTERS, null);
  }, [eventId, fetchReport]);

  const handleGenerateExcel = async () => {
    setExcelLoading(true);
    const body = { eventId: Number(eventId) };

    if (appliedFilters.dateRegister) body.dateRegister = appliedFilters.dateRegister;
    if (appliedFilters.name) body.name = appliedFilters.name;
    if (appliedFilters.cedula) body.cedula = appliedFilters.cedula;

    const response = await generateAttendanceExcelService(body);
    setExcelLoading(false);

    if (response.status && response.url) {
      window.open(response.url, '_blank');
    } else {
      toast.error(response.errors ?? 'Error al generar el Excel.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    fetchReport(1, filters, attendedFilter);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    fetchReport(1, EMPTY_FILTERS, attendedFilter);
  };

  const handleAttendedFilter = (value) => {
    setAttendedFilter(value);
    fetchReport(1, appliedFilters, value);
  };

  const showStats = !loading && totals.total > 0;

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
          onClick={() => fetchReport(pagination.page, appliedFilters, attendedFilter)}
          disabled={loading || excelLoading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar asistencias"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {showStats && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="flex flex-col items-center gap-0.5 py-4">
              <span className="text-2xl font-bold text-foreground">{totals.total}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Asignados</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-4">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totals.attended}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Asistieron</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-4">
              <span className="text-2xl font-bold text-red-500 dark:text-red-400">{totals.notAttended}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Ausentes</span>
            </div>
          </div>

          {totals.total > 0 && (
            <div className="h-1 bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.round((totals.attended / totals.total) * 100)}%` }}
              />
            </div>
          )}

          {totals.attended > 0 && (
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">{totals.withLunch}</span>
                <span className="text-xs text-muted-foreground">con almuerzo</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5">
                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">{totals.withInventory}</span>
                <span className="text-xs text-muted-foreground">con inventario</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Filtros
        </p>

        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-3">
          {ATTENDED_OPTIONS.map((opt) => (
            <Button
              key={String(opt.value)}
              variant="ghost"
              size="sm"
              onClick={() => handleAttendedFilter(opt.value)}
              disabled={loading}
              className={cn(
                'flex-1 rounded-lg text-xs font-medium gap-1.5 transition-all',
                attendedFilter === opt.value
                  ? 'bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              )}
            >
              {opt.icon && <opt.icon className="w-3.5 h-3.5 shrink-0" />}
              {opt.label}
            </Button>
          ))}
        </div>

        <AttendanceFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <CollaboratorCardSkeleton key={index} />
          ))}
        </div>
      ) : collaborators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Sin resultados</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            No hay colaboradores para los filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {pagination.total}{' '}
              {pagination.total === 1 ? 'colaborador' : 'colaboradores'}
            </span>
            {Object.values(appliedFilters).some(Boolean) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-brand hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {collaborators.map((collaborator) => (
              <AttendanceCollaboratorCard
                key={collaborator.userId}
                collaborator={collaborator}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => fetchReport(pagination.page - 1, appliedFilters, attendedFilter)}
              disabled={pagination.page <= 1 || loading}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchReport(pagination.page + 1, appliedFilters, attendedFilter)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
