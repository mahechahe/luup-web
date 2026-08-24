import { useState } from 'react';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { getEventAttendanceService } from '../../services/eventServices';
import AttendanceEditModal from '../AttendanceEditModal';
import { AttendanceTimelineModal } from '../components/AttendanceTimelineModal';
import { PaginationControls } from '../components/PaginationControls';
import { StationLayout } from '../components/StationLayout';
import { Station1Tab } from '../components/Station1Tab';
import { useStationList } from '../hooks/useStationList';

export const Section1 = ({
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

  const [editTarget, setEditTarget] = useState(null);
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
    fetcher: getEventAttendanceService,
    dateRegister,
    shiftId,
  });

  const handleAttendanceUpdated = (userId, attendance) => {
    updateCollaborator(userId, (c) => ({
      ...c,
      attendance,
      stage: attendance?.stage ?? c.stage,
    }));
    onStageChanged?.();
  };

  const handleUniformSaved = (userId, size) => {
    updateCollaborator(userId, (c) => ({
      ...c,
      uniform: !!size,
      uniformSize: size || null,
    }));
  };

  return (
    <StationLayout
      station="Estación 1"
      title="Check-in"
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
      <PaginationControls page={page} />

      <Station1Tab
        collaborators={collaborators}
        loading={loading}
        eventId={eventId}
        dateRegister={dateRegister}
        isAdmin={isAdmin}
        onAttendanceUpdated={handleAttendanceUpdated}
        onUniformSaved={handleUniformSaved}
        onEdit={isAdmin ? setEditTarget : undefined}
        onTimeline={setTimelineTarget}
      />

      <div className="pb-4">
        <PaginationControls page={page} />
      </div>

      <AttendanceTimelineModal
        open={!!timelineTarget}
        onOpenChange={(v) => {
          if (!v) setTimelineTarget(null);
        }}
        collab={timelineTarget}
      />

      <AttendanceEditModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        collaborator={editTarget}
        eventId={eventId}
        onUpdated={handleAttendanceUpdated}
        onUniformSaved={handleUniformSaved}
      />
    </StationLayout>
  );
};
