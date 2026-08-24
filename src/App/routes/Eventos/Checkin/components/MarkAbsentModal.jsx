import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { upsertAttendanceService } from '@/App/routes/Eventos/services/eventServices';

/** Marca inasistencia con un motivo opcional. Acción rápida desde la tarjeta. */
export function MarkAbsentModal({
  open,
  onClose,
  collab,
  eventId,
  dateRegister,
  onUpdated,
}) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && collab) {
      setNotes(collab.attendance?.notes ?? '');
      setError(null);
    }
  }, [open, collab]);

  if (!collab) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      eventId: Number(eventId),
      userId: collab.userId,
      attended: false,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: notes.trim() || null,
      dateRegister: collab.attendance?.dateRegister ?? dateRegister,
    };

    const res = await upsertAttendanceService(body);
    if (res.status) {
      onUpdated(collab.userId, res.data?.data);
      onClose();
    } else {
      setError(res.errors);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/40 mb-1">
            <X
              className="w-5 h-5 text-rose-600 dark:text-rose-400"
              strokeWidth={3}
            />
          </div>
          <DialogTitle className="text-center">Marcar inasistencia</DialogTitle>
          <DialogDescription className="text-center">
            {collab.firstName} {collab.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Motivo{' '}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Ej: reemplazo, incapacidad, no se presentó…"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Confirmar inasistencia'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
