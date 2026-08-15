import { useEffect, useState } from 'react';
import { Loader2, Shirt, X } from 'lucide-react';
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
import { upsertAttendanceService } from '../services/eventServices';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0')
);

const ATTENDED_OPTIONS = [
  {
    value: true,
    label: 'Sí',
    activeClass:
      'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300',
  },
  {
    value: false,
    label: 'No',
    activeClass:
      'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300',
  },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AttendanceEditModal({
  open,
  onClose,
  collaborator,
  eventId,
  onUpdated,
  onUniformSaved,
}) {
  const [form, setForm] = useState({
    attended: null,
    entryTime: '',
    notes: '',
    uniformSize: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && collaborator) {
      const a = collaborator.attendance;
      const currentUniformSize =
        collaborator.uniformSize ?? a?.uniformSize ?? '';
      setForm({
        attended: a?.attended ?? null,
        entryTime: isoToColombiaTime(a?.entryTime) || getColombiaTimeRounded(),
        notes: a?.notes ?? '',
        uniformSize: currentUniformSize,
      });
      setError(null);
    }
  }, [open, collaborator]);

  if (!collaborator) return null;

  // El uniforme es estado del EVENTO: se entrega un dia y se devuelve otro.
  const holding = collaborator.uniformHolding ?? null;
  const deliveredToday =
    collaborator.uniform === true || collaborator.attendance?.uniform === true;
  const holdingFromPreviousDay = !!holding && !deliveredToday;
  const holdingDate = formatDateRegisterLong(holding?.deliveredOn);
  // No tiene sentido entregar uniforme a quien no asistió, ni entregar uno
  // nuevo a quien ya tiene uno en su poder de un día anterior: generaría dos
  // uniformes asignados.
  const canEditUniform = form.attended !== false && !holdingFromPreviousDay;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.entryTime) {
      setError('La hora de entrada es obligatoria.');
      return;
    }
    setSaving(true);
    setError(null);

    const body = {
      eventId: Number(eventId),
      userId: collaborator.userId,
      attended: form.attended,
      entryTime: colombiaTimeToISO(form.entryTime) ?? null,
      notes: form.notes.trim() || null,
      uniform: !!form.uniformSize,
      uniformSize: form.uniformSize || null,
      dateRegister: collaborator.attendance?.dateRegister,
    };

    const res = await upsertAttendanceService(body);

    if (res.status) {
      // res.data es el objeto completo de la API: { id, attended, entryTime, ... }
      onUpdated(collaborator.userId, res.data.data);

      // Actualiza uniforme en estado local si cambió
      const prevUniformSize =
        collaborator.uniformSize ?? collaborator.attendance?.uniformSize ?? '';
      if (form.uniformSize !== prevUniformSize) {
        onUniformSaved?.(collaborator.userId, form.uniformSize);
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
          <DialogTitle>Editar asistencia</DialogTitle>
          <DialogDescription>
            {collaborator.firstName} {collaborator.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ¿Asistió? */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              ¿Asistió? <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              {ATTENDED_OPTIONS.map(({ value, label, activeClass }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      attended: value,
                      uniformSize:
                        value === false && !holdingFromPreviousDay
                          ? ''
                          : f.uniformSize,
                    }))
                  }
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition ${
                    form.attended === value
                      ? activeClass
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Hora de entrada */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hora de entrada <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={form.entryTime ? form.entryTime.split(':')[0] : ''}
                onValueChange={(h) => {
                  const m = form.entryTime
                    ? form.entryTime.split(':')[1]
                    : '00';
                  setForm((f) => ({ ...f, entryTime: `${h}:${m ?? '00'}` }));
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
                value={form.entryTime ? form.entryTime.split(':')[1] : ''}
                onValueChange={(m) => {
                  const h = form.entryTime
                    ? form.entryTime.split(':')[0]
                    : '00';
                  setForm((f) => ({ ...f, entryTime: `${h ?? '00'}:${m}` }));
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

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Observaciones opcionales…"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 resize-none"
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
              {!canEditUniform ? (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {holdingFromPreviousDay
                    ? 'Ya tiene uniforme en su poder'
                    : 'No aplica · no asistió'}
                </span>
              ) : holding ? (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  En su poder · Talla {holding.size ?? '—'}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  Opcional
                </span>
              )}
              {canEditUniform && form.uniformSize && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, uniformSize: '' }))}
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
                    . No se puede registrar otro mientras lo tenga.
                  </p>
                </div>
              </div>
            )}

            {canEditUniform ? (
              <div className="grid grid-cols-6 gap-1.5">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        uniformSize: f.uniformSize === size ? '' : size,
                      }))
                    }
                    className={`h-9 rounded-lg text-xs font-bold transition-all border-2 ${
                      form.uniformSize === size
                        ? 'bg-[#DD7419] border-[#DD7419] text-white'
                        : 'bg-card border-border text-foreground hover:border-[#DD7419]/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : !holdingFromPreviousDay ? (
              <p className="text-[11px] text-muted-foreground">
                La persona no asistió, así que no se le entrega uniforme.
              </p>
            ) : null}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Acciones */}
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
              className="flex-1 bg-[#DD7419] hover:bg-[#DD7419]/90"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
