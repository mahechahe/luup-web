import { useState } from 'react';
import { X, Loader2, Coffee, UtensilsCrossed, CircleCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createIncidentService } from '../../services/eventServices';

const TIPOS = [
  {
    label: 'Break',
    Icon: Coffee,
    color: 'text-[#7493B2]',
    activeBg: 'bg-[#7493B2]',
    activeBorder: 'border-[#7493B2]',
  },
  {
    label: 'Almuerzo',
    Icon: UtensilsCrossed,
    color: 'text-[#DD7419]',
    activeBg: 'bg-[#DD7419]',
    activeBorder: 'border-[#DD7419]',
  },
  {
    label: 'Activo',
    Icon: CircleCheck,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-500',
    activeBorder: 'border-emerald-500',
  },
  {
    label: 'Inactivo',
    Icon: UserX,
    color: 'text-slate-500',
    activeBg: 'bg-slate-500',
    activeBorder: 'border-slate-500',
  },
];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function IncidentFormModal({ open, onClose, person, eventId, onSave }) {
  const [form, setForm] = useState({ name: '', time: nowTime(), note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !person) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const res = await createIncidentService({
      eventId: Number(eventId),
      userId: person.userId,
      name: form.name.trim(),
      time: form.time,
      note: form.note.trim() || null,
    });

    if (!res.status) { setError(res.errors); setSaving(false); return; }

    onSave(person.userId, res.incident);
    setForm({ name: '', time: nowTime(), note: '' });
    setSaving(false);
    onClose();
  };

  const handleClose = () => {
    setForm({ name: '', time: nowTime(), note: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Nueva incidencia</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {person.firstName} {person.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo — grid 2x2 para acomodar 4 opciones */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Tipo de incidencia <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(({ label, Icon, color, activeBg, activeBorder }) => {
                const active = form.name === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, name: label }))}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition active:scale-95 ${
                      active
                        ? `${activeBg} ${activeBorder} text-white`
                        : `bg-white border-border ${color} hover:bg-muted`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hora de la incidencia
            </label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Nota <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              placeholder="Observaciones adicionales…"
              className="w-full px-3 py-2 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#234465] hover:bg-[#234465]/90"
              disabled={saving || !form.name.trim()}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}