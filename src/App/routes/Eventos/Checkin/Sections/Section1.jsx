import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  IdCard,
  Search,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Station1Tab } from '../components/Station1Tab';
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

  /* useEffect */
  useEffect(() => {
    setLoading(true);
    getEventAttendanceService(eventId, filters).then((res) => {
      if (res.status && res.data)
        setCollaborators(res.data?.data?.collaborators ?? []);
      setLoading(false);
    });
  }, [eventId, filters]);

  const totalItems = collaborators.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
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

      <div className="bg-card rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap pb-4">
        <div className="flex items-center gap-3">
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
            .filter(
              (p) =>
                totalPages <= 7 ||
                p === 1 ||
                p === totalPages ||
                Math.abs(p - safePage) <= 1
            )
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span
                  key={`e-${idx}`}
                  className="px-1 text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition ${
                    safePage === item
                      ? 'bg-[#DD7419] text-white'
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
