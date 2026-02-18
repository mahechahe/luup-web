import {
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
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-muted rounded-full w-24" />
        </td>
      ))}
    </tr>
  );
}

const COLUMNS = [
  'Nombre',
  'Documento',
  'Email',
  'Edad',
  'Género',
  'Celular',
  'Fecha Creación',
  'Acciones',
];

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
  
const handleDelete = async (u) => {
  if (window.confirm(`¿Estás seguro de eliminar a ${u.firstName} ${u.lastName}?`)) {
    try {
      const res = await ColabServices.deleteCollaboratorService(u.userId);
      
      if (res.status) {
        toast.success('Colaborador eliminado correctamente');
        
        // --- LA CLAVE ESTÁ AQUÍ ---
        // Volvemos a pedir los datos a la API para que la tabla se refresque
        await fetchData(pagination.page, activeFilters); 
        
      } else {
        toast.error(res.errors || 'No se pudo eliminar');
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    }
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
            <CardTitle className="text-sm font-semibold">
              {loading ? 'Cargando...' : `${pagination.total} registros encontrados`}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                        {col}
                      </th>
                    ))}
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
                          <span className="font-semibold text-foreground block">{u.firstName}</span>
                          <span className="text-xs text-muted-foreground">{u.lastName}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant="outline" className="mr-2">{u.documentType?.code || 'CC'}</Badge>
                          <span className="text-xs">{u.username}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{u.email ?? '—'}</td>
                        <td className="px-4 py-3.5 font-medium">{u.age ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <Badge className={`text-xs font-medium border-0 ${genderBadgeClass(u.gender)}`}>
                            {genderLabel(u.gender)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{u.phone}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-brand" onClick={() => { setSelectedCollaborator(u); setEditDrawerOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-sky-600" onClick={() => navigate(`/colaboradores/${u.userId}`)}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-red-500" onClick={() => handleDelete(u)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación - Selector OVALADO, NARANJA, Letras NEGRAS y Hover GRIS */}
            {!loading && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Mostrando {users.length} de {pagination.total}</span>
                  
                  <div className="relative group">
                    <select 
                      value={pagination.limit} 
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="appearance-none bg-transparent border border-brand text-black rounded-full px-4 py-1.5 pr-8 outline-none cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    >
                      <option value={10}>10 filas</option>
                      <option value={25}>25 filas</option>
                      <option value={50}>50 filas</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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