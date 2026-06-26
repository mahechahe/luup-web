import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Package,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUserStore } from '@/App/context/userStore';
import {
  updateInventoryItemCollaboratorService,
  getInventoryItemHistoryService,
} from '../../services/inventoryServices';

function QtyControl({ value, max, onChange }) {
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-12 h-12 flex items-center justify-center text-xl font-bold text-foreground hover:bg-muted transition"
      >
        −
      </button>
      <span className="flex-1 text-center text-base font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-12 h-12 flex items-center justify-center text-xl font-bold text-foreground hover:bg-muted transition"
      >
        +
      </button>
    </div>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function EditInventoryItemModal({ open, onOpenChange, item, onUpdated }) {
  const user = useUserStore((s) => s.user);

  const [returned, setReturned] = useState(0);
  const [used, setUsed] = useState(0);
  const [damaged, setDamaged] = useState(0);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const existingReturned = item?.returnedQuantity ?? 0;
  const existingUsed = item?.usedQuantity ?? 0;
  const existingDamaged = item?.damagedQuantity ?? 0;
  const quantity = item?.quantity ?? 0;
  const pending =
    item?.pendingQuantity ?? quantity - existingReturned - existingUsed - existingDamaged;

  const delta = returned + used + damaged;
  const newPending = pending - delta;
  const isValid = delta > 0 && newPending >= 0;

  useEffect(() => {
    if (!open || !item) return;
    setReturned(0);
    setUsed(0);
    setDamaged(0);
    loadHistory();
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async () => {
    if (!item?.id) return;
    setHistoryLoading(true);
    const res = await getInventoryItemHistoryService(item.id);
    setHistoryLoading(false);
    if (res.status) {
      setHistory(res.data?.history ?? []);
    }
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    const res = await updateInventoryItemCollaboratorService({
      collaboratorItemId: item.id,
      returnedQuantity: returned,
      usedQuantity: used,
      damagedQuantity: damaged,
      createdBy: user?.userId,
    });
    setSaving(false);
    if (res.status) {
      toast.success('Inventario actualizado');
      onUpdated({
        collaboratorItemId: item.id,
        returnedQuantity: res.data?.returnedQuantity,
        usedQuantity: res.data?.usedQuantity,
        damagedQuantity: res.data?.damagedQuantity,
        pendingQuantity: res.data?.pendingQuantity,
      });
      onOpenChange(false);
    } else {
      toast.error(res.errors ?? 'Error al actualizar');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-md w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[200]">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-[#DD7419]" />
            {item.itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[min(75vh,560px)] px-5 py-4 space-y-5">
          {/* Resumen actual */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Asignado', value: quantity, color: 'text-foreground' },
              { label: 'Devuelto', value: existingReturned, color: 'text-emerald-600' },
              { label: 'Usado', value: existingUsed, color: 'text-[#234465] dark:text-[#7493B2]' },
              {
                label: 'Pendiente',
                value: pending,
                color: pending === 0 ? 'text-emerald-600' : 'text-amber-600',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/40 rounded-xl py-2.5 text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">
                  {label}
                </p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Controles de delta */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Registrar en esta operación
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium text-center">
                  Devuelto
                </p>
                <QtyControl value={returned} max={pending} onChange={setReturned} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium text-center">
                  Usado
                </p>
                <QtyControl value={used} max={pending} onChange={setUsed} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] text-destructive font-medium text-center">
                  Dañado
                </p>
                <QtyControl value={damaged} max={pending} onChange={setDamaged} />
              </div>
            </div>

            {/* Estado de esta operación */}
            {delta > 0 && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                  newPending === 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : newPending < 0
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {newPending < 0 ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                ) : newPending === 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <p className="text-[11px] font-semibold">
                  {newPending < 0
                    ? `Excede el pendiente por ${Math.abs(newPending)} unidad${Math.abs(newPending) !== 1 ? 'es' : ''}`
                    : newPending === 0
                      ? 'Ítem completado con esta operación'
                      : `Quedarán ${newPending} unidad${newPending !== 1 ? 'es' : ''} pendiente${newPending !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">
                Historial de operaciones
              </p>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic px-1">
                Sin operaciones registradas aún.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl bg-muted/40 px-3 py-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-[11px] font-semibold text-foreground truncate">
                          {record.createdBy?.firstName && record.createdBy?.lastName
                            ? `${record.createdBy.firstName} ${record.createdBy.lastName}`
                            : `Usuario #${record.createdBy?.id ?? '—'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(record.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {record.returnedQuantity > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          +{record.returnedQuantity} devuelto{record.returnedQuantity !== 1 ? 's' : ''}
                        </span>
                      )}
                      {record.usedQuantity > 0 && (
                        <span className="text-[10px] font-semibold text-[#234465] dark:text-[#7493B2] bg-[#234465]/10 dark:bg-[#7493B2]/15 px-2 py-0.5 rounded-full">
                          +{record.usedQuantity} usado{record.usedQuantity !== 1 ? 's' : ''}
                        </span>
                      )}
                      {record.damagedQuantity > 0 && (
                        <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          +{record.damagedQuantity} dañado{record.damagedQuantity !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isValid}
            className="flex-1 h-11 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
