import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { upsertAttendanceService } from '../services/eventServices';

/* "HH:mm" → ISO con fecha de hoy y offset local */
function timeToISO(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, '0');
  const mm = String(Math.abs(tz) % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${hh}:${mm}`
  );
}

/* ISO → "HH:mm" para input[time] */
function isoToTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const ATTENDED_OPTIONS = [
  { value: true, label: 'Sí', activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-700' },
  { value: false, label: 'No', activeClass: 'bg-red-100 border-red-400 text-red-700' },
];

export default function AttendanceEditModal({
  open,
  onClose,
  collaborator,
  eventId,
  onUpdated,
}) {
  const [form, setForm] = useState({
    attended: null,
    entryTime: '',
    exitTime: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && collaborator) {
      const a = collaborator.attendance;
      setForm({
        attended: a?.attended ?? null,
        entryTime: isoToTime(a?.entryTime),
        exitTime: isoToTime(a?.exitTime),
        notes: a?.notes ?? '',
      });
      setError(null);
    }
  }, [open, collaborator]);

  if (!open || !collaborator) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      eventId: Number(eventId),
      userId: collaborator.userId,
      attended: form.attended,
      entryTime: timeToISO(form.entryTime) ?? null,
      exitTime: timeToISO(form.exitTime) ?? null,
      notes: form.notes.trim() || null,
    };

    const res = await upsertAttendanceService(body);

    if (res.status) {
      onUpdated(collaborator.userId, {
        attended: body.attended,
        entryTime: body.entryTime,
        exitTime: body.exitTime,
        notes: body.notes,
      });
      onClose();
    } else {
      setError(res.errors);
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Editar asistencia
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {collaborator.firstName} {collaborator.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ¿Asistió? */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              ¿Asistió?
            </label>
            <div className="flex gap-2">
              {ATTENDED_OPTIONS.map(({ value, label, activeClass }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, attended: value }))}
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition ${
                    form.attended === value
                      ? activeClass
                      : 'bg-white border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Entrada */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hora de entrada
            </label>
            <input
              type="time"
              value={form.entryTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, entryTime: e.target.value }))
              }
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
          </div>

          {/* Salida */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hora de salida
            </label>
            <input
              type="time"
              value={form.exitTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, exitTime: e.target.value }))
              }
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
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
              rows={3}
              placeholder="Observaciones opcionales…"
              className="w-full px-3 py-2 rounded-md border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 resize-none"
            />
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
              className="flex-1 bg-[#234465] hover:bg-[#234465]/90"
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
      </div>
    </div>
  );
}
