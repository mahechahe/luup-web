import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { BulkUploadDrawer } from './components/BulkUploadDrawer';
import { CreateCollaboratorDrawer } from './components/CreateCollaboratorDrawer';
import { EditCollaboratorDrawer } from './components/EditCollaboratorDrawer';
import { FilterDrawer } from './components/FilterDrawer';

import { getRoleLabel } from '@/App/utils/roles';
import * as ColabServices from './services/collaboratorServices';

const DEFAULT_LIMIT = 10;
const EMPTY_FILTERS = {
  firstName: '',
  email: '',
  phone: '',
  username: '',
  gender: '',
  isActive: '',
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function genderLabel(gender) {
  const map = { male: 'M', female: 'F', other: 'Otro' };
  return map[gender] ?? null;
}

function genderBadgeClass(gender) {
  if (gender === 'female') return 'bg-pink-100 text-pink-600 border-pink-200';
  if (gender === 'male') return 'bg-sky-100 text-sky-600 border-sky-200';
  return null;
}

function activeBarClass(isActive) {
  return isActive ? 'bg-emerald-500' : 'bg-red-400';
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="w-1 p-0"><div className="w-1 h-full bg-muted" /></td>
      <td className="px-4 py-3.5 min-w-[200px]">
        <div className="h-3.5 bg-muted rounded-full w-32 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-20" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-32 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-16" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-8 bg-muted rounded-md w-20" />
      </td>
    </tr>
  );
}

/* ── Fila del popover ────────────────────────────────────── */
function PopoverRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right break-all">
        {value ?? '—'}
      </span>
    </div>
  );
}

/* ── Modal de confirmación ───────────────────────────────── */
function DeleteConfirmModal({ collaborator, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={!!collaborator} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <DialogHeader className="items-center space-y-1">
            <DialogTitle>¿Eliminar colaborador?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar a{' '}
              <span className="font-semibold text-foreground">
                {collaborator?.firstName} {collaborator?.lastName}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="flex-row gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white border-0"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColaboradoresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);

  // Estado para el modal de confirmación
  const [collaboratorToDelete, setCollaboratorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasActiveFilter = Object.values(activeFilters).some((v) => v !== '');

  const fetchData = useCallback(
    async (page, filters, currentLimit = pagination.limit) => {
      setLoading(true);
      try {
        const body = {
          page,
          limit: currentLimit,
          ...Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== '')
          ),
        };
        const res = await ColabServices.getColaboradoresService(body);
        if (res.status) {
          setUsers(res.users || []);
          setPagination(
            res.pagination || {
              page: 1,
              limit: currentLimit,
              total: 0,
              totalPages: 1,
            }
          );
        } else {
          toast.error(res.errors ?? 'Error al cargar colaboradores.');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchData(1, EMPTY_FILTERS);
  }, [fetchData]);

  const handlePageChange = (newPage) => fetchData(newPage, activeFilters);
  const handleLimitChange = (newLimit) => fetchData(1, activeFilters, newLimit);

  // Abre el modal
  const handleDeleteClick = (u) => setCollaboratorToDelete(u);

  // Confirma y ejecuta el borrado
  const handleDeleteConfirm = async () => {
    if (!collaboratorToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await ColabServices.deleteCollaboratorService(
        collaboratorToDelete.userId
      );
      if (res.status) {
        toast.success('Colaborador eliminado correctamente');
        setCollaboratorToDelete(null);
        await fetchData(pagination.page, activeFilters);
      } else {
        toast.error(res.errors || 'No se pudo eliminar');
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-[#234465] px-6 py-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Gestión de personal
              </p>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Colaboradores
              </h2>
              <p className="text-sm text-white/60 mt-0.5">
                Gestiona el equipo de trabajo de LUUP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 h-9 font-semibold shadow-sm"
              onClick={() => setCreateDrawerOpen(true)}
            >
              <Plus className="w-4 h-4" /> Crear colaborador
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setBulkUploadOpen(true)}
            >
              <Upload className="w-4 h-4" /> Carga masiva
            </Button>
            <Button
              variant="outline"
              className={`gap-1.5 h-9 border-white/20 text-white hover:bg-white/20 hover:text-white ${
                hasActiveFilter
                  ? 'bg-[#DD7419]/30 border-[#DD7419]/60'
                  : 'bg-white/10'
              }`}
              onClick={() => setDrawerOpen(true)}
            >
              <Filter className="w-4 h-4" /> Filtrar
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => fetchData(pagination.page, activeFilters)}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />{' '}
              Actualizar
            </Button>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                className="gap-1.5 h-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => {
                  setActiveFilters(EMPTY_FILTERS);
                  fetchData(1, EMPTY_FILTERS);
                }}
              >
                <X className="w-4 h-4" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 h-12 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#234465]/10 dark:bg-white/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#234465] dark:text-white" />
              </div>
              {loading ? (
                <div className="h-4 w-36 bg-muted rounded-full animate-pulse" />
              ) : (
                <span className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">
                    {pagination.total}
                  </span>{' '}
                  colaborador{pagination.total !== 1 ? 'es' : ''} encontrado
                  {pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {hasActiveFilter && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                Filtros activos
              </span>
            )}
          </div>

          <CardContent className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="w-1 p-0 border-b border-border" />
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border min-w-[200px]">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-20 text-center text-muted-foreground"
                      >
                        No se encontraron datos.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isActive = u.isActive === 1 || u.isActive === true;
                      const gLabel = genderLabel(u.gender);
                      const gClass = genderBadgeClass(u.gender);
                      return (
                      <tr
                        key={u.userId}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        {/* Barra de estado — siempre visible */}
                        <td className={`w-1 p-0 ${activeBarClass(isActive)}`} />
                        <td className="px-4 py-3.5 min-w-[200px]">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-left group">
                                <span className="font-semibold text-foreground group-hover:underline block">
                                  {u.firstName} {u.lastName}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    {getRoleLabel(u.roleId)}
                                  </span>
                                  {gLabel && gClass && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${gClass}`}>
                                      {gLabel}
                                    </span>
                                  )}
                                  <span className={`md:hidden text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                  }`}>
                                    {isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0 overflow-hidden" align="start">
                              {/* Header del popover */}
                              <div className="bg-[#234465] px-4 py-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white text-sm truncate">{u.firstName} {u.lastName}</p>
                                  <p className="text-xs text-white/60 truncate">{getRoleLabel(u.roleId)}</p>
                                </div>
                                <span className={`ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                                }`}>
                                  {isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              {/* Cuerpo */}
                              <div className="px-4 py-3 space-y-2.5">
                                <PopoverRow label="Documento" value={`${u.documentType?.code || 'CC'} ${u.username}`} />
                                <PopoverRow label="Email" value={u.email} />
                                <PopoverRow label="Teléfono" value={u.phone} />
                                <PopoverRow label="Edad" value={u.age != null ? `${u.age} años` : null} />
                                <PopoverRow label="Género" value={
                                  u.gender === 'male' ? 'Masculino'
                                  : u.gender === 'female' ? 'Femenino'
                                  : u.gender === 'other' ? 'Otro'
                                  : null
                                } />
                                <PopoverRow label="Creado" value={formatDate(u.createdAt)} />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
                          <Badge variant="outline" className="mr-2">
                            {u.documentType?.code || 'CC'}
                          </Badge>
                          <span className="text-xs">{u.username}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-foreground block">
                            {u.email ?? '—'}
                          </span>
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {u.phone ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-brand"
                              onClick={() => {
                                setSelectedCollaborator(u);
                                setEditDrawerOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Editar
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-sky-600"
                              onClick={() =>
                                navigate(`/colaboradores/${u.userId}`)
                              }
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">Ver</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-red-500"
                              onClick={() => handleDeleteClick(u)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Eliminar
                              </span>
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

            {!loading && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-border">
                {/* Rango de registros */}
                <span className="text-xs text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">
                    {pagination.total === 0
                      ? 0
                      : (pagination.page - 1) * pagination.limit + 1}
                    –
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">
                    {pagination.total}
                  </span>{' '}
                  registros
                </span>

                {/* Controles */}
                <div className="flex items-center gap-3">
                  {/* Filas por página */}
                  <div className="relative">
                    <select
                      value={pagination.limit}
                      onChange={(e) =>
                        handleLimitChange(Number(e.target.value))
                      }
                      className="appearance-none bg-background border border-border text-sm text-foreground rounded-lg px-3 py-1.5 pr-7 outline-none cursor-pointer hover:border-brand focus:border-brand transition-colors"
                    >
                      <option value={10}>10 / página</option>
                      <option value={25}>25 / página</option>
                      <option value={50}>50 / página</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-muted-foreground" />
                  </div>

                  {/* Anterior / indicador / Siguiente */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 min-w-[4rem] text-center tabular-nums">
                      {pagination.page} / {Math.max(pagination.totalPages, 1)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        collaborator={collaboratorToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCollaboratorToDelete(null)}
        loading={deleteLoading}
      />

      <BulkUploadDrawer
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => fetchData(1, activeFilters)}
      />
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={(f) => {
          setActiveFilters(f);
          fetchData(1, f);
        }}
        activeFilters={activeFilters}
      />
      <CreateCollaboratorDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => fetchData(1, activeFilters)}
      />
      {selectedCollaborator && (
        <EditCollaboratorDrawer
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setSelectedCollaborator(null);
          }}
          onSuccess={() => fetchData(pagination.page, activeFilters)}
          collaborator={selectedCollaborator}
        />
      )}
    </div>
  );
}

export default ColaboradoresPage;
