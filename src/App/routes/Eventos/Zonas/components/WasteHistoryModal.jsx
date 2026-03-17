import { useState } from 'react';
import {
  X,
  Trash2,
  Weight,
  ClipboardList,
  Calendar,
  ImageIcon,
  Loader2,
} from 'lucide-react';

const BAG_COLORS = {
  verde: { hex: '#22c55e', label: 'Verde', border: false },
  blanco: { hex: '#f1f5f9', label: 'Blanco', border: true },
  negra: { hex: '#1e293b', label: 'Negra', border: false },
  roja: { hex: '#ef4444', label: 'Roja', border: false },
};
import { getWasteSignedUrlService } from '../../services/eventServices';

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function WasteHistoryModal({ open, onClose, zone, entries = [] }) {
  const [viewingEntry, setViewingEntry] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  if (!open || !zone) return null;

  const sorted = [...entries].reverse();
  const totalQty = entries.reduce((sum, e) => sum + (e.quantity ?? 0), 0);
  const totalKg = entries.reduce((sum, e) => sum + (e.weightKg ?? 0), 0);
  const hasKg = entries.some((e) => e.weightKg != null);

  const handleViewPhoto = async (entry) => {
    setViewingEntry(entry);
    setSignedUrl(null);
    setPhotoLoading(true);
    const res = await getWasteSignedUrlService(zone.id, entry.id);
    setSignedUrl(res.signedUrl);
    setPhotoLoading(false);
  };

  const closePhoto = () => {
    setViewingEntry(null);
    setSignedUrl(null);
    setPhotoLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="relative z-10 w-full max-w-lg bg-card rounded-xl shadow-xl mx-4 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4.5 h-4.5 text-[#DD7419]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Historial de basuras
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {zone.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-3 px-6 pb-4 shrink-0">
            <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3">
              <p className="text-[11px] font-semibold text-[#DD7419]/70 uppercase tracking-wide flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Total registradas
              </p>
              <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">
                {totalQty}
              </p>
              <p className="text-xs text-[#DD7419]/50 mt-0.5">unidades</p>
            </div>
            <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3">
              <p className="text-[11px] font-semibold text-[#DD7419]/70 uppercase tracking-wide flex items-center gap-1">
                <Weight className="w-3 h-3" /> Peso total
              </p>
              <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">
                {hasKg ? totalKg.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-[#DD7419]/50 mt-0.5">kilogramos</p>
            </div>
          </div>

          <div className="mx-6 border-t border-border shrink-0" />

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">
                Sin registros aún
              </p>
            ) : (
              sorted.map((entry, i) => (
                <div
                  key={entry.id ?? i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-muted/30"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5 text-[#DD7419]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {entry.quantity || 0}{' '}
                        <span className="font-normal text-muted-foreground">
                          {entry.quantity === 1 ? 'unidad' : 'unidades'}
                        </span>
                        {entry.weightKg != null && (
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            · {entry.weightKg} kg
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                        #{sorted.length - i}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {entry.note}
                      </p>
                    )}
                    {entry.bagColor && BAG_COLORS[entry.bagColor] && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 inline-block"
                          style={{
                            backgroundColor: BAG_COLORS[entry.bagColor].hex,
                            boxShadow: BAG_COLORS[entry.bagColor].border
                              ? 'inset 0 0 0 1px #cbd5e1'
                              : undefined,
                          }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          Bolsa {BAG_COLORS[entry.bagColor].label.toLowerCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                      {entry.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleViewPhoto(entry)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#234465] dark:text-[#7493B2] hover:opacity-70 transition shrink-0"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Ver foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {viewingEntry && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/85" onClick={closePhoto} />

          <div className="relative z-10 w-full max-w-lg mx-4">
            {/* Cerrar */}
            <button
              type="button"
              onClick={closePhoto}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-48">
              {photoLoading ? (
                <div className="flex flex-col items-center gap-2 py-16 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Cargando imagen…</span>
                </div>
              ) : signedUrl ? (
                <img
                  src={signedUrl}
                  alt={`Registro #${viewingEntry.id}`}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-white/60">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">No se pudo cargar la imagen</span>
                </div>
              )}
            </div>

            {/* Info del registro */}
            <div className="mt-3 px-1 flex items-center justify-between text-white/70 text-xs">
              <span>
                {viewingEntry.quantity}{' '}
                {viewingEntry.quantity === 1 ? 'unidad' : 'unidades'}
                {viewingEntry.weightKg != null &&
                  ` · ${viewingEntry.weightKg} kg`}
              </span>
              <span>{formatDateTime(viewingEntry.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
