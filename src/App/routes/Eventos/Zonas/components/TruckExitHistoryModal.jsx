import { useState } from 'react';
import {
  X,
  Truck,
  Weight,
  Calendar,
  ImageIcon,
  Loader2,
  User,
  CreditCard,
  CarFront,
  PackageOpen,
} from 'lucide-react';
import { getTruckExitSignedUrlService } from '../../services/eventServices';

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

export function TruckExitHistoryModal({ open, onClose, zone, exits = [] }) {
  const [viewingExit, setViewingExit] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  if (!open || !zone) return null;

  const sorted = [...exits].reverse();
  const totalQty = exits.reduce((sum, e) => sum + (e.quantity ?? 0), 0);
  const totalKg = exits.reduce((sum, e) => sum + (e.weightKg ?? 0), 0);
  const hasKg = exits.some((e) => e.weightKg != null);

  const handleViewPhoto = async (exit) => {
    setViewingExit(exit);
    setSignedUrl(null);
    setPhotoLoading(true);
    const res = await getTruckExitSignedUrlService(zone.id, exit.id);
    setSignedUrl(res.signedUrl);
    setPhotoLoading(false);
  };

  const closePhoto = () => {
    setViewingExit(null);
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
              <div className="w-9 h-9 rounded-lg bg-[#0891B2]/15 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#0891B2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Historial de salidas
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
            <div className="rounded-xl bg-[#0891B2]/8 border border-[#0891B2]/20 px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0891B2]/70 uppercase tracking-wide flex items-center gap-1">
                <PackageOpen className="w-3 h-3" /> Total retiradas
              </p>
              <p className="text-3xl font-bold text-[#0891B2] leading-none mt-1">
                {totalQty}
              </p>
              <p className="text-xs text-[#0891B2]/50 mt-0.5">bolsas</p>
            </div>
            <div className="rounded-xl bg-[#0891B2]/8 border border-[#0891B2]/20 px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0891B2]/70 uppercase tracking-wide flex items-center gap-1">
                <Weight className="w-3 h-3" /> Peso retirado
              </p>
              <p className="text-3xl font-bold text-[#0891B2] leading-none mt-1">
                {hasKg ? totalKg.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-[#0891B2]/50 mt-0.5">kilogramos</p>
            </div>
          </div>

          <div className="mx-6 border-t border-border shrink-0" />

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">
                Sin salidas registradas aún
              </p>
            ) : (
              sorted.map((exit, i) => (
                <div
                  key={exit.id ?? i}
                  className="px-4 py-3 rounded-xl border border-border bg-muted/30 space-y-2"
                >
                  {/* Fila principal: cantidad + kg + número */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0891B2]/15 flex items-center justify-center shrink-0">
                        <Truck className="w-3.5 h-3.5 text-[#0891B2]" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {exit.quantity ?? 0}{' '}
                        <span className="font-normal text-muted-foreground">
                          {exit.quantity === 1 ? 'bolsa' : 'bolsas'}
                        </span>
                        {exit.weightKg != null && (
                          <span className="text-muted-foreground font-normal">
                            {' '}· {exit.weightKg} kg
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                      #{sorted.length - i}
                    </span>
                  </div>

                  {/* Datos del conductor */}
                  <div className="grid grid-cols-1 gap-1">
                    {exit.driverName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 shrink-0" />
                        <span>{exit.driverName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {exit.driverCedula && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CreditCard className="w-3 h-3 shrink-0" />
                          <span>{exit.driverCedula}</span>
                        </div>
                      )}
                      {exit.plate && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <CarFront className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <span>{exit.plate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {exit.note && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {exit.note}
                    </p>
                  )}

                  {/* Fecha + foto */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDateTime(exit.createdAt)}</span>
                    </div>
                    {exit.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleViewPhoto(exit)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0891B2] dark:text-[#7493B2] hover:opacity-70 transition shrink-0"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Ver foto
                      </button>
                    )}
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
      {viewingExit && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/85" onClick={closePhoto} />

          <div className="relative z-10 w-full max-w-lg mx-4">
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
                  alt={`Salida #${viewingExit.id}`}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-white/60">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">No se pudo cargar la imagen</span>
                </div>
              )}
            </div>

            <div className="mt-3 px-1 flex items-center justify-between text-white/70 text-xs">
              <span>
                {viewingExit.quantity}{' '}
                {viewingExit.quantity === 1 ? 'bolsa' : 'bolsas'}
                {viewingExit.weightKg != null && ` · ${viewingExit.weightKg} kg`}
                {viewingExit.plate && ` · ${viewingExit.plate}`}
              </span>
              <span>{formatDateTime(viewingExit.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
