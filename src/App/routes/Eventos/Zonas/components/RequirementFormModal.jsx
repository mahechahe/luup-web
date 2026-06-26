import { useRef, useState } from 'react';
import { Camera, ClipboardList, ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createRequirementService } from '../../services/eventServices';

const MAX_CHARS = 1000;
const ACCEPTED = 'image/png,image/jpeg,image/jpg';

export function RequirementFormModal({ open, onClose, zone, onSave }) {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);      // File object
  const [preview, setPreview] = useState(null);  // object URL for preview
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const isValid = note.trim().length > 0 && note.length <= MAX_CHARS;

  const handleFile = (file) => {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);

    const res = await createRequirementService(zone.id, { note: note.trim(), file: photo ?? undefined });

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

    onSave(zone.id, res.requirement);
    setNote('');
    removePhoto();
    setSaving(false);
    onClose();
  };

  const handleClose = () => {
    setNote('');
    removePhoto();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open && !!zone} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-full max-w-sm p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-row items-center gap-3 px-5 pt-5 pb-4 shrink-0 space-y-0">
          <div className="w-9 h-9 rounded-lg bg-[#234465]/15 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-[#234465]" />
          </div>
          <div className="flex-1 text-left">
            <DialogTitle className="text-base font-bold leading-none">
              Agregar requerimiento
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">{zone?.name}</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 pb-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">
                Requerimiento <span className="text-destructive">*</span>
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={MAX_CHARS}
                placeholder="Describe el requerimiento o nota de seguimiento…"
                autoFocus
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30 focus:border-[#234465] resize-none"
              />
              <p className={`text-[11px] mt-1 text-right ${note.length > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                {note.length}/{MAX_CHARS}
              </p>
            </div>

            {/* Foto opcional */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Foto <span className="text-muted-foreground font-normal">(opcional)</span></p>

              {preview ? (
                <div className="relative w-full rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="preview" className="w-full max-h-40 object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {/* Cámara (solo móvil) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-[#234465]/40 text-[#234465] text-xs font-medium hover:bg-[#234465]/5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    Tomar foto
                  </button>
                  {/* Archivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-medium hover:bg-muted/50 transition"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Adjuntar
                  </button>
                </div>
              )}

              {/* Inputs ocultos */}
              <input
                ref={cameraInputRef}
                type="file"
                accept={ACCEPTED}
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2 px-5 pb-5 shrink-0">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#234465] hover:bg-[#234465]/90"
              disabled={saving || !isValid}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Guardar requerimiento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
