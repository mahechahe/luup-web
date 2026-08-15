import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { getAttendanceRecordsService } from '../../services/eventServices';
import { AttendanceTimelineModal } from '../components/AttendanceTimelineModal';
import { PaginationControls } from '../components/PaginationControls';
import { Station2Tab } from '../components/Station2Tab';
import { StationLayout } from '../components/StationLayout';
import { useStationList } from '../hooks/useStationList';
import { STAGES } from '../utils/stages';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const Section2 = ({
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

  const [timelineTarget, setTimelineTarget] = useState(null);

  const {
    collaborators,
    updateAttendance,
    loading,
    error,
    refresh,
    filters,
    page,
  } = useStationList({
    eventId,
    fetcher: getAttendanceRecordsService,
    dateRegister,
    shiftId,
  });

  const handleActionSaved = (userId, type, typeSnack, received = true) => {
    if (type === 'suitcase') {
      updateAttendance(userId, { receivedSuitcase: received });
    } else if (type === 'lunch') {
      updateAttendance(userId, { receivedLunch: received });
    } else if (type === 'snack') {
      updateAttendance(userId, {
        receivedSnack: received,
        snackDetail: received ? typeSnack : null,
      });
    } else if (type === 'confirm') {
      // El paso es la fuente de verdad; `confirmStation2` se mantiene hasta
      // que la columna se elimine del API.
      updateAttendance(userId, {
        stage: STAGES.ESTACION_3,
        confirmStation2: true,
      });
      onStageChanged?.();
    }
  };

  return (
    <StationLayout
      station="Estación 2"
      title="Maleta · Almuerzo · Refrigerio"
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
      {/* Alerta informativa */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-semibold">Importante:</span> Para que un
          colaborador pase a la{' '}
          <span className="font-semibold">Estación 3</span>, debe tener marcado
          el <span className="font-semibold">Refrigerio</span> y tener la{' '}
          <span className="font-semibold">asignación confirmada</span>.
        </p>
      </div>

      <PaginationControls page={page} />

      <Station2Tab
        collaborators={collaborators}
        loading={loading}
        isAdmin={isAdmin}
        onActionSaved={handleActionSaved}
        onTimeline={setTimelineTarget}
      />

      <AttendanceTimelineModal
        open={!!timelineTarget}
        onOpenChange={(v) => {
          if (!v) setTimelineTarget(null);
        }}
        collab={timelineTarget}
      />

      <div className="pb-4">
        <PaginationControls page={page} pageSizeOptions={PAGE_SIZE_OPTIONS} />
      </div>
    </StationLayout>
  );
};
