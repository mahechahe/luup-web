import { ArrowRightLeft, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function TransferZoneModal({ open, onClose, person, currentZoneId, availableZones, onConfirm, loading }) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const zones = availableZones.filter((z) => z.id !== currentZoneId);

  const handleConfirm = () => {
    if (!selectedZoneId) return;
    onConfirm(person, currentZoneId, selectedZoneId);
    setSelectedZoneId(null);
  };

  const handleClose = () => {
    setSelectedZoneId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#234465] dark:text-[#7493B2]">
            <ArrowRightLeft className="w-5 h-5" />
            Trasladar a zona
          </DialogTitle>
        </DialogHeader>

        {person && (
          <div className="space-y-4">
            {/* Info persona */}
            <div className="px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Trasladando a</p>
              <p className="text-sm font-semibold text-foreground">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-xs text-muted-foreground">CC {person.cedula}</p>
            </div>

            {/* Advertencia */}
            <p className="text-xs text-muted-foreground">
              Esta persona será <span className="font-semibold text-foreground">eliminada de su zona actual</span> y agregada a la zona seleccionada.
            </p>

            {/* Lista de zonas */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {zones.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No hay otras zonas disponibles.
                </p>
              ) : (
                zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition text-left ${
                      selectedZoneId === zone.id
                        ? 'border-[#234465] dark:border-[#7493B2] bg-[#234465]/5 dark:bg-[#7493B2]/10'
                        : 'border-border hover:border-[#234465]/40 dark:hover:border-[#7493B2]/50 hover:bg-muted/40'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{zone.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{zone.category}</p>
                    </div>
                    {selectedZoneId === zone.id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-[#234465] dark:bg-[#7493B2] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-card" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedZoneId || loading}
                className="bg-[#234465] hover:bg-[#234465]/90 text-white"
              >
                {loading ? 'Trasladando...' : 'Confirmar traslado'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}