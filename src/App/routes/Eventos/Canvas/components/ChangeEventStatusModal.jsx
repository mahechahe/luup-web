import { useEffect, useState } from 'react';
import { History, Loader2, Workflow } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { changeEventStatusService } from '../../services/eventServices';
import { SUGGESTED_EVENT_STATUSES, suggestedNextStatus } from './eventStatus';

const CUSTOM = '__custom__';

/**
 * Cambia el estado operativo del evento. No hay máquina de estados: se
 * ofrecen 3 sugerencias (Montaje/Ejecución/Desmontaje) como accesos rápidos,
 * pero el estado es texto libre y la nota es opcional.
 */
export function ChangeEventStatusModal({
  open,
  onOpenChange,
  eventId,
  currentStatus,
  onChanged,
  onViewHistory,
}) {
  const [selected, setSelected] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const suggested = suggestedNextStatus(currentStatus);

  useEffect(() => {
    if (open) {
      setSelected(suggested ?? '');
      setCustomStatus('');
      setNote('');
    }
  }, [open, suggested]);

  const finalStatus = (selected === CUSTOM ? customStatus : selected).trim();

  const handleConfirm = async () => {
    if (!finalStatus) {
      toast.error('Indica el estado del evento');
      return;
    }

    setSaving(true);
    const res = await changeEventStatusService({
      eventId,
      status: finalStatus,
      note: note.trim() || undefined,
    });
    setSaving(false);

    if (res.status) {
      toast.success(`Evento marcado como "${finalStatus}"`);
      onChanged?.(finalStatus);
      onOpenChange(false);
    } else {
      toast.error(res.errors ?? 'No se pudo cambiar el estado del evento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#DD7419]" />
              Cambiar estado
            </DialogTitle>
            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition shrink-0"
              >
                <History className="w-3 h-3" />
                Ver bitácora
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_EVENT_STATUSES.map((s) => {
                const isCurrent =
                  currentStatus?.toLowerCase() === s.value.toLowerCase();
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelected(s.value)}
                    disabled={isCurrent}
                    title={isCurrent ? 'Ya es el estado actual' : undefined}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      selected === s.value
                        ? 'bg-[#DD7419] border-[#DD7419] text-white'
                        : 'border-border text-foreground hover:bg-muted'
                    } ${
                      !isCurrent && suggested === s.value
                        ? 'ring-2 ring-[#DD7419]/40'
                        : ''
                    }`}
                  >
                    {s.value}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelected(CUSTOM)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  selected === CUSTOM
                    ? 'bg-[#DD7419] border-[#DD7419] text-white'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                Otro…
              </button>
            </div>
            {selected === CUSTOM && (
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                autoFocus
                maxLength={50}
                placeholder="Ej: Pausado por lluvia"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nota{' '}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Detalle adicional sobre este cambio"
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
            disabled={saving || !finalStatus}
            className="flex-1 h-9 rounded-lg bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
