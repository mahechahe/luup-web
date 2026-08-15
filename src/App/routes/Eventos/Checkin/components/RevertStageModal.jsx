import { useEffect, useState } from 'react';
import { CornerUpLeft, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { changeAttendanceStageService } from '../../services/eventServices';
import { previousStage, stageMeta } from '../utils/stages';

/**
 * Devuelve a un colaborador a la estación anterior.
 *
 * El motivo es obligatorio: el API lo exige y queda en `event_attendance_log`,
 * así que después se puede saber quién devolvió a quién y por qué.
 */
export function RevertStageModal({
  open,
  onOpenChange,
  collab,
  stage,
  onReverted,
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const target = previousStage(stage);

  if (!collab || !target) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Indica el motivo de la devolución');
      return;
    }

    setSaving(true);
    const res = await changeAttendanceStageService({
      attendanceId: collab.attendance?.id,
      to: target,
      reason: reason.trim(),
    });
    setSaving(false);

    if (res.status) {
      toast.success(`Devuelto a ${stageMeta(target).short}`);
      onReverted(collab.userId, target);
      onOpenChange(false);
    } else {
      toast.error(res.errors ?? 'No se pudo devolver al colaborador');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CornerUpLeft className="w-4 h-4 text-[#DD7419]" />
            Devolver a {stageMeta(target).short}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">
              {collab.firstName} {collab.lastName}
            </span>{' '}
            volverá a {stageMeta(target).short} y saldrá de{' '}
            {stageMeta(stage).short}.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Motivo <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Ej: se confirmó por error a la persona equivocada"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Queda registrado con tu usuario y la hora.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !reason.trim()}
            className="flex-1 h-9 rounded-lg bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Devolver'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
