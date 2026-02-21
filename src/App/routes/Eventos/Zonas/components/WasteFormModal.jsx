import { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWasteEntryService } from '../../services/eventServices';

export function WasteFormModal({ open, onClose, zone, onSave }) {
  const [form, setForm] = useState({ quantity: '', weightKg: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !zone) return null;

  const isValid = form.quantity !== '' && parseInt(form.quantity) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);

    const res = await createWasteEntryService(zone.id, {
      quantity: parseInt(form.quantity),
      weightKg: form.weightKg !== '' ? parseFloat(form.weightKg) : null,
      note: form.note.trim() || null,
    });

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

    onSave(zone.id, res.entry);
    setForm({ quantity: '', weightKg: '', note: '' });
    setSaving(false);
    onClose();
  };

  const handleClose = () => {
    setForm({ quantity: '', weightKg: '', note: '' });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
              <Trash2 className="w-4.5 h-4.5 text-[#DD7419]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Registrar basura</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{zone.name}</p>
            </div>
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
          {/* Cantidad */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Cantidad de basuras <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Ej: 5"
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 focus:border-[#DD7419]"
            />
          </div>

          {/* Peso */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Peso (kg){' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
              placeholder="Ej: 12.5"
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 focus:border-[#DD7419]"
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
              className="w-full px-3 py-2 rounded-md border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 focus:border-[#DD7419] resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#DD7419] hover:bg-[#DD7419]/90"
              disabled={saving || !isValid}
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
