import { useEffect, useState } from 'react';
import { Check, Loader2, Shirt, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  colombiaTimeToISO,
  formatDateRegisterLong,
  getColombiaTimeRounded,
  isoToColombiaTime,
} from '@/App/utils/functions/colombiaDate';
import { upsertAttendanceService } from '@/App/routes/Eventos/services/eventServices';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0')
);

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Confirma asistencia con hora de entrada y uniforme. Acción rápida desde la tarjeta. */
export function MarkAttendedModal({
  open,
  onClose,
  collab,
  eventId,
  dateRegister,
  onUpdated,
  onUniformSaved,
}) {
  const [entryTime, setEntryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [uniformSize, setUniformSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && collab) {
      const a = collab.attendance;
      setEntryTime(isoToColombiaTime(a?.entryTime) || getColombiaTimeRounded());
      setNotes(a?.notes ?? '');
      setUniformSize(collab.uniformSize ?? a?.uniformSize ?? '');
      setError(null);
    }
  }, [open, collab]);

  if (!collab) return null;

  // El uniforme es estado del EVENTO: se entrega un día y se devuelve otro.
  const holding = collab.uniformHolding ?? null;
  const deliveredToday =
    collab.uniform === true || collab.attendance?.uniform === true;
  const holdingFromPreviousDay = !!holding && !deliveredToday;
  const holdingDate = formatDateRegisterLong(holding?.deliveredOn);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entryTime) {
      setError('La hora de entrada es obligatoria.');
      return;
    }
    setSaving(true);
    setError(null);

    const body = {
      eventId: Number(eventId),
      userId: collab.userId,
      attended: true,
      entryTime: colombiaTimeToISO(entryTime) ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: notes.trim() || null,
      uniform: !!uniformSize,
      uniformSize: uniformSize || null,
      dateRegister: collab.attendance?.dateRegister ?? dateRegister,
    };

    const res = await upsertAttendanceService(body);
    if (res.status) {
      onUpdated(collab.userId, res.data?.data);

      const prevUniformSize =
        collab.uniformSize ?? collab.attendance?.uniformSize ?? '';
      if (uniformSize !== prevUniformSize) {
        onUniformSaved?.(collab.userId, uniformSize);
      }

      onClose();
    } else {
      setError(res.errors);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-1">
            <Check
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
              strokeWidth={3}
            />
          </div>
          <DialogTitle className="text-center">
            Confirmar asistencia
          </DialogTitle>
          <DialogDescription className="text-center">
            {collab.firstName} {collab.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hora de entrada <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={entryTime ? entryTime.split(':')[0] : ''}
                onValueChange={(h) => {
                  const m = entryTime ? entryTime.split(':')[1] : '00';
                  setEntryTime(`${h}:${m ?? '00'}`);
                }}
              >
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground font-bold">:</span>

              <Select
                value={entryTime ? entryTime.split(':')[1] : ''}
                onValueChange={(m) => {
                  const h = entryTime ? entryTime.split(':')[0] : '00';
                  setEntryTime(`${h ?? '00'}:${m}`);
                }}
              >
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Notas{' '}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones opcionales…"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          {/* Separador */}
          <div className="border-t border-border" />

          {/* Uniforme */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Shirt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-foreground">
                Uniforme
              </span>
              {holding ? (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  En su poder · Talla {holding.size ?? '—'}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  Opcional
                </span>
              )}
              {uniformSize && (
                <button
                  type="button"
                  onClick={() => setUniformSize('')}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" /> Quitar
                </button>
              )}
            </div>

            {holdingFromPreviousDay && (
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 mb-3">
                <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-snug">
                    Ya tiene uniforme en su poder
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Talla{' '}
                    <span className="font-bold">{holding.size ?? '—'}</span>
                    {holdingDate && (
                      <>
                        {' '}
                        · entregado el{' '}
                        <span className="capitalize">{holdingDate}</span>
                      </>
                    )}
                    . Asigna otra talla solo si hubo cambio o daño.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-6 gap-1.5">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setUniformSize((s) => (s === size ? '' : size))
                  }
                  className={`h-9 rounded-lg text-xs font-bold transition-all border-2 ${
                    uniformSize === size
                      ? 'bg-[#DD7419] border-[#DD7419] text-white'
                      : 'bg-card border-border text-foreground hover:border-[#DD7419]/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
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
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Confirmar asistencia'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
