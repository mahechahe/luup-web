import {
  Check,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getEventCollaboratorsService } from '../../services/eventServices';

const PAGE_SIZE = 8;

export function AddPersonModal({ zoneId, role, existingIds, onConfirm, onClose }) {
  const [collaborators, setCollaborators] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loadingData, setLoadingData] = useState(false);

  /* Selección: Map<userId, collaborator> */
  const [selected, setSelected] = useState(new Map());

  /* Inputs de búsqueda (escritura libre) */
  const [searchFirst, setSearchFirst] = useState('');
  const [searchCedula, setSearchCedula] = useState('');

  /* Filtros activos (se aplican al buscar) */
  const [activeFilters, setActiveFilters] = useState({ firstName: '', cedula: '' });
  const [page, setPage] = useState(1);

  /* Fetch cada vez que cambian los filtros activos o la página */
  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    getEventCollaboratorsService({
      page,
      limit: PAGE_SIZE,
      firstName: activeFilters.firstName,
      cedula: activeFilters.cedula,
    }).then((res) => {
      if (cancelled) return;
      if (res.status) {
        setCollaborators(res.collaborators);
        setPagination(res.pagination);
      }
      setLoadingData(false);
    });
    return () => { cancelled = true; };
  }, [page, activeFilters]);

  const applySearch = () => {
    setActiveFilters({ firstName: searchFirst, cedula: searchCedula });
    setPage(1);
  };

  const clearFilters = () => {
    setSearchFirst('');
    setSearchCedula('');
    setActiveFilters({ firstName: '', cedula: '' });
    setPage(1);
  };

  const hasActiveFilters = activeFilters.firstName || activeFilters.cedula;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') applySearch();
  };

  const toggleSelect = (collaborator) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(collaborator.userId)) {
        next.delete(collaborator.userId);
      } else {
        if (role === 'jefe') {
          // Solo un jefe: reemplaza cualquier selección previa
          next.clear();
        }
        next.set(collaborator.userId, collaborator);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(zoneId, [...selected.values()], role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#234465]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#234465]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Agregar colaboradores</h3>
              {selected.size > 0 && (
                <p className="text-[11px] text-[#234465] font-medium">
                  {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-border flex gap-2 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Nombre..."
              value={searchFirst}
              onChange={(e) => setSearchFirst(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg outline-none focus:border-[#234465] bg-white"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Cédula..."
              value={searchCedula}
              onChange={(e) => setSearchCedula(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg outline-none focus:border-[#234465] bg-white"
            />
          </div>
          <button
            onClick={applySearch}
            className="px-4 py-1.5 bg-[#234465] text-white text-xs font-medium rounded-lg hover:bg-[#234465]/90 transition shrink-0"
          >
            Buscar
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              title="Borrar filtros"
              className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition shrink-0"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#234465]" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Users className="w-8 h-8" />
              <p className="text-sm">No se encontraron colaboradores</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 sticky top-0">
                  <th className="w-10 px-4 py-2.5" />
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                    Nombre
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                    Cédula
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                    Teléfono
                  </th>
                </tr>
              </thead>
              <tbody>
                {collaborators.map((c) => {
                  const isSelected = selected.has(c.userId);
                  const alreadyAdded = existingIds.has(c.userId);
                  return (
                    <tr
                      key={c.userId}
                      onClick={() => !alreadyAdded && toggleSelect(c)}
                      className={`border-b border-border last:border-0 transition-colors ${
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed bg-muted/10'
                          : isSelected
                            ? 'bg-[#234465]/5 cursor-pointer'
                            : 'hover:bg-muted/30 cursor-pointer'
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-[#234465] border-[#234465]'
                              : 'border-border bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {`${c.firstName} ${c.lastName}`.trim()}
                        {alreadyAdded && (
                          <span className="ml-1.5 text-[9px] text-muted-foreground font-normal">
                            (ya agregado)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.cedula}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.phone ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-6 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {pagination.total} colaborador{pagination.total !== 1 ? 'es' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loadingData}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground px-1">
              {page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= (pagination.totalPages || 1) || loadingData}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium bg-muted rounded-xl hover:bg-muted/70 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="flex-1 py-2.5 text-sm font-medium bg-[#234465] text-white rounded-xl hover:bg-[#234465]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selected.size > 0 ? `Agregar (${selected.size})` : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
