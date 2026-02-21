import { useState } from 'react';
import { X, Loader2, UtensilsCrossed, Coffee, MapPinOff, AlertTriangle, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createIncidentService } from '../../services/eventServices';

const PRESETS = [
  { label: 'En almuerzo', Icon: UtensilsCrossed },
  { label: 'En descanso', Icon: Coffee },
  { label: 'Fuera de zona', Icon: MapPinOff },
  { label: 'Emergencia', Icon: AlertTriangle },
  { label: 'Regresó', Icon: CornerDownLeft },
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

  const handlePreset = (label) => setForm((f) => ({ ...f, name: label }));

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

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

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
          {/* Presets */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Tipo de incidencia
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(({ label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handlePreset(label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    form.name === label
                      ? 'bg-[#234465] text-white border-[#234465]'
                      : 'bg-white text-foreground border-border hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre personalizado */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Nombre de la incidencia
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Escribe o selecciona un tipo…"
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
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
              Nota{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
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

          {/* Acciones */}
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
              ) : (
                'Registrar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
