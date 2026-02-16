import { Trash2 } from 'lucide-react';

export function DeleteZoneModal({ deleteId, onConfirm, onCancel }) {
  if (!deleteId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <Trash2 className="w-7 h-7 text-destructive" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-3">¿Eliminar zona?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Esta acción borrará la zona del mapa y toda su lista de personas asignadas.
          Esta operación no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium bg-muted rounded-xl hover:bg-muted/70 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(deleteId)}
            className="flex-1 px-4 py-3 text-sm font-medium bg-destructive text-white rounded-xl hover:bg-destructive/90 transition"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
