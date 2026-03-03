import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
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

import { BulkUploadDrawer } from './components/BulkUploadDrawer';
import { CreateCollaboratorDrawer } from './components/CreateCollaboratorDrawer';
import { EditCollaboratorDrawer } from './components/EditCollaboratorDrawer';
import { FilterDrawer } from './components/FilterDrawer';

import * as ColabServices from './services/collaboratorServices';

const DEFAULT_LIMIT = 10;
const EMPTY_FILTERS = { firstName: '', email: '', phone: '', username: '', gender: '' };

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
  const map = { male: 'Masculino', female: 'Femenino', other: 'Otro' };
  return map[gender] ?? 'Sin preferencia';
}

function genderBadgeClass(gender) {
  if (gender === 'female') return 'bg-pink-100 text-pink-700 hover:bg-pink-100';
  if (gender === 'male') return 'bg-sky-100 text-sky-700 hover:bg-sky-100';
  return 'bg-muted text-muted-foreground hover:bg-muted';
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-muted rounded-full w-24 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-16" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-24" /></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-32" /></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-8" /></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-16" /></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-24" /></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3.5 bg-muted rounded-full w-20" /></td>
      <td className="px-4 py-3.5"><div className="h-8 bg-muted rounded-md w-20" /></td>
    </tr>
  );
}

/* ── Modal de confirmación ───────────────────────────────── */
function DeleteConfirmModal({ collaborator, onConfirm, onCancel, loading }) {
  if (!collaborator) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Ícono */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>

        {/* Texto */}
        <div>
          <h3 className="text-lg font-bold text-foreground">¿Eliminar colaborador?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Estás a punto de eliminar a{' '}
            <span className="font-semibold text-foreground">
              {collaborator.firstName} {collaborator.lastName}
            </span>
            . Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 w-full mt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </div>
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

  const fetchData = useCallback(async (page, filters, currentLimit = pagination.limit) => {
    setLoading(true);
    try {
      const body = {
        page,
        limit: currentLimit,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
      };
      const res = await ColabServices.getColaboradoresService(body);
      if (res.status) {
        setUsers(res.users || []);
        setPagination(res.pagination || { page: 1, limit: currentLimit, total: 0, totalPages: 1 });
      } else {
        toast.error(res.errors ?? 'Error al cargar colaboradores.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

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
      const res = await ColabServices.deleteCollaboratorService(collaboratorToDelete.userId);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">Colaboradores</h2>
            </div>
            <p className="text-sm text-muted-foreground">Gestiona el equipo de trabajo de LUUP.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 h-9" onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4" /> Crear colaborador
            </Button>
            <Button variant="outline" className="gap-1.5 h-9" onClick={() => setBulkUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Carga masiva
            </Button>
            <Button
              variant="outline"
              className={`gap-1.5 h-9 ${hasActiveFilter ? 'border-brand text-brand bg-brand/5' : ''}`}
              onClick={() => setDrawerOpen(true)}
            >
              <Filter className="w-4 h-4" /> Filtrar
            </Button>
            {hasActiveFilter && (
              <Button variant="ghost" className="gap-1.5 h-9 text-muted-foreground" onClick={() => { setActiveFilters(EMPTY_FILTERS); fetchData(1, EMPTY_FILTERS); }}>
                <X className="w-4 h-4" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardHeader className="px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {loading ? (
                <div className="h-4 w-32 bg-muted rounded-full animate-pulse" />
              ) : (
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">{pagination.total}</span>{' '}
                  colaborador{pagination.total !== 1 ? 'es' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">Nombre</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Documento</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Edad</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Género</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Celular</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">Fecha Creación</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-muted-foreground">No se encontraron datos.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.userId} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">{u.firstName} {u.lastName}</span>
                          {u.phone && (
                            <span className="text-xs text-muted-foreground md:hidden block mt-0.5">{u.phone}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
                          <Badge variant="outline" className="mr-2">{u.documentType?.code || 'CC'}</Badge>
                          <span className="text-xs">{u.username}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{u.email ?? '—'}</td>
                        <td className="px-4 py-3.5 font-medium hidden md:table-cell">{u.age ?? '—'}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <Badge className={`text-xs font-medium border-0 ${genderBadgeClass(u.gender)}`}>
                            {genderLabel(u.gender)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{u.phone}</td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" className="h-8 px-2 md:px-3 text-brand" onClick={() => { setSelectedCollaborator(u); setEditDrawerOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">Editar</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2 md:px-3 text-sky-600" onClick={() => navigate(`/colaboradores/${u.userId}`)}>
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">Ver</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2 md:px-3 text-red-500" onClick={() => handleDeleteClick(u)}>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">Eliminar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                    –{Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">{pagination.total}</span>{' '}
                  registros
                </span>

                {/* Controles */}
                <div className="flex items-center gap-3">
                  {/* Filas por página */}
                  <div className="relative">
                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
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

      <BulkUploadDrawer open={bulkUploadOpen} onClose={() => setBulkUploadOpen(false)} onSuccess={() => fetchData(1, activeFilters)} />
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onApply={(f) => { setActiveFilters(f); fetchData(1, f); }} activeFilters={activeFilters} />
      <CreateCollaboratorDrawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} onSuccess={() => fetchData(1, activeFilters)} />
      {selectedCollaborator && (
        <EditCollaboratorDrawer
          open={editDrawerOpen}
          onClose={() => { setEditDrawerOpen(false); setSelectedCollaborator(null); }}
          onSuccess={() => fetchData(pagination.page, activeFilters)}
          collaborator={selectedCollaborator}
        />
      )}
    </div>
  );
}

export default ColaboradoresPage;