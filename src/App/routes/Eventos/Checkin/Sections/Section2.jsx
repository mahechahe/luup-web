import React, { useEffect, useState } from 'react';
import { getAttendanceRecordsService } from '../../services/eventServices';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  IdCard,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Station2Tab } from '../components/Station2Tab';
import { toast } from 'sonner';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const Section2 = ({ eventId }) => {
  /* States */
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* Functions */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
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

  const handleActionSaved = (collaboratorId, type, typeSnack, received = true) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.userId !== collaboratorId) return c;

        let updatedAttendance = { ...c.attendance };

        if (type === 'suitcase') {
          updatedAttendance.receivedSuitcase = received;
        } else if (type === 'lunch') {
          updatedAttendance.receivedLunch = received;
        } else if (type === 'snack') {
          updatedAttendance.receivedSnack = received;
          updatedAttendance.snackDetail = received ? typeSnack : null;
        } else if (type === 'confirm') {
          updatedAttendance.confirmStation2 = true;
        }

        return { ...c, attendance: updatedAttendance };
      })
    );

  };

  /* Fetch */
  const fetchData = (currentFilters = filters) => {
    setLoading(true);
    getAttendanceRecordsService(eventId, currentFilters).then((res) => {
      if (res.status && res.data)
        setCollaborators(res.data?.data?.collaborators ?? []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [eventId, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';

  const totalItems = collaborators.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  return (
    <>
      {/* Banner */}
      <div className="rounded-2xl bg-[#234465] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            Estación 2
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Maleta · Almuerzo · Refrigerio
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

      {/* Controles */}
      <div className="bg-card rounded-xl border border-border p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={filterInput.name}
              onChange={(e) =>
                setFilterInput((f) => ({
                  ...f,
                  name: e.target.value,
                }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full"
            />
          </div>
          <div className="relative w-40 shrink-0">
            <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cédula…"
              value={filterInput.cedula}
              onChange={(e) =>
                setFilterInput((f) => ({
                  ...f,
                  cedula: e.target.value,
                }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full"
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
        <div className="border-t border-border" />
      </div>

      {/* Alerta informativa */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-semibold">Importante:</span> Para que un
          colaborador pase a la{' '}
          <span className="font-semibold">Estación 3</span>, debe tener marcado
          el <span className="font-semibold">Refrigerio</span> y tener la{' '}
          <span className="font-semibold">asignación confirmada</span>.
        </p>
      </div>

      {/* Tab */}
      <Station2Tab
        collaborators={collaborators}
        loading={loading}
        onActionSaved={handleActionSaved}
      />

      <div className="bg-card rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              Filas:
            </span>
            <div className="flex border border-border rounded-md overflow-hidden">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    pageSize === size
                      ? 'bg-[#DD7419] text-white'
                      : 'bg-card text-foreground hover:bg-muted'
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
    </>
  );
};
