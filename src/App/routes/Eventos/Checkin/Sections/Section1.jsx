import { Button } from '@/components/ui/button';
import { IdCard, RefreshCw, Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Station1Tab } from '../components/Station1Tab';
import { PaginationControls } from '../components/PaginationControls';
import { getEventAttendanceService } from '../../services/eventServices';
import AttendanceEditModal from '../AttendanceEditModal';

const PAGE_SIZE = 25;

export const Section1 = ({ eventId }) => {
  /* States */
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageSize = PAGE_SIZE;
  const [editTarget, setEditTarget] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };
  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';

  const handleSearch = () => {
    setFilters(filterInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterInput({ name: '', cedula: '' });
    setFilters({ name: '', cedula: '' });
    setCurrentPage(1);
  };

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

  /* Fetch */
  const fetchData = (currentFilters = filters, page = currentPage) => {
    setLoading(true);
    getEventAttendanceService(eventId, currentFilters, page, pageSize).then(
      (res) => {
        if (res.status && res.data) {
          setCollaborators(res.data?.data?.collaborators ?? []);
          setPagination(
            res.data?.data?.pagination ?? { total: 0, totalPages: 1 }
          );
        }
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchData(filters, currentPage);
  }, [eventId, filters, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems = pagination.total;
  const totalPages = Math.max(1, pagination.totalPages);
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  return (
    <>
      <div className="rounded-2xl bg-[#234465] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            Estación 1
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Check-in
          </h2>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide mb-0.5">
              Fecha de hoy
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#DD7419] capitalize leading-snug">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white self-start sm:self-auto"
            onClick={() => fetchData(filters)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={filterInput.name}
              onChange={(e) =>
                setFilterInput((f) => ({ ...f, name: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
            />
          </div>

          <div className="relative w-40 shrink-0">
            <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cédula…"
              value={filterInput.cedula}
              onChange={(e) =>
                setFilterInput((f) => ({ ...f, cedula: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={
              (filterInput.name === '' && filterInput.cedula === '') || loading
            }
            className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
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
      </div>

      <PaginationControls
        totalItems={totalItems}
        pageSize={pageSize}
        startIdx={startIdx}
        safePage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Station1Tab
        collaborators={collaborators}
        loading={loading}
        eventId={eventId}
        filter={statusFilter}
        onAttendanceUpdated={handleAttendanceUpdated}
        onUniformSaved={handleUniformSaved}
        onEdit={setEditTarget}
      />

      <div className="pb-4">
        <PaginationControls
          totalItems={totalItems}
          pageSize={pageSize}
          startIdx={startIdx}
          safePage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <AttendanceEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        collaborator={editTarget}
        eventId={eventId}
        onUpdated={handleAttendanceUpdated}
        onUniformSaved={handleUniformSaved}
      />
    </>
  );
};
