import { useState } from 'react';
import {
  Boxes,
  Loader2,
  PackageOpen,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import {
  confirmInventoryService,
  getStation3RecordsService,
} from '../../services/eventServices';
import { deleteInventoryAssignmentService } from '../../services/inventoryServices';
import { AttendanceTimelineModal } from '../components/AttendanceTimelineModal';
import { CollabCardSkeletonList } from '../components/CollabCardSkeleton';
import { EditInventoryItemModal } from '../components/EditInventoryItemModal';
import { InventoryModal } from '../components/InventoryModal';
import { PaginationControls } from '../components/PaginationControls';
import { RevertStageModal } from '../components/RevertStageModal';
import { Station3CollabCard } from '../components/Station3CollabCard';
import { StationLayout } from '../components/StationLayout';
import { useStationList } from '../hooks/useStationList';
import { STAGES, getStage } from '../utils/stages';

export const Section3 = ({
  eventId,
  dateRegister,
  day,
  isToday,
  shiftId,
  shiftOptions,
  onShiftChange,
  onStageChanged,
}) => {
  const { user } = useUserStore();
  const isAdmin = hasAdminAccess(user?.roleId);

  const [showInventory, setShowInventory] = useState(false);
  const [assignCollab, setAssignCollab] = useState(null);
  const [addMoreCollab, setAddMoreCollab] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { collabUserId, itemId, itemName }
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { collabUserId, item }
  const [revertTarget, setRevertTarget] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);

  const {
    collaborators,
    updateCollaborator,
    updateAttendance,
    loading,
    error,
    refresh,
    filters,
    page,
  } = useStationList({
    eventId,
    fetcher: getStation3RecordsService,
    dateRegister,
    shiftId,
  });

  const addItemTo = (userId, newItem) => {
    updateCollaborator(userId, (c) => ({
      ...c,
      inventoryItems: [...(c.inventoryItems ?? []), newItem],
    }));
  };

  const handleAssigned = (newItem) => {
    addItemTo(assignCollab?.userId, newItem);
    setAssignCollab(null);
  };

  const handleAdded = (newItem) => {
    addItemTo(addMoreCollab?.userId, newItem);
    setAddMoreCollab(null);
  };

  const handleConfirmInventory = async () => {
    if (!confirmTarget) return;
    setConfirming(true);
    const res = await confirmInventoryService(confirmTarget.attendance?.id);
    setConfirming(false);

    if (res.status) {
      toast.success('Inventario confirmado exitosamente');
      updateAttendance(confirmTarget.userId, {
        stage: STAGES.ESTACION_4,
        confirmInventory: true,
      });
      onStageChanged?.();
      setConfirmTarget(null);
    } else {
      toast.error(res.errors ?? 'Error al confirmar el inventario');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteInventoryAssignmentService(deleteTarget.itemId);
    setDeleting(false);

    if (res.status) {
      toast.success('Asignación eliminada');
      updateCollaborator(deleteTarget.collabUserId, (c) => ({
        ...c,
        inventoryItems: c.inventoryItems.filter(
          (i) => i.id !== deleteTarget.itemId
        ),
      }));
      setDeleteTarget(null);
    } else {
      toast.error(res.errors ?? 'Error al eliminar la asignación');
    }
  };

  const handleItemUpdated = ({ collaboratorItemId, ...quantities }) => {
    updateCollaborator(editTarget?.collabUserId, (c) => ({
      ...c,
      inventoryItems: c.inventoryItems.map((i) =>
        i.id !== collaboratorItemId ? i : { ...i, ...quantities }
      ),
    }));
    setEditTarget(null);
  };

  // Al devolver, la persona sale de esta lista en el siguiente refresco.
  const handleReverted = (userId, to) => {
    updateAttendance(userId, { stage: to });
    onStageChanged?.();
    refresh();
  };

  const hasResults = !loading && collaborators.length > 0;

  return (
    <StationLayout
      station="Estación 3"
      title="Dotación · Insumos"
      loading={loading}
      error={error}
      onRefresh={refresh}
      filters={filters}
      shiftId={shiftId}
      shiftOptions={shiftOptions}
      onShiftChange={onShiftChange}
      day={day}
      isToday={isToday}
    >
      {/* Acceso al inventario */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#DD7419]/20 bg-[#DD7419]/5 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4 text-[#DD7419]" />
          </div>
          <p className="text-xs text-[#DD7419] leading-relaxed">
            Puedes ver el inventario disponible y filtrarlo por nombre antes de
            asignarlo a un colaborador.
          </p>
        </div>
        <Button
          onClick={() => setShowInventory(true)}
          className="shrink-0 h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-2 text-xs font-semibold"
        >
          <Boxes className="w-3.5 h-3.5" />
          Ver inventario
        </Button>
      </div>

      {hasResults && <PaginationControls page={page} />}

      {/* Lista */}
      {loading ? (
        <CollabCardSkeletonList count={4} />
      ) : collaborators.length === 0 ? (
        <div className="text-center py-14 flex flex-col justify-center items-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Sin registros en Estación 3
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Los colaboradores aparecerán aquí una vez tengan el refrigerio
            marcado en Estación 2.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <Station3CollabCard
              key={collab.userId}
              collab={collab}
              isAdmin={isAdmin}
              onAssign={setAssignCollab}
              onRequestConfirm={setConfirmTarget}
              onAddMore={setAddMoreCollab}
              onDeleteItem={setDeleteTarget}
              onEditItem={setEditTarget}
              onRevert={setRevertTarget}
              onTimeline={setTimelineTarget}
            />
          ))}
        </div>
      )}

      {/* Confirmación de asignación */}
      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(v) => {
          if (!v) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#234465]/10 dark:bg-[#7493B2]/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#234465] dark:text-[#7493B2]" />
              </div>
              <AlertDialogTitle className="text-base leading-snug">
                ¿Confirmar asignación de inventario?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Vas a confirmar el inventario asignado a{' '}
                  <span className="font-semibold text-foreground">
                    {confirmTarget?.firstName} {confirmTarget?.lastName}
                  </span>
                  .
                </p>
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                  <span className="text-amber-500 text-base leading-none mt-0.5">
                    ⚠
                  </span>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <span className="font-semibold">
                      Esta acción es irreversible.
                    </span>{' '}
                    Una vez confirmado, no podrás editar el inventario ni
                    asignar nuevos ítems a este colaborador.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={confirming}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmInventory();
              }}
              disabled={confirming}
              className="bg-[#234465] hover:bg-[#234465]/90 text-white dark:bg-[#7493B2] dark:hover:bg-[#7493B2]/90 dark:text-white"
            >
              {confirming ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Confirmando…
                </span>
              ) : (
                'Sí, confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de eliminación de ítem */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <AlertDialogTitle className="text-base leading-snug">
                ¿Eliminar esta asignación?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Vas a eliminar el ítem{' '}
                  <span className="font-semibold text-foreground">
                    {deleteTarget?.itemName}
                  </span>{' '}
                  de la asignación pendiente.
                </p>
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
                  <span className="text-red-500 text-base leading-none mt-0.5">
                    ⚠
                  </span>
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    Esta acción no se puede deshacer. El ítem volverá al
                    inventario disponible.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteItem();
              }}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Eliminando…
                </span>
              ) : (
                'Sí, eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal editar ítem — registrar devolución parcial */}
      <EditInventoryItemModal
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        item={editTarget?.item ?? null}
        onUpdated={handleItemUpdated}
      />

      <AttendanceTimelineModal
        open={!!timelineTarget}
        onOpenChange={(v) => {
          if (!v) setTimelineTarget(null);
        }}
        collab={timelineTarget}
      />

      {/* Devolver a la estación anterior */}
      <RevertStageModal
        open={!!revertTarget}
        onOpenChange={(v) => {
          if (!v) setRevertTarget(null);
        }}
        collab={revertTarget}
        stage={revertTarget ? getStage(revertTarget) : null}
        onReverted={handleReverted}
      />

      {/* Modal inventario — solo navegación */}
      <InventoryModal
        open={showInventory}
        onOpenChange={setShowInventory}
        eventId={eventId}
      />

      {/* Modal reasignación de inventario — solo admin, post-confirmación */}
      <InventoryModal
        open={!!addMoreCollab}
        onOpenChange={(v) => {
          if (!v) setAddMoreCollab(null);
        }}
        mode="assign"
        collab={addMoreCollab}
        eventId={eventId}
        onAssigned={handleAdded}
      />

      {/* Modal inventario — asignar a colaborador */}
      <InventoryModal
        open={!!assignCollab}
        onOpenChange={(v) => {
          if (!v) setAssignCollab(null);
        }}
        mode="assign"
        collab={assignCollab}
        eventId={eventId}
        onAssigned={handleAssigned}
      />

      {hasResults && (
        <div className="pb-4">
          <PaginationControls page={page} />
        </div>
      )}
    </StationLayout>
  );
};
