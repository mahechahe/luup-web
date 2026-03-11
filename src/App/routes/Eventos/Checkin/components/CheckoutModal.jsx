import { useEffect, useState } from 'react';
import { Clock, Loader2, Package, Shirt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUserStore } from '@/App/context/userStore';
import { checkoutService } from '../../services/eventServices';

function QtyControl({ value, min = 0, max, onChange }) {
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold text-foreground hover:bg-muted disabled:opacity-30 transition"
      >
        −
      </button>
      <span className="flex-1 text-center text-base font-bold">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold text-foreground hover:bg-muted disabled:opacity-30 transition"
      >
        +
      </button>
    </div>
  );
}

function buildExitIso(timeStr) {
  const today = new Date();
  const [h, m] = timeStr.split(':');
  const d = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    +h,
    +m,
    0
  );
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00${sign}${oh}:${om}`;
}

export function CheckoutModal({ open, onOpenChange, collab, onCheckedOut }) {
  const user = useUserStore((state) => state.user);
  const [exitTime, setExitTime] = useState('');
  const [returnedUniform, setReturnedUniform] = useState(null);
  const [itemQtys, setItemQtys] = useState([]);
  const [saving, setSaving] = useState(false);

  const items = collab?.inventoryItems ?? [];
  const attendanceId =
    collab?.attendance?.id ?? collab?.attendance?.attendanceId;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setExitTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`
    );
    setReturnedUniform(null);
    setItemQtys(
      items.map((item) => ({
        collaboratorItemId: item.id,
        returnedQuantity: item.quantity,
        usedQuantity: 0,
      }))
    );
  }, [open, collab]);

  const updateItemQty = (idx, field, value) => {
    setItemQtys((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleConfirm = async () => {
    if (!exitTime) {
      toast.error('Ingresa la hora de salida');
      return;
    }
    if (returnedUniform === null) {
      toast.error('Indica si devolvió el uniforme');
      return;
    }
    setSaving(true);
    const res = await checkoutService({
      attendanceId,
      returnedUniform,
      exitTime: buildExitIso(exitTime),
      createdBy: user?.userId,
      items: items.length > 0 ? itemQtys : undefined,
    });
    if (res.status) {
      toast.success('Check-out registrado exitosamente');
      onCheckedOut(collab.userId, res.data);
      onOpenChange(false);
    } else {
      toast.error(res.errors ?? 'Error al registrar check-out');
    }
    setSaving(false);
  };

  if (!collab) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-md w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[200]">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground">
            Check-out — {collab.firstName} {collab.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[min(72vh,500px)] px-5 py-4 space-y-5">
          {/* Hora de salida */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Hora de salida
            </p>
            <input
              type="time"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
            />
          </div>

          {/* Devolvió uniforme */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5" />
              ¿Devolvió el uniforme?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReturnedUniform(true)}
                className={`h-11 rounded-xl font-semibold text-sm border-2 transition-all ${
                  returnedUniform === true
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => setReturnedUniform(false)}
                className={`h-11 rounded-xl font-semibold text-sm border-2 transition-all ${
                  returnedUniform === false
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Inventario */}
          {items.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Inventario asignado
              </p>
              {items.map((item, idx) => {
                const q = itemQtys[idx] ?? {
                  returnedQuantity: 0,
                  usedQuantity: 0,
                };
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border p-3 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {item.itemName}
                      </p>
                      <span className="text-[11px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md">
                        Asignado: {item.quantity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Devuelto
                        </p>
                        <QtyControl
                          value={q.returnedQuantity}
                          min={0}
                          max={item.quantity}
                          onChange={(v) =>
                            updateItemQty(idx, 'returnedQuantity', v)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Usado
                        </p>
                        <QtyControl
                          value={q.usedQuantity}
                          min={0}
                          max={item.quantity}
                          onChange={(v) =>
                            updateItemQty(idx, 'usedQuantity', v)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirmar checkout'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
