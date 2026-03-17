import { useState, useRef } from 'react';
import {
  Loader2,
  Trash2,
  Minus,
  Plus,
  RotateCcw,
  Camera,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createWasteEntryService } from '../../services/eventServices';

const QTY_PRESETS = [5, 10, 20, 50];
const KG_PRESETS = [5, 10, 25, 50];

const BAG_COLORS = [
  { id: 'verde',  hex: '#22c55e', label: 'Verde' },
  { id: 'blanco', hex: '#f1f5f9', label: 'Blanco', border: true },
  { id: 'negra',  hex: '#1e293b', label: 'Negra' },
  { id: 'roja',   hex: '#ef4444', label: 'Roja' },
];

const RESET_FORM = { quantity: 0, weightKg: '', note: '', bagColor: null };

export function WasteFormModal({ open, onClose, zone, onSave }) {
  const [form, setForm] = useState(RESET_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cameraInputRef = useRef(null);

  // ¿El usuario ha tocado alguno de los 3 campos?
  const anyFieldFilled =
    form.quantity > 0 ||
    form.weightKg !== '' ||
    form.bagColor !== null;

  // Si tocó algo → los 3 son obligatorios, foto opcional
  // Si no tocó nada → foto obligatoria
  const fieldsRequired = anyFieldFilled;
  const photoRequired = !anyFieldFilled;

  const isValid = anyFieldFilled
    ? form.quantity > 0 && form.weightKg !== '' && form.bagColor !== null
    : imageFile !== null;

  const addQty = (n) =>
    setForm((f) => ({ ...f, quantity: Math.max(0, f.quantity + n) }));
  const addKg = (n) =>
    setForm((f) => ({
      ...f,
      weightKg: String(Math.max(0, parseFloat(f.weightKg || '0') + n)),
    }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);

    const res = await createWasteEntryService(zone.id, {
      quantity: form.quantity,
      weightKg: form.weightKg !== '' ? parseFloat(form.weightKg) : null,
      bagColor: form.bagColor ?? null,
      note: form.note.trim() || null,
      file: imageFile ?? undefined,
    });

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

    onSave(zone.id, res.entry);
    setForm(RESET_FORM);
    removeImage();
    setSaving(false);
    onClose();
  };

  const handleClose = () => {
    setForm(RESET_FORM);
    removeImage();
    setError(null);
    onClose();
  };

  const weightDisplay =
    form.weightKg !== '' ? `${parseFloat(form.weightKg).toFixed(1)} kg` : '—';

  return (
    <Dialog
      open={open && !!zone}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
    >
      <DialogContent className="w-full max-w-sm p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-row items-center gap-3 px-5 pt-5 pb-4 shrink-0 space-y-0">
          <div className="w-9 h-9 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-[#DD7419]" />
          </div>
          <div className="flex-1 text-left">
            <DialogTitle className="text-base font-bold leading-none">
              Registrar basura
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">{zone?.name}</p>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="px-5 space-y-5 pb-5">

            {/* ── Color de bolsa ── */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">
                Color de bolsa{' '}
                {fieldsRequired
                  ? <span className="text-destructive">*</span>
                  : <span className="font-normal text-muted-foreground">(opcional)</span>
                }
              </p>
              <div className="flex items-center gap-3">
                {BAG_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        bagColor: f.bagColor === color.id ? null : color.id,
                      }))
                    }
                    title={color.label}
                    className={`w-12 h-12 rounded-xl transition-all shrink-0 ${
                      color.border ? 'border border-slate-200 dark:border-slate-600' : ''
                    } ${
                      form.bagColor === color.id
                        ? 'ring-4 ring-offset-2 ring-[#DD7419] scale-110 shadow-md'
                        : 'hover:scale-105 hover:shadow-sm'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* ── Cantidad ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground">
                  Cantidad de basuras{' '}
                  {fieldsRequired
                    ? <span className="text-destructive">*</span>
                    : <span className="font-normal text-muted-foreground">(opcional)</span>
                  }
                </p>
                {form.quantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, quantity: 0 }))}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => addQty(-1)}
                  disabled={form.quantity === 0}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 flex flex-col items-center">
                  <span className="text-6xl font-black text-[#DD7419] leading-none tabular-nums">
                    {form.quantity}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    unidades
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => addQty(1)}
                  className="w-12 h-12 rounded-xl border-2 border-[#DD7419] bg-[#DD7419]/8 flex items-center justify-center text-[#DD7419] hover:bg-[#DD7419]/15 transition shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addQty(n)}
                    className="h-11 rounded-xl bg-[#DD7419] text-white text-sm font-bold hover:bg-[#DD7419]/90 active:scale-95 transition-all"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* ── Peso ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground">
                  Peso{' '}
                  {fieldsRequired
                    ? <span className="text-destructive">*</span>
                    : <span className="font-normal text-muted-foreground">(opcional)</span>
                  }
                </p>
                {form.weightKg !== '' && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weightKg: '' }))}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center mb-3">
                <span className="text-4xl font-black text-[#234465] leading-none tabular-nums">
                  {weightDisplay}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {KG_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addKg(n)}
                    className="h-11 rounded-xl bg-[#234465] text-white text-sm font-bold hover:bg-[#234465]/85 active:scale-95 transition-all"
                  >
                    +{n}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weightKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weightKg: e.target.value }))
                }
                placeholder="O escribe el valor exacto…"
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 focus:border-[#234465]"
              />
            </div>

            <div className="border-t border-border" />

            {/* ── Foto ── */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">
                Foto{' '}
                {photoRequired
                  ? <span className="text-destructive">*</span>
                  : <span className="font-normal text-muted-foreground">(opcional)</span>
                }
              </p>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed transition ${
                    photoRequired
                      ? 'border-destructive/40 text-destructive hover:bg-destructive/5'
                      : 'border-border text-muted-foreground hover:border-[#DD7419]/40 hover:text-[#DD7419] hover:bg-[#DD7419]/5'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-medium">
                    {photoRequired ? 'Foto requerida' : 'Tomar foto'}
                  </span>
                </button>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="border-t border-border" />

            {/* ── Nota ── */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">
                Nota{' '}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </p>
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                rows={2}
                placeholder="Observaciones adicionales…"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 focus:border-[#DD7419] resize-none"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 pb-5 shrink-0">
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
                `Registrar ${form.quantity > 0 ? form.quantity : ''}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}