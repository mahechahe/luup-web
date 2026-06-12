import { useState, useRef } from 'react';
import {
  Loader2,
  Truck,
  Minus,
  Plus,
  RotateCcw,
  Camera,
  X,
  User,
  CreditCard,
  CarFront,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createTruckExitService } from '../../services/eventServices';

const QTY_PRESETS = [5, 10, 20, 50];
const KG_PRESETS = [5, 10, 25, 50];

const RESET_FORM = {
  quantity: 0,
  weightKg: '',
  driverName: '',
  driverCedula: '',
  plate: '',
  note: '',
};

const inputCls =
  'w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-secondary text-foreground text-sm ' +
  'placeholder:text-muted-foreground transition-colors ' +
  'hover:border-luup-blue-light/50 ' +
  'focus:outline-none focus:ring-2 focus:ring-luup-orange/20 focus:border-luup-orange';

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-luup-blue-light mb-3">
    {children}
  </p>
);

export function TruckExitFormModal({ open, onClose, zone, onSave }) {
  const [form, setForm] = useState(RESET_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cameraInputRef = useRef(null);

  const isValid =
    form.quantity > 0 &&
    form.weightKg !== '' &&
    form.driverName.trim() !== '' &&
    form.driverCedula.trim() !== '' &&
    form.plate.trim() !== '';

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

    const MAX_PX = 1920;
    const QUALITY = 0.82;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) { height = Math.round((height * MAX_PX) / width); width = MAX_PX; }
        else { width = Math.round((width * MAX_PX) / height); height = MAX_PX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const compressed = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setImageFile(compressed);
          setImagePreview(URL.createObjectURL(compressed));
        },
        'image/jpeg',
        QUALITY,
      );
    };
    img.src = objectUrl;
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

    const res = await createTruckExitService(zone.id, {
      quantity: form.quantity,
      weightKg: parseFloat(form.weightKg),
      driverName: form.driverName.trim(),
      driverCedula: form.driverCedula.trim(),
      plate: form.plate.trim().toUpperCase(),
      note: form.note.trim() || null,
      file: imageFile ?? undefined,
    });

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

    onSave(zone.id, res.exit);
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
      <DialogContent className="w-full max-w-sm p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden border-0 shadow-2xl">

        {/* ── Header ── */}
        <div className="bg-luup-blue-dark px-5 pt-5 pb-4 shrink-0">
          <DialogHeader className="flex-row items-center gap-3 space-y-0">
            <div className="w-10 h-10 rounded-xl bg-luup-orange flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-base font-bold leading-none text-white">
                Registrar salida de camión
              </DialogTitle>
              {zone?.name && (
                <p className="text-xs text-luup-blue-light mt-1">{zone.name}</p>
              )}
            </div>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="px-5 space-y-6 py-5">

            {/* ── Datos del conductor ── */}
            <div className="space-y-2.5">
              <SectionLabel>
                Datos del conductor <span className="text-destructive normal-case">*</span>
              </SectionLabel>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luup-blue-light pointer-events-none" />
                <input
                  type="text"
                  value={form.driverName}
                  onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
                  placeholder="Nombre completo del conductor"
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luup-blue-light pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.driverCedula}
                  onChange={(e) => setForm((f) => ({ ...f, driverCedula: e.target.value }))}
                  placeholder="Cédula del conductor"
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <CarFront className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luup-blue-light pointer-events-none" />
                <input
                  type="text"
                  value={form.plate}
                  onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                  placeholder="Placa del vehículo"
                  maxLength={8}
                  className={`${inputCls} uppercase placeholder:normal-case`}
                />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* ── Cantidad de bolsas ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>
                  Cantidad de bolsas <span className="text-destructive normal-case">*</span>
                </SectionLabel>
                {form.quantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, quantity: 0 }))}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition -mt-3"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Counter widget */}
              <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center justify-between gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => addQty(-1)}
                  disabled={form.quantity === 0}
                  className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted transition disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center select-none">
                  <span className="text-6xl font-black text-luup-orange leading-none tabular-nums">
                    {form.quantity}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                    bolsas
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => addQty(1)}
                  className="w-11 h-11 rounded-xl border-2 border-luup-orange bg-luup-orange/10 flex items-center justify-center text-luup-orange hover:bg-luup-orange/20 active:scale-95 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addQty(n)}
                    className="h-10 rounded-xl bg-luup-orange text-white text-sm font-bold hover:bg-luup-orange/85 active:scale-95 transition-all"
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
                <SectionLabel>
                  Peso total retirado <span className="text-destructive normal-case">*</span>
                </SectionLabel>
                {form.weightKg !== '' && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weightKg: '' }))}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition -mt-3"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>

              <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center justify-center mb-3">
                <span className="text-5xl font-black text-luup-orange leading-none tabular-nums select-none">
                  {weightDisplay}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {KG_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addKg(n)}
                    className="h-10 rounded-xl bg-luup-orange text-white text-sm font-bold hover:bg-luup-orange/85 active:scale-95 transition-all"
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
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                placeholder="O escribe el valor exacto…"
                className="w-full h-10 px-3 rounded-lg border border-input bg-secondary text-foreground text-sm placeholder:text-muted-foreground transition-colors hover:border-luup-blue-light/50 focus:outline-none focus:ring-2 focus:ring-luup-orange/20 focus:border-luup-orange"
              />
            </div>

            <div className="border-t border-border" />

            {/* ── Foto ── */}
            <div>
              <SectionLabel>
                Foto{' '}
                <span className="font-normal normal-case text-muted-foreground tracking-normal">
                  (opcional)
                </span>
              </SectionLabel>

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
                  className="w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-luup-orange/50 hover:text-luup-orange hover:bg-luup-orange/5 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-medium">Tomar foto</span>
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
              <SectionLabel>
                Nota{' '}
                <span className="font-normal normal-case text-muted-foreground tracking-normal">
                  (opcional)
                </span>
              </SectionLabel>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Observaciones adicionales…"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-secondary text-foreground text-sm placeholder:text-muted-foreground transition-colors hover:border-luup-blue-light/50 focus:outline-none focus:ring-2 focus:ring-luup-orange/20 focus:border-luup-orange resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-2 px-5 pb-5 pt-1 shrink-0 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 mt-4"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 mt-4 bg-luup-orange hover:bg-luup-orange/85 text-white"
              disabled={saving || !isValid}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Registrar salida'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
