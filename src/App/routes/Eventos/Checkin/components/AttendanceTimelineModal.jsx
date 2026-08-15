import { useEffect, useState } from 'react';
import { CornerUpLeft, History, Loader2, MoveRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatColombiaTime,
  formatDuration,
} from '@/App/utils/functions/colombiaDate';
import { getAttendanceLogService } from '../../services/eventServices';
import { stageMeta, stageOrder } from '../utils/stages';

/** Etiqueta legible de las acciones que no son cambio de paso. */
const ACTION_LABELS = {
  created: 'Registro creado',
  check_in: 'Check-in',
  check_out: 'Check-out',
  uniform_assigned: 'Uniforme asignado',
  inventory_confirmed: 'Inventario confirmado',
  station_2_confirmed: 'Estación 2 confirmada',
  updated: 'Actualización',
};

/**
 * Traducción del nombre de columna que llega crudo desde la BD (snake_case,
 * en inglés). Solo se muestra junto a la acción "Actualización", donde da
 * información real; para el resto de acciones (check_in, uniform_assigned…)
 * el nombre del campo es redundante con la acción y se omite.
 */
const FIELD_LABELS = {
  attended: 'asistencia',
  notes: 'notas',
  entry_time: 'hora de entrada',
  exit_time: 'hora de salida',
  uniform: 'uniforme',
  uniform_size: 'talla de uniforme',
  received_suitcase: 'maleta',
  received_lunch: 'almuerzo',
  received_snack: 'refrigerio',
  snack_detail: 'detalle de refrigerio',
  date_register: 'fecha',
};

function StageMove({ entry }) {
  const isRevert =
    entry.from && entry.to && stageOrder(entry.to) < stageOrder(entry.from);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isRevert && <CornerUpLeft className="w-3 h-3 text-[#DD7419] shrink-0" />}
      <span className="text-[11px] font-semibold text-muted-foreground">
        {stageMeta(entry.from).short}
      </span>
      <MoveRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-[11px] font-bold text-foreground">
        {stageMeta(entry.to).short}
      </span>
    </div>
  );
}

/**
 * Bitácora de un colaborador en una jornada: por qué estaciones pasó, a qué
 * hora, quién lo movió y cuánto esperó en cada una.
 */
export function AttendanceTimelineModal({ open, onOpenChange, collab }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const attendanceId = collab?.attendance?.id;

  useEffect(() => {
    if (!open || !attendanceId) return;

    setLoading(true);
    getAttendanceLogService(attendanceId).then((res) => {
      setTimeline(res.status ? res.data?.timeline ?? [] : []);
      setLoading(false);
    });
  }, [open, attendanceId]);

  if (!collab) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4 text-[#DD7419]" />
            Bitácora de la jornada
          </DialogTitle>
          <DialogDescription>
            {collab.firstName} {collab.lastName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-foreground">
              Sin movimientos registrados
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aún no ha pasado por ninguna estación en esta jornada.
            </p>
          </div>
        ) : (
          <ol className="space-y-0 mt-1">
            {timeline.map((entry, idx) => {
              const isStageChange = entry.action === 'stage_changed';
              const isLast = idx === timeline.length - 1;

              return (
                <li key={entry.id} className="flex gap-3">
                  {/* Línea de tiempo */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        isStageChange
                          ? 'bg-[#DD7419]'
                          : 'bg-muted-foreground/40'
                      }`}
                    />
                    {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                  </div>

                  <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-4'}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      {isStageChange ? (
                        <StageMove entry={entry} />
                      ) : (
                        <span className="text-[11px] font-semibold text-foreground">
                          {ACTION_LABELS[entry.action] ?? 'Actualización'}
                          {entry.action === 'updated' &&
                            FIELD_LABELS[entry.fieldName] && (
                              <span className="font-normal text-muted-foreground">
                                {' '}
                                · {FIELD_LABELS[entry.fieldName]}
                              </span>
                            )}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                        {formatColombiaTime(entry.at)}
                      </span>
                    </div>

                    {entry.secondsInPreviousStage != null && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Esperó {formatDuration(entry.secondsInPreviousStage)} en{' '}
                        {stageMeta(entry.from).short}
                      </p>
                    )}

                    {entry.performedBy && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Por {entry.performedBy.name}
                      </p>
                    )}

                    {entry.reason && (
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 mt-1.5 italic">
                        <span className="font-semibold not-italic">
                          Motivo:{' '}
                        </span>
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
