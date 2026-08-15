import { useCallback, useEffect, useRef, useState } from 'react';

const EMPTY_FILTERS = { name: '', cedula: '' };
const emptyPagination = (limit) => ({
  page: 1,
  limit,
  total: 0,
  totalPages: 1,
});

/**
 * Estado compartido de las listas de las estaciones: filtros (nombre/cédula),
 * paginación, carga y mutación local optimista.
 *
 * `fetcher` recibe `(eventId, { name, cedula, shiftId, page, limit })` y debe resolver el
 * envelope estándar del API: `{ status, data: { data: { collaborators, pagination } }, errors }`.
 */
export function useStationList({
  eventId,
  fetcher,
  dateRegister,
  shiftId = '',
  initialPageSize = 25,
}) {
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [filterInput, setFilterInput] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [reloadToken, setReloadToken] = useState(0);

  const [collaborators, setCollaborators] = useState([]);
  const [pagination, setPagination] = useState(
    emptyPagination(initialPageSize)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // El fetcher se define inline en cada sección; la ref evita recargas por identidad.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.resolve(
      fetcherRef.current(eventId, {
        ...appliedFilters,
        dateRegister,
        shiftId,
        page: currentPage,
        limit: pageSize,
      })
    ).then((res) => {
      // Descarta respuestas obsoletas (búsqueda rápida o cambio de página encadenado).
      if (cancelled) return;

      if (res?.status && res?.data) {
        setCollaborators(res.data?.data?.collaborators ?? []);
        setPagination(res.data?.data?.pagination ?? emptyPagination(pageSize));
        setError(null);
      } else {
        setCollaborators([]);
        setPagination(emptyPagination(pageSize));
        setError(
          typeof res?.errors === 'string'
            ? res.errors
            : 'No se pudieron cargar los registros de esta estación.'
        );
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    eventId,
    dateRegister,
    shiftId,
    appliedFilters,
    currentPage,
    pageSize,
    reloadToken,
  ]);

  // Cambiar de día reinicia la paginación: el día 3 puede tener menos páginas.
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRegister, shiftId]);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const setFilterField = useCallback((field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submitFilters = useCallback(() => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
  }, [filterInput]);

  const clearFilters = useCallback(() => {
    setFilterInput(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }, []);

  const onFilterKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') submitFilters();
    },
    [submitFilters]
  );

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  /** Reemplaza un colaborador de la lista sin refetch. `updater` recibe y devuelve el colaborador. */
  const updateCollaborator = useCallback((userId, updater) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.userId === userId ? updater(c) : c))
    );
  }, []);

  /** Atajo para el caso más común: parchear el objeto `attendance` de un colaborador. */
  const updateAttendance = useCallback(
    (userId, patch) => {
      updateCollaborator(userId, (c) => ({
        ...c,
        attendance: { ...c.attendance, ...patch },
      }));
    },
    [updateCollaborator]
  );

  const totalPages = Math.max(1, pagination.totalPages ?? 1);
  const safePage = Math.min(currentPage, totalPages);

  return {
    collaborators,
    setCollaborators,
    updateCollaborator,
    updateAttendance,
    loading,
    error,
    refresh,
    filters: {
      input: filterInput,
      setField: setFilterField,
      submit: submitFilters,
      clear: clearFilters,
      onKeyDown: onFilterKeyDown,
      hasActive: filterInput.name !== '' || filterInput.cedula !== '',
    },
    page: {
      current: safePage,
      total: totalPages,
      size: pageSize,
      setSize: changePageSize,
      go: setCurrentPage,
      totalItems: pagination.total ?? 0,
      startIdx: (safePage - 1) * pageSize,
    },
  };
}
