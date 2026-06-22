import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

import { BulkUploadDrawer } from './components/BulkUploadDrawer';
import { CreateCollaboratorDrawer } from './components/CreateCollaboratorDrawer';
import { EditCollaboratorDrawer } from './components/EditCollaboratorDrawer';
import { FilterDrawer } from './components/FilterDrawer';
import { ColaboradoresHeader } from './ui/ColaboradoresHeader';
import { ColaboradoresTable } from './ui/ColaboradoresTable';
import { PaginationFooter } from './ui/PaginationFooter';
import { DeleteConfirmModal } from './ui/DeleteConfirmModal';
import {
  formatDate,
  genderLabel,
  genderBadgeClass,
  activeBarClass,
} from './utils/colaboradoresUtils';

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
        <ColaboradoresHeader
          hasActiveFilter={hasActiveFilter}
          loading={loading}
          onCreate={() => setCreateDrawerOpen(true)}
          onBulk={() => setBulkUploadOpen(true)}
          onFilter={() => setDrawerOpen(true)}
          onRefresh={() => fetchData(pagination.page, activeFilters)}
          onClear={() => {
            setActiveFilters(EMPTY_FILTERS);
            fetchData(1, EMPTY_FILTERS);
          }}
        />

        <Card className="gap-0 overflow-hidden border-border p-0 shadow-sm">
          <ColaboradoresTable
            loading={loading}
            users={users}
            pagination={pagination}
            hasActiveFilter={hasActiveFilter}
            getRoleLabel={getRoleLabel}
            formatDate={formatDate}
            genderLabel={genderLabel}
            genderBadgeClass={genderBadgeClass}
            activeBarClass={activeBarClass}
            onEdit={(u) => {
              setSelectedCollaborator(u);
              setEditDrawerOpen(true);
            }}
            onView={(u) => navigate(`/colaboradores/${u.userId}`)}
            onDelete={(u) => handleDeleteClick(u)}
          />

          {!loading && (
            <PaginationFooter
              pagination={pagination}
              onLimitChange={handleLimitChange}
              onPageChange={handlePageChange}
            />
          )}
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
