import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  Edit3,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { hasAdminAccess } from '@/App/utils/roles';
import { useUserStore } from '@/App/context/userStore';
import { AssignmentFilterSheet } from './components/AssignmentFilterSheet';
import {
  createEventShiftService,
  deleteEventAssignmentService,
  getAssignmentCollaboratorsService,
  getEventAssignmentWorkspaceService,
  saveEventAssignmentsService,
  updateEventShiftService,
} from '../services/eventServices';

const ROLE_OPTIONS = [
  { value: 'supervisor', label: 'Supervisor de zona' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'responsable_acopio', label: 'Responsable de acopio' },
];

const EMPTY_ASSIGNMENT_FILTERS = {
  zoneId: '',
  shiftId: '',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, '0');
  const minute = String((index % 4) * 15).padStart(2, '0');
  return `${hour}:${minute}`;
});

const SelectField = ({
  value,
  onValueChange,
  placeholder,
  children,
  className = '',
  disabled = false,
}) => (
  <Select
    value={value === undefined || value === null ? '' : String(value)}
    onValueChange={onValueChange}
    disabled={disabled}
  >
    <SelectTrigger className={`h-9 ${className || 'w-full'}`}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
);

const TimeSelect = ({ value, onValueChange }) => {
  const currentValue = String(value ?? '').slice(0, 5);
  const hasCustomValue = currentValue && !TIME_OPTIONS.includes(currentValue);
  const options = hasCustomValue
    ? [currentValue, ...TIME_OPTIONS]
    : TIME_OPTIONS;

  return (
    <SelectField
      value={currentValue}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === '__none__' ? '' : nextValue)
      }
      placeholder="Seleccionar hora"
      className="mt-1.5 w-full"
    >
      <SelectItem value="__none__">Sin hora</SelectItem>
      {options.map((time) => (
        <SelectItem key={time} value={time}>
          {time}
          {time === currentValue && hasCustomValue ? ' · actual' : ''}
        </SelectItem>
      ))}
    </SelectField>
  );
};

const ZoneOption = ({ zone }) => (
  <span className="flex min-w-0 items-center gap-2">
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full border border-foreground/20 shadow-sm"
      style={{ backgroundColor: zone.color || '#7493b2' }}
      aria-hidden="true"
    />
    <span className="truncate">{zone.name}</span>
    <span className="shrink-0 text-xs text-muted-foreground">
      ·{' '}
      {String(zone.category).toLowerCase() === 'acopio'
        ? 'Centro de acopio'
        : 'Zona'}
    </span>
  </span>
);

const assignmentRow = (assignment) => ({
  ...assignment,
  rowId: `assignment-${assignment.assignmentId}`,
  assignmentId: Number(assignment.assignmentId),
  userId: Number(assignment.user.userId),
  zoneId: Number(assignment.zone.zoneId),
  defaultShiftId: Number(assignment.defaultShiftId),
  dailyOverrides: assignment.dailyOverrides ?? [],
  isNew: false,
});

const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
};

const formatDateRange = (event) => {
  if (!event?.dates?.length) return 'Sin fechas configuradas';
  if (event.dates.length === 1) return formatDate(event.dates[0]);
  return `${formatDate(event.dates[0])} — ${formatDate(
    event.dates[event.dates.length - 1]
  )}`;
};

const getApiError = (value) => {
  if (Array.isArray(value))
    return value.map((item) => item?.message ?? item).join(', ');
  if (value && typeof value === 'object')
    return value.message ?? 'Ocurrió un error.';
  return value || 'Ocurrió un error.';
};

export default function AsignacionMasivaPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isAdmin = hasAdminAccess(user?.roleId);

  const [workspace, setWorkspace] = useState(null);
  const [rows, setRows] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [searchingCollaborators, setSearchingCollaborators] = useState(false);
  const [bulkZoneId, setBulkZoneId] = useState('');
  const [bulkShiftId, setBulkShiftId] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [assignmentFilters, setAssignmentFilters] = useState(
    EMPTY_ASSIGNMENT_FILTERS
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [notice, setNotice] = useState(null);
  const [overrideRowId, setOverrideRowId] = useState(null);
  const [overrideDraft, setOverrideDraft] = useState({});
  const [shiftEditor, setShiftEditor] = useState(null);
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftTogglingId, setShiftTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchInputRef = useRef(null);
  const inlineSearchRefs = useRef({});
  const [inlineSearchRowId, setInlineSearchRowId] = useState(null);
  const [inlineSearchText, setInlineSearchText] = useState('');
  const [inlineCollaborators, setInlineCollaborators] = useState([]);
  const [inlineSearchingCollaborators, setInlineSearchingCollaborators] =
    useState(false);

  const loadWorkspace = useCallback(
    async (params = {}) => {
      setTableLoading(true);
      const result = await getEventAssignmentWorkspaceService(eventId, params);
      if (result.status) {
        setWorkspace(result.workspace);
        setRows((result.workspace?.assignments ?? []).map(assignmentRow));
        setSelectedRows([]);
        setNotice(null);
      } else {
        setNotice({ type: 'error', text: getApiError(result.errors) });
      }
      setInitialLoading(false);
      setTableLoading(false);
    },
    [eventId]
  );

  const workspaceQuery = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(assignmentSearchQuery ? { search: assignmentSearchQuery } : {}),
      ...(assignmentFilters.zoneId
        ? { zoneId: Number(assignmentFilters.zoneId) }
        : {}),
      ...(assignmentFilters.shiftId
        ? { shiftId: Number(assignmentFilters.shiftId) }
        : {}),
    }),
    [assignmentFilters, assignmentSearchQuery, page, pageSize]
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setAssignmentSearchQuery(assignmentSearch.trim()),
      350
    );
    return () => clearTimeout(timer);
  }, [assignmentSearch]);

  useEffect(() => {
    if (!isAdmin) {
      setInitialLoading(false);
      return;
    }

    loadWorkspace(workspaceQuery);
  }, [isAdmin, loadWorkspace, workspaceQuery]);

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 2) {
      setCollaborators([]);
      setSearchingCollaborators(false);
      return undefined;
    }

    let cancelled = false;
    setCollaborators([]);
    setSearchingCollaborators(true);

    const timer = setTimeout(async () => {
      const result = await getAssignmentCollaboratorsService(query);
      if (cancelled) return;
      setCollaborators(result.status ? result.collaborators : []);
      setSearchingCollaborators(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  useEffect(() => {
    const query = inlineSearchText.trim();
    if (!inlineSearchRowId || query.length < 2) {
      setInlineCollaborators([]);
      setInlineSearchingCollaborators(false);
      return undefined;
    }

    let cancelled = false;
    setInlineCollaborators([]);
    setInlineSearchingCollaborators(true);

    const timer = setTimeout(async () => {
      const result = await getAssignmentCollaboratorsService(query);
      if (cancelled) return;
      setInlineCollaborators(result.status ? result.collaborators : []);
      setInlineSearchingCollaborators(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inlineSearchRowId, inlineSearchText]);

  const activeShifts = useMemo(
    () => (workspace?.shifts ?? []).filter((shift) => shift.isActive),
    [workspace?.shifts]
  );

  const shiftLabel = (shift) => {
    if (!shift) return '';
    const hours =
      shift.startTime && shift.endTime
        ? ` · ${shift.startTime}–${shift.endTime}`
        : '';
    return `${shift.name}${hours}`;
  };

  const getZone = (zoneId) =>
    (workspace?.zones ?? []).find(
      (zone) => Number(zone.zoneId) === Number(zoneId)
    );

  const roleOptionsFor = (row) => {
    const zone = getZone(row.zoneId);
    return ROLE_OPTIONS.filter(
      (role) =>
        role.value !== 'responsable_acopio' || zone?.category === 'acopio'
    );
  };

  const duplicateUserIds = useMemo(() => {
    const counts = new Map();
    rows.forEach((row) => {
      if (!row.userId || row.role === 'coordinador') return;
      counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
    });
    return new Set(
      [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
    );
  }, [rows]);

  const rowIsComplete = (row) =>
    Boolean(row.userId && row.zoneId && row.role && row.defaultShiftId);

  const totalPages = Math.max(1, workspace?.pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows;
  const assignmentTotal = workspace?.pagination?.total ?? 0;
  const assignedTotal = workspace?.pagination?.totalAll ?? assignmentTotal;
  const activeAssignmentFilterCount =
    Object.values(assignmentFilters).filter(Boolean).length;
  const hasAssignmentCriteria = Boolean(
    assignmentSearch.trim() || activeAssignmentFilterCount
  );

  useEffect(() => {
    setPage(1);
  }, [assignmentFilters, assignmentSearch, pageSize]);

  const updateRow = (rowId, field, value) => {
    setRows((current) =>
      current.map((row) => {
        if (row.rowId !== rowId) return row;
        const next = { ...row, [field]: value };
        if (
          field === 'zoneId' &&
          next.role === 'responsable_acopio' &&
          getZone(value)?.category !== 'acopio'
        ) {
          next.role = 'colaborador';
        }
        return next;
      })
    );
  };

  const closeInlineSearch = () => {
    setInlineSearchRowId(null);
    setInlineSearchText('');
    setInlineCollaborators([]);
    setInlineSearchingCollaborators(false);
  };

  const assignCollaboratorToRow = (rowId, collaborator) => {
    if (
      rows.some(
        (row) =>
          row.rowId !== rowId &&
          Number(row.userId) === Number(collaborator.userId)
      )
    ) {
      toast.error('Este colaborador ya está en la tabla.');
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.rowId === rowId
          ? { ...row, userId: collaborator.userId, user: collaborator }
          : row
      )
    );
    setSelectedRows((current) =>
      current.includes(rowId) ? current : [...current, rowId]
    );
    closeInlineSearch();
    toast.success('Colaborador asignado a la nueva fila.');
  };

  const addCollaborator = (collaborator) => {
    if (
      rows.some((row) => Number(row.userId) === Number(collaborator.userId))
    ) {
      toast.error('Este colaborador ya está en la tabla.');
      return;
    }

    const pendingRow = rows.find((row) => !row.userId && row.isNew);
    if (pendingRow) {
      assignCollaboratorToRow(pendingRow.rowId, collaborator);
      setSearchText('');
      setCollaborators([]);
      return;
    }

    const rowId = `new-${collaborator.userId}-${Date.now()}`;
    setRows((current) => [
      {
        rowId,
        assignmentId: undefined,
        userId: collaborator.userId,
        user: collaborator,
        zoneId: '',
        role: 'colaborador',
        defaultShiftId: '',
        dailyOverrides: [],
        isNew: true,
      },
      ...current,
    ]);
    setSelectedRows((current) => [...current, rowId]);
    setSearchText('');
    setCollaborators([]);
  };

  const removeRow = async (rowId) => {
    const row = rows.find((item) => item.rowId === rowId);
    if (!row) return;
    if (row.isNew) {
      setRows((current) => current.filter((item) => item.rowId !== rowId));
      setSelectedRows((current) => current.filter((id) => id !== rowId));
      return;
    }
    setDeleteTarget(row);
  };

  const confirmRemoveRow = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteEventAssignmentService(
        eventId,
        deleteTarget.assignmentId
      );
      if (!result.status) {
        toast.error(getApiError(result.errors));
        return;
      }
      setDeleteTarget(null);
      await loadWorkspace(workspaceQuery);
      setSelectedRows((current) =>
        current.filter((id) => id !== deleteTarget.rowId)
      );
      toast.success('Asignación eliminada.');
    } finally {
      setDeleting(false);
    }
  };

  const applyBulk = () => {
    if (!selectedRows.length) {
      toast.error('Selecciona al menos una fila.');
      return;
    }
    setRows((current) =>
      current.map((row) => {
        if (!selectedRows.includes(row.rowId)) return row;
        const next = { ...row };
        if (bulkZoneId) next.zoneId = Number(bulkZoneId);
        if (bulkShiftId) next.defaultShiftId = Number(bulkShiftId);
        if (
          bulkRole &&
          (bulkRole !== 'responsable_acopio' ||
            getZone(next.zoneId)?.category === 'acopio')
        )
          next.role = bulkRole;
        if (
          next.role === 'responsable_acopio' &&
          getZone(next.zoneId)?.category !== 'acopio'
        )
          next.role = 'colaborador';
        return next;
      })
    );
    toast.success('Cambios aplicados a las filas seleccionadas.');
  };

  const copyRowConfiguration = (row) => {
    if (!row.zoneId || !row.role || !row.defaultShiftId) {
      toast.error(
        'Completa la zona, el rol y el turno antes de copiar la configuración.'
      );
      return;
    }

    const rowId = `copy-${row.rowId}-${Date.now()}`;
    setRows((current) => [
      {
        rowId,
        assignmentId: undefined,
        userId: '',
        user: null,
        zoneId: Number(row.zoneId),
        role: row.role,
        defaultShiftId: Number(row.defaultShiftId),
        dailyOverrides: (row.dailyOverrides ?? []).map((override) => ({
          date: override.date,
          shiftId: Number(override.shiftId),
        })),
        isNew: true,
      },
      ...current,
    ]);
    setSelectedRows((current) => [...current, rowId]);
    setSearchText('');
    setCollaborators([]);
    setInlineSearchRowId(rowId);
    setInlineSearchText('');
    setInlineCollaborators([]);
    window.requestAnimationFrame(() =>
      inlineSearchRefs.current[rowId]?.focus()
    );
    toast.success('Nueva fila creada. Busca un colaborador para asignarlo.');
  };

  const openOverrides = (row) => {
    const draft = {};
    (workspace?.event?.dates ?? []).forEach((date) => {
      const override = row.dailyOverrides?.find((item) => item.date === date);
      draft[date] = override ? String(override.shiftId) : '';
    });
    setOverrideDraft(draft);
    setOverrideRowId(row.rowId);
  };

  const saveOverrides = () => {
    setRows((current) =>
      current.map((row) => {
        if (row.rowId !== overrideRowId) return row;
        return {
          ...row,
          dailyOverrides: Object.entries(overrideDraft)
            .filter(
              ([, shiftId]) =>
                shiftId && Number(shiftId) !== Number(row.defaultShiftId)
            )
            .map(([date, shiftId]) => ({ date, shiftId: Number(shiftId) })),
        };
      })
    );
    setOverrideRowId(null);
  };

  const saveAssignments = async () => {
    if (!rows.length) {
      toast.error('Agrega al menos un colaborador.');
      return;
    }
    const incomplete = rows.find((row) => !rowIsComplete(row));
    if (incomplete) {
      toast.error(
        'Completa colaborador, zona, rol y turno en todas las filas.'
      );
      return;
    }
    if (duplicateUserIds.size) {
      toast.error(
        'Hay colaboradores repetidos con una asignación incompatible.'
      );
      return;
    }
    setSaving(true);
    const payload = rows.map((row) => ({
      ...(row.assignmentId ? { assignmentId: Number(row.assignmentId) } : {}),
      userId: Number(row.userId),
      zoneId: Number(row.zoneId),
      role: row.role,
      defaultShiftId: Number(row.defaultShiftId),
      dailyOverrides: row.dailyOverrides ?? [],
    }));
    const result = await saveEventAssignmentsService(eventId, payload);
    if (result.status) {
      toast.success('Asignaciones guardadas correctamente.');
      await loadWorkspace(workspaceQuery);
    } else {
      const conflict = result.data?.zoneId
        ? ` Zona actual: ${result.data.zoneId}.`
        : '';
      toast.error(`${getApiError(result.errors)}${conflict}`);
    }
    setSaving(false);
  };

  const saveShift = async () => {
    if (!shiftEditor?.name?.trim()) {
      toast.error('El nombre del turno es obligatorio.');
      return;
    }
    if (
      (shiftEditor.startTime && !shiftEditor.endTime) ||
      (!shiftEditor.startTime && shiftEditor.endTime)
    ) {
      toast.error('Completa ambas horas o deja las dos vacías.');
      return;
    }
    setShiftSaving(true);
    const payload = {
      name: shiftEditor.name.trim(),
      startTime: shiftEditor.startTime || null,
      endTime: shiftEditor.endTime || null,
      ...(shiftEditor.id ? { isActive: shiftEditor.isActive } : {}),
    };
    const result = shiftEditor.id
      ? await updateEventShiftService(eventId, shiftEditor.id, payload)
      : await createEventShiftService(eventId, payload);
    if (result.status) {
      toast.success(shiftEditor.id ? 'Turno actualizado.' : 'Turno creado.');
      setShiftEditor(null);
      await loadWorkspace(workspaceQuery);
    } else toast.error(getApiError(result.errors));
    setShiftSaving(false);
  };

  const toggleShift = async (shift) => {
    setShiftTogglingId(shift.shiftId);
    try {
      const result = await updateEventShiftService(eventId, shift.shiftId, {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isActive: !shift.isActive,
      });
      if (result.status) await loadWorkspace(workspaceQuery);
      else toast.error(getApiError(result.errors));
    } finally {
      setShiftTogglingId(null);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadWorkspace(workspaceQuery);
    setRefreshing(false);
  };

  const renderCollaboratorField = (row) => {
    if (row.user) {
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
            {row.user.firstName?.[0]}
            {row.user.lastName?.[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-foreground">
              {row.user.firstName} {row.user.lastName}
            </span>
            <span className="block text-xs text-muted-foreground">
              CC {row.user.cedula}
            </span>
          </span>
        </div>
      );
    }

    return (
      <Popover
        open={inlineSearchRowId === row.rowId}
        onOpenChange={(open) => {
          if (!open && inlineSearchRowId === row.rowId) {
            closeInlineSearch();
          }
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative w-full min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              ref={(node) => {
                if (node) {
                  inlineSearchRefs.current[row.rowId] = node;
                } else {
                  delete inlineSearchRefs.current[row.rowId];
                }
              }}
              value={
                inlineSearchRowId === row.rowId ? inlineSearchText : ''
              }
              onFocus={() => {
                if (inlineSearchRowId !== row.rowId) {
                  setInlineSearchRowId(row.rowId);
                  setInlineSearchText('');
                  setInlineCollaborators([]);
                }
              }}
              onChange={(event) => {
                setInlineSearchRowId(row.rowId);
                setInlineSearchText(event.target.value);
              }}
              placeholder="Buscar colaborador…"
              aria-label="Buscar colaborador para esta fila"
              className="h-9 pl-8 pr-2 text-sm"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[min(280px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden p-1"
        >
          {inlineSearchingCollaborators ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Buscando…
            </p>
          ) : inlineSearchText.trim().length < 2 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Escribe al menos 2 caracteres.
            </p>
          ) : inlineCollaborators.length ? (
            <div className="max-h-60 overflow-y-auto">
              {inlineCollaborators.map((collaborator) => (
                <button
                  key={collaborator.userId}
                  type="button"
                  onClick={() =>
                    assignCollaboratorToRow(row.rowId, collaborator)
                  }
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {collaborator.firstName} {collaborator.lastName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      CC {collaborator.cedula}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No se encontraron colaboradores.
            </p>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  const renderAssignmentStatus = (row) => {
    const duplicate = duplicateUserIds.has(row.userId);
    const complete = rowIsComplete(row);

    if (duplicate) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <X className="h-3 w-3" />
          Repetido
        </span>
      );
    }
    if (complete) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Listo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        <Clock3 className="h-3 w-3" />
        Pendiente
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No tienes permisos para administrar asignaciones.
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="mx-auto h-28 max-w-7xl rounded-2xl" />
        <Skeleton className="mx-auto mt-6 h-[500px] max-w-7xl rounded-2xl" />
      </div>
    );
  }

  const overrideRow = rows.find((row) => row.rowId === overrideRowId);
  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedRows.includes(row.rowId));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-[#234465] shadow-lg">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-7 sm:py-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/eventos/${eventId}/zonas`)}
                className="text-white hover:bg-white/15 hover:text-white"
                aria-label="Volver a zonas"
              >
                <ArrowLeft />
              </Button>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Operación · Zonas
                </p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  Asignación masiva
                </h1>
                <p className="mt-1 truncate text-sm text-white/65">
                  {workspace?.event?.name} · {formatDateRange(workspace?.event)}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:max-w-[220px]">
              <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  Personas asignadas
                </p>
                <p className="text-xl font-bold text-white">
                  {assignedTotal + rows.filter((row) => row.isNew).length}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={refresh}
                disabled={refreshing}
                className="w-full justify-center gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className={refreshing ? 'animate-spin' : ''} />{' '}
                Actualizar
              </Button>
            </div>
          </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/10 px-4 py-3 text-xs text-white/70 sm:px-6">
            <CalendarDays className="h-4 w-4 text-[#f39a54]" />
            <span>
              {workspace?.event?.dates?.length ?? 0} día
              {workspace?.event?.dates?.length === 1 ? '' : 's'} disponibles
            </span>
            <span className="text-white/25">•</span>
            <Info className="h-4 w-4 text-[#f39a54]" />
            <span>Los horarios son informativos y no bloquean cruces.</span>
          </div>
          <div className="border-t border-white/10 bg-[#1d3b59]/80 px-4 py-3.5 sm:px-7">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
              <div className="flex shrink-0 items-center justify-between gap-4 xl:w-[330px]">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Settings2 className="h-4 w-4 text-white/75" />
                  <div className="min-w-0">
                    <h2 className="whitespace-nowrap text-sm font-bold text-white">
                      Catálogo de turnos
                    </h2>
                    <p className="truncate text-[10px] text-white/55">
                      Horarios informativos y reutilizables
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/65">
                    {
                      (workspace?.shifts ?? []).filter(
                        (shift) => shift.isActive
                      ).length
                    }{' '}
                    activos
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    onClick={() =>
                      setShiftEditor({
                        name: '',
                        startTime: '',
                        endTime: '',
                        isActive: true,
                      })
                    }
                    className="bg-[#dd7419] text-white hover:bg-[#c96513]"
                    aria-label="Crear turno"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
                {(workspace?.shifts ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/55">
                    Crea el primer turno para poder asignar personas.
                  </div>
                ) : (
                  (workspace?.shifts ?? []).map((shift) => (
                    <div
                      key={shift.shiftId}
                      className={`flex w-[230px] shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors ${
                        shift.isActive
                          ? 'border-white/15 bg-white/10'
                          : 'border-white/10 bg-black/10 opacity-60'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            shift.isActive ? 'bg-emerald-400' : 'bg-white/35'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">
                            {shift.name}
                          </p>
                          <p className="text-[10px] text-white/55">
                            {shift.startTime && shift.endTime
                              ? `${shift.startTime}–${shift.endTime}`
                              : 'Sin horario informativo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setShiftEditor({
                              id: shift.shiftId,
                              name: shift.name,
                              startTime: shift.startTime ?? '',
                              endTime: shift.endTime ?? '',
                              isActive: shift.isActive,
                            })
                          }
                          className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
                          aria-label={`Editar turno ${shift.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleShift(shift)}
                          disabled={shiftTogglingId === shift.shiftId}
                          aria-busy={shiftTogglingId === shift.shiftId}
                          className="inline-flex min-w-[52px] items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-100"
                        >
                          {shiftTogglingId === shift.shiftId ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  shift.isActive
                                    ? 'bg-emerald-400'
                                    : 'bg-white/35'
                                }`}
                                aria-hidden="true"
                              />
                              {shift.isActive ? 'Activo' : 'Inactivo'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-5">
          <section className="min-w-0 space-y-4">
            <Card className="rounded-2xl border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-5 w-5 text-foreground" />
                    <h2 className="font-bold text-foreground">
                      Personas y asignaciones
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Agrega colaboradores desde aquí. Los nombres nunca se
                    escriben dentro de la tabla.
                  </p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Buscar colaborador para agregar…"
                    className="pl-9"
                  />
                  {searchText && (
                    <button
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setSearchText('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {(searchingCollaborators || collaborators.length > 0) && (
                    <div className="absolute left-0 right-0 top-11 z-30 max-h-[min(28rem,50vh)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover text-popover-foreground shadow-xl [scrollbar-color:rgba(221,116,25,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#DD7419]/40">
                      {searchingCollaborators ? (
                        <p className="px-3 py-4 text-sm text-muted-foreground">
                          Buscando…
                        </p>
                      ) : (
                        collaborators.map((collaborator) => (
                          <button
                            key={collaborator.userId}
                            onClick={() => addCollaborator(collaborator)}
                            className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                              <UserRound className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {collaborator.firstName} {collaborator.lastName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                CC {collaborator.cedula}
                              </span>
                            </span>
                            <Plus className="ml-auto h-4 w-4 text-[#DD7419]" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-border bg-card py-0 text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={assignmentSearch}
                    onChange={(event) =>
                      setAssignmentSearch(event.target.value)
                    }
                    placeholder="Buscar asignación por nombre o cédula…"
                    className="pl-9"
                  />
                  {assignmentSearch && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setAssignmentSearch('')}
                      aria-label="Limpiar búsqueda de asignaciones"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFilterSheetOpen(true)}
                    className={`flex-1 justify-center sm:flex-none ${
                      activeAssignmentFilterCount
                        ? 'gap-1.5 border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                        : 'gap-1.5'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {activeAssignmentFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {activeAssignmentFilterCount}
                      </span>
                    )}
                  </Button>
                  {hasAssignmentCriteria && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setAssignmentSearch('');
                      setAssignmentFilters(EMPTY_ASSIGNMENT_FILTERS);
                      }}
                      className="flex-1 justify-center gap-1.5 text-muted-foreground sm:flex-none"
                    >
                      <X className="h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {assignmentTotal}{' '}
                    {assignmentTotal === 1 ? 'asignación' : 'asignaciones'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={allVisibleSelected}
                    disabled={!visibleRows.length}
                    onCheckedChange={(checked) =>
                      setSelectedRows((current) => {
                        const visibleIds = visibleRows.map((row) => row.rowId);
                        if (checked) {
                          return [
                            ...current,
                            ...visibleIds.filter((id) => !current.includes(id)),
                          ];
                        }
                        return current.filter((id) => !visibleIds.includes(id));
                      })
                    }
                    aria-label="Seleccionar todas las filas"
                  />
                  <span>
                    {selectedRows.length} seleccionada
                    {selectedRows.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Aplicar a selección:
                  </span>
                  <SelectField
                    value={bulkZoneId}
                    onValueChange={(value) =>
                      setBulkZoneId(value === '__none__' ? '' : value)
                    }
                    placeholder="Zona…"
                    className="w-full sm:w-auto sm:min-w-[145px]"
                  >
                    <SelectItem value="__none__">No aplicar</SelectItem>
                    {(workspace?.zones ?? []).map((zone) => (
                      <SelectItem key={zone.zoneId} value={String(zone.zoneId)}>
                        <ZoneOption zone={zone} />
                      </SelectItem>
                    ))}
                  </SelectField>
                  <SelectField
                    value={bulkShiftId}
                    onValueChange={(value) =>
                      setBulkShiftId(value === '__none__' ? '' : value)
                    }
                    placeholder="Turno…"
                    className="w-full sm:w-auto sm:min-w-[145px]"
                  >
                    <SelectItem value="__none__">No aplicar</SelectItem>
                    {activeShifts.map((shift) => (
                      <SelectItem
                        key={shift.shiftId}
                        value={String(shift.shiftId)}
                      >
                        {shiftLabel(shift)}
                      </SelectItem>
                    ))}
                  </SelectField>
                  <SelectField
                    value={bulkRole}
                    onValueChange={(value) =>
                      setBulkRole(value === '__none__' ? '' : value)
                    }
                    placeholder="Rol…"
                    className="w-full sm:w-auto sm:min-w-[145px]"
                  >
                    <SelectItem value="__none__">No aplicar</SelectItem>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectField>
                  <Button
                    size="sm"
                    onClick={applyBulk}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 sm:w-auto"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>

              <div
                className="relative"
                aria-busy={tableLoading}
                aria-live="polite"
              >
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1040px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="w-10 px-4 py-3"></th>
                      <th className="px-3 py-3">Colaborador</th>
                      <th className="px-3 py-3">Zona</th>
                      <th className="px-3 py-3">Rol</th>
                      <th className="px-3 py-3">Turno predeterminado</th>
                      <th className="px-3 py-3">Configuración diaria</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="w-24 px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/50" />
                          <p className="mt-3 font-semibold text-foreground">
                            {hasAssignmentCriteria
                              ? 'No se encontraron asignaciones'
                              : 'Aún no hay personas en esta tabla'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {hasAssignmentCriteria
                              ? 'Prueba con otro nombre, cédula o filtro.'
                              : 'Usa el buscador superior para agregar la primera asignación.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => {
                        return (
                          <tr
                            key={row.rowId}
                            className="border-b border-border align-middle last:border-0 hover:bg-muted/40"
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedRows.includes(row.rowId)}
                                onCheckedChange={(checked) =>
                                  setSelectedRows((current) =>
                                    checked
                                      ? [...current, row.rowId]
                                      : current.filter((id) => id !== row.rowId)
                                  )
                                }
                                aria-label="Seleccionar fila"
                              />
                            </td>
                            <td className="max-w-[230px] px-3 py-3">
                              {renderCollaboratorField(row)}
                            </td>
                            <td className="w-[185px] px-3 py-3">
                              <SelectField
                                value={row.zoneId}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'zoneId', value)
                                }
                                placeholder="Seleccionar…"
                              >
                                {(workspace?.zones ?? []).map((zone) => (
                                  <SelectItem
                                    key={zone.zoneId}
                                    value={String(zone.zoneId)}
                                  >
                                    <ZoneOption zone={zone} />
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </td>
                            <td className="w-[165px] px-3 py-3">
                              <SelectField
                                value={row.role}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'role', value)
                                }
                                placeholder="Seleccionar…"
                              >
                                {roleOptionsFor(row).map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </td>
                            <td className="w-[205px] px-3 py-3">
                              <SelectField
                                value={row.defaultShiftId}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'defaultShiftId', value)
                                }
                                placeholder="Seleccionar…"
                              >
                                {(workspace?.shifts ?? []).map((shift) => (
                                  <SelectItem
                                    key={shift.shiftId}
                                    value={String(shift.shiftId)}
                                    disabled={
                                      !shift.isActive &&
                                      Number(row.defaultShiftId) !==
                                        Number(shift.shiftId)
                                    }
                                  >
                                    {shiftLabel(shift)}
                                    {!shift.isActive ? ' · inactivo' : ''}
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </td>
                            <td className="px-3 py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  !row.defaultShiftId ||
                                  !workspace?.event?.dates?.length
                                }
                                onClick={() => openOverrides(row)}
                                className="gap-1.5 whitespace-nowrap"
                              >
                                <CalendarDays className="h-3.5 w-3.5" />
                                {row.dailyOverrides?.length
                                  ? `${row.dailyOverrides.length} cambio${
                                      row.dailyOverrides.length === 1 ? '' : 's'
                                    }`
                                  : 'Sin cambios'}
                              </Button>
                            </td>
                            <td className="px-3 py-3">
                              {renderAssignmentStatus(row)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => copyRowConfiguration(row)}
                                  className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                  aria-label="Copiar configuración de la fila"
                                  title="Copiar configuración"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeRow(row.rowId)}
                                  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                  aria-label="Eliminar asignación"
                                  title="Eliminar asignación"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  </table>
                </div>
                <div className="bg-muted/20 p-3 md:hidden">
                  {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
                      <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-3 font-semibold text-foreground">
                        {hasAssignmentCriteria
                          ? 'No se encontraron asignaciones'
                          : 'Aún no hay personas en esta tabla'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasAssignmentCriteria
                          ? 'Prueba con otro nombre, cédula o filtro.'
                          : 'Usa el buscador superior para agregar la primera asignación.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleRows.map((row) => (
                        <article
                          key={row.rowId}
                          className="rounded-xl border border-border bg-card p-3.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <Checkbox
                                checked={selectedRows.includes(row.rowId)}
                                onCheckedChange={(checked) =>
                                  setSelectedRows((current) =>
                                    checked
                                      ? [...current, row.rowId]
                                      : current.filter(
                                          (id) => id !== row.rowId
                                        )
                                  )
                                }
                                className="mt-1"
                                aria-label="Seleccionar fila"
                              />
                              <div className="min-w-0 flex-1">
                                {row.user ? (
                                  <>
                                    <p className="truncate text-sm font-bold text-foreground">
                                      {row.user.firstName} {row.user.lastName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      CC {row.user.cedula}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    Colaborador pendiente
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-start gap-1">
                              {renderAssignmentStatus(row)}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => copyRowConfiguration(row)}
                                className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                aria-label="Copiar configuración de la fila"
                                title="Copiar configuración"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeRow(row.rowId)}
                                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                aria-label="Eliminar asignación"
                                title="Eliminar asignación"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!row.user && (
                            <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
                              {renderCollaboratorField(row)}
                            </div>
                          )}

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs font-semibold text-muted-foreground">
                              Zona
                              <SelectField
                                value={row.zoneId}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'zoneId', value)
                                }
                                placeholder="Seleccionar zona…"
                                className="mt-1.5 w-full"
                              >
                                {(workspace?.zones ?? []).map((zone) => (
                                  <SelectItem
                                    key={zone.zoneId}
                                    value={String(zone.zoneId)}
                                  >
                                    <ZoneOption zone={zone} />
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </label>
                            <label className="block text-xs font-semibold text-muted-foreground">
                              Rol
                              <SelectField
                                value={row.role}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'role', value)
                                }
                                placeholder="Seleccionar rol…"
                                className="mt-1.5 w-full"
                              >
                                {roleOptionsFor(row).map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </label>
                            <label className="block text-xs font-semibold text-muted-foreground sm:col-span-2">
                              Turno predeterminado
                              <SelectField
                                value={row.defaultShiftId}
                                onValueChange={(value) =>
                                  updateRow(row.rowId, 'defaultShiftId', value)
                                }
                                placeholder="Seleccionar turno…"
                                className="mt-1.5 w-full"
                              >
                                {(workspace?.shifts ?? []).map((shift) => (
                                  <SelectItem
                                    key={shift.shiftId}
                                    value={String(shift.shiftId)}
                                    disabled={
                                      !shift.isActive &&
                                      Number(row.defaultShiftId) !==
                                        Number(shift.shiftId)
                                    }
                                  >
                                    {shiftLabel(shift)}
                                    {!shift.isActive ? ' · inactivo' : ''}
                                  </SelectItem>
                                ))}
                              </SelectField>
                            </label>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              !row.defaultShiftId ||
                              !workspace?.event?.dates?.length
                            }
                            onClick={() => openOverrides(row)}
                            className="mt-3 w-full justify-center gap-1.5"
                          >
                            <CalendarDays className="h-3.5 w-3.5" />
                            {row.dailyOverrides?.length
                              ? `${row.dailyOverrides.length} cambio${
                                  row.dailyOverrides.length === 1 ? '' : 's'
                                } por fecha`
                              : 'Configurar turnos por fecha'}
                          </Button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                {tableLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 px-4 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2.5 rounded-full border border-border bg-card/95 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg">
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      <span>Actualizando asignaciones…</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">
                    {assignmentTotal === 0 ? 0 : (safePage - 1) * pageSize + 1}–
                    {Math.min(safePage * pageSize, assignmentTotal)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">
                    {assignmentTotal}
                  </span>{' '}
                  asignaciones
                </span>
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <SelectField
                  value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  className="w-[125px] sm:w-[125px]"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} / página
                      </SelectItem>
                    ))}
                  </SelectField>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage <= 1 || tableLoading}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[4rem] text-center tabular-nums text-muted-foreground">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage >= totalPages || tableLoading}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground">
                  Una persona conserva su zona durante todo el evento. Solo el
                  turno puede cambiar por fecha.
                </p>
                <Button
                  onClick={saveAssignments}
                  disabled={saving || !rows.length}
                  aria-busy={saving}
                  className="min-w-[190px] justify-center gap-2 bg-primary px-5 text-primary-foreground transition-all hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Guardando…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Guardar asignaciones</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>

      <AssignmentFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={(filters) => {
          setAssignmentFilters(filters);
          setPage(1);
        }}
        activeFilters={assignmentFilters}
        zones={workspace?.zones ?? []}
        shifts={workspace?.shifts ?? []}
      />

      <Dialog
        open={Boolean(overrideRow)}
        onOpenChange={(open) => !open && setOverrideRowId(null)}
      >
          <DialogContent className="max-h-[90vh] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Turnos por fecha</DialogTitle>
            <DialogDescription>
              {overrideRow?.user?.firstName} {overrideRow?.user?.lastName} ·
              Elige solo los días que cambian del turno predeterminado.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto py-2">
            {(workspace?.event?.dates ?? []).map((date) => (
              <div
                key={date}
                className="flex flex-col items-stretch gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(date)}
                  </p>
                  <p className="text-xs text-muted-foreground">{date}</p>
                </div>
                <SelectField
                  value={overrideDraft[date] ?? ''}
                  onValueChange={(value) =>
                    setOverrideDraft((current) => ({
                      ...current,
                      [date]: value === '__default__' ? '' : value,
                    }))
                  }
                  placeholder="Usar predeterminado"
                  className="w-full sm:max-w-[240px]"
                >
                  <SelectItem value="__default__">
                    Usar predeterminado
                  </SelectItem>
                  {(workspace?.shifts ?? [])
                    .filter(
                      (shift) =>
                        shift.isActive ||
                        String(shift.shiftId) === String(overrideDraft[date])
                    )
                    .map((shift) => (
                      <SelectItem
                        key={shift.shiftId}
                        value={String(shift.shiftId)}
                      >
                        {shiftLabel(shift)}
                      </SelectItem>
                    ))}
                </SelectField>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOverrideRowId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={saveOverrides}
              className="bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            >
              Aplicar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(shiftEditor)}
        onOpenChange={(open) => !open && setShiftEditor(null)}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {shiftEditor?.id ? 'Editar turno' : 'Nuevo turno'}
            </DialogTitle>
            <DialogDescription>
              El nombre es obligatorio. El horario ayuda a informar, pero no
              bloquea cruces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block text-sm font-medium">
              Nombre del turno
              <Input
                value={shiftEditor?.name ?? ''}
                onChange={(event) =>
                  setShiftEditor((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="mt-1.5"
                placeholder="Ej. Diurno, Noche, Montaje"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Hora desde
                <TimeSelect
                  value={shiftEditor?.startTime ?? ''}
                  onValueChange={(value) =>
                    setShiftEditor((current) => ({
                      ...current,
                      startTime: value,
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Hora hasta
                <TimeSelect
                  value={shiftEditor?.endTime ?? ''}
                  onValueChange={(value) =>
                    setShiftEditor((current) => ({
                      ...current,
                      endTime: value,
                    }))
                  }
                />
              </label>
            </div>
            {shiftEditor?.id && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={shiftEditor.isActive}
                  onCheckedChange={(checked) =>
                    setShiftEditor((current) => ({
                      ...current,
                      isActive: checked,
                    }))
                  }
                />{' '}
                Turno activo
              </label>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShiftEditor(null)}>
              Cancelar
            </Button>
            <Button
              onClick={saveShift}
              disabled={shiftSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {shiftSaving ? 'Guardando…' : 'Guardar turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Eliminar asignación</DialogTitle>
            <DialogDescription>
              Esta acción quedará registrada en el historial y no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="font-semibold text-foreground">
              {deleteTarget?.user?.firstName} {deleteTarget?.user?.lastName}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              CC {deleteTarget?.user?.cedula}
            </p>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveRow}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleting ? 'Eliminando…' : 'Eliminar asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
