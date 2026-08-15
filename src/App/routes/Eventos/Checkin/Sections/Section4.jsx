import { PackageOpen } from 'lucide-react';
import { useState } from 'react';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { getStation4RecordsService } from '../../services/eventServices';
import { AttendanceHistoryModal } from '../components/AttendanceHistoryModal';
import { AttendanceTimelineModal } from '../components/AttendanceTimelineModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { CollabCardSkeletonList } from '../components/CollabCardSkeleton';
import { PaginationControls } from '../components/PaginationControls';
import { RatingModal } from '../components/RatingModal';
import { RevertStageModal } from '../components/RevertStageModal';
import { Station4CollabCard } from '../components/Station4CollabCard';
import { StationLayout } from '../components/StationLayout';
import { useStationList } from '../hooks/useStationList';
import { STAGES, getStage } from '../utils/stages';

export const Section4 = ({
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

  const [checkoutCollab, setCheckoutCollab] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ratingCollab, setRatingCollab] = useState(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);

  const {
    collaborators,
    updateCollaborator,
    loading,
    error,
    refresh,
    filters,
    page,
  } = useStationList({
    eventId,
    fetcher: getStation4RecordsService,
    dateRegister,
    shiftId,
  });

  const handleOpenCheckout = (collab) => {
    setCheckoutCollab(collab);
    setCheckoutOpen(true);
  };

  const handleOpenRating = (collab) => {
    setRatingCollab(collab);
    setRatingOpen(true);
  };

  const handleCheckedOut = (userId, data) => {
    updateCollaborator(userId, (c) => ({
      ...c,
      attendance: {
        ...c.attendance,
        stage: STAGES.FINALIZADO,
        exitTime: data?.attendance?.exitTime ?? c.attendance?.exitTime,
        returnedUniform:
          data?.attendance?.returnedUniform ?? c.attendance?.returnedUniform,
      },
      inventoryItems: data?.items
        ? c.inventoryItems?.map((item) => {
            const updated = data.items.find(
              (d) => d.collaboratorItemId === item.id
            );
            return updated
              ? { ...item, returnedQuantity: updated.returned }
              : item;
          })
        : c.inventoryItems,
    }));
    onStageChanged?.();
  };

  const handleReverted = (userId, to) => {
    updateCollaborator(userId, (c) => ({
      ...c,
      attendance: { ...c.attendance, stage: to },
    }));
    onStageChanged?.();
    refresh();
  };

  const hasResults = !loading && collaborators.length > 0;

  return (
    <StationLayout
      station="Estación 4"
      title="Check-out"
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
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        collab={checkoutCollab}
        onCheckedOut={handleCheckedOut}
      />
      <AttendanceHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        eventId={Number(eventId)}
      />
      <RatingModal
        open={ratingOpen}
        onClose={() => {
          setRatingOpen(false);
          setRatingCollab(null);
        }}
        eventId={Number(eventId)}
        collab={ratingCollab}
        dateRegister={ratingCollab?.attendance?.dateRegister ?? null}
      />

      <AttendanceTimelineModal
        open={!!timelineTarget}
        onOpenChange={(v) => {
          if (!v) setTimelineTarget(null);
        }}
        collab={timelineTarget}
      />

      <RevertStageModal
        open={!!revertTarget}
        onOpenChange={(v) => {
          if (!v) setRevertTarget(null);
        }}
        collab={revertTarget}
        stage={revertTarget ? getStage(revertTarget) : null}
        onReverted={handleReverted}
      />

      {hasResults && <PaginationControls page={page} />}

      {/* Lista */}
      {loading ? (
        <CollabCardSkeletonList count={4} withPills />
      ) : collaborators.length === 0 ? (
        <div className="text-center py-14 flex flex-col justify-center items-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Sin registros de check-out
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Los colaboradores aparecerán aquí una vez estén registrados en las
            estaciones anteriores.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <Station4CollabCard
              key={collab.userId}
              collab={collab}
              onCheckout={isAdmin ? handleOpenCheckout : undefined}
              onRate={isAdmin ? handleOpenRating : undefined}
              onRevert={isAdmin ? setRevertTarget : undefined}
              onTimeline={setTimelineTarget}
            />
          ))}
        </div>
      )}

      {hasResults && (
        <div className="pb-4">
          <PaginationControls page={page} />
        </div>
      )}
    </StationLayout>
  );
};
