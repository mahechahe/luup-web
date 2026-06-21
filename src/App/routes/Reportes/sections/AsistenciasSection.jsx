import { useCallback, useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Package,
  RefreshCw,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
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

  const fetchReport = useCallback(
    async (page, activeFilters) => {
      setLoading(true);
      const body = { eventId: Number(eventId), page, limit: PAGE_LIMIT };

      if (activeFilters.dateRegister) {
        body.dateRegister = activeFilters.dateRegister;
      }
      if (activeFilters.name) body.name = activeFilters.name;
      if (activeFilters.cedula) body.cedula = activeFilters.cedula;

      const response = await getAttendanceReportService(body);
      if (response.status) {
        setCollaborators(response.collaborators);
        setPagination(response.pagination);
      } else {
        toast.error(response.errors ?? 'Error al cargar el reporte.');
      }
      setLoading(false);
    },
    [eventId]
  );

  useEffect(() => {
    if (!eventId) return;
    fetchReport(1, EMPTY_FILTERS);
  }, [eventId, fetchReport]);

  const handleGenerateExcel = async () => {
    setExcelLoading(true);
    const body = { eventId: Number(eventId) };

    if (appliedFilters.dateRegister) {
      body.dateRegister = appliedFilters.dateRegister;
    }
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
    fetchReport(1, filters);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    fetchReport(1, EMPTY_FILTERS);
  };

  const lunchCount = collaborators.filter((collaborator) =>
    collaborator.attendances.some((attendance) => attendance.receivedLunch)
  ).length;
  const inventoryCount = collaborators.filter(
    (collaborator) => collaborator.inventoryItems.length > 0
  ).length;

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
          onClick={() => fetchReport(1, appliedFilters)}
          disabled={loading || excelLoading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar asistencias"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && collaborators.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatChip
            icon={Users}
            label="Asistencias"
            value={pagination.total}
            highlight
          />
          <StatChip
            icon={UtensilsCrossed}
            label="Con almuerzo"
            value={lunchCount}
          />
          <StatChip
            icon={Package}
            label="Con inventario"
            value={inventoryCount}
          />
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Filtros
        </p>
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
          <p className="text-sm font-medium text-foreground mb-1">
            Sin resultados
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            No hay registros de asistencia para los filtros aplicados.
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
              onClick={() => fetchReport(pagination.page - 1, appliedFilters)}
              disabled={pagination.page <= 1 || loading}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchReport(pagination.page + 1, appliedFilters)}
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
