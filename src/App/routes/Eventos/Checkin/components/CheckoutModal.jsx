import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Shirt,
  AlertCircle,
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
  colombiaTimeToISO,
  formatDateRegisterLong,
  getColombiaTime,
} from '@/App/utils/functions/colombiaDate';
import { checkoutService } from '../../services/eventServices';

function QtyControl({ value, max, onChange }) {
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold text-foreground hover:bg-muted transition"
      >
        −
      </button>
      <span className="flex-1 text-center text-base font-bold">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold text-foreground hover:bg-muted transition"
      >
        +
      </button>
    </div>
  );
}

export function CheckoutModal({ open, onOpenChange, collab, onCheckedOut }) {
  const user = useUserStore((state) => state.user);
  const [exitTime, setExitTime] = useState('');
  const [returnedUniform, setReturnedUniform] = useState(null);
  const [itemQtys, setItemQtys] = useState([]);
  const [saving, setSaving] = useState(false);

  // Lo que sigue sin cuadrar. El inventario es del EVENTO, así que el ítem
  // arrastra lo ya devuelto en días anteriores y aquí solo se trabaja el saldo.
  const items = (collab?.inventoryItems ?? [])
    .map((item) => ({
      ...item,
      pending:
        item.pendingQuantity ??
        item.quantity -
          (item.returnedQuantity ?? 0) -
          (item.usedQuantity ?? 0) -
          (item.damagedQuantity ?? 0),
    }))
    .filter((item) => item.pending > 0);

  const attendanceId =
    collab?.attendance?.id ?? collab?.attendance?.attendanceId;

  const holding = collab?.uniformHolding ?? null;

  // Regla de negocio del cliente: no se cierra la jornada sin cuadrar el
  // inventario pendiente. Se calcula sobre lo PENDIENTE y no sobre el total
  // asignado: cuando no hay devoluciones previas ambos coinciden, pero si en
  // la Estación 3 ya se registró una devolución parcial, exigir el total otra
  // vez hacía que el API rechazara el check-out por exceso.
  const allItemsReady =
    items.length === 0 ||
    itemQtys.every((q, idx) => {
      const pending = items[idx]?.pending ?? 0;
      return (
        q.returnedQuantity + q.usedQuantity + q.damagedQuantity === pending
      );
    });

  const declaredSomething = itemQtys.some(
    (q) => q.returnedQuantity + q.usedQuantity + q.damagedQuantity > 0
  );

  useEffect(() => {
    if (!open) return;
    setExitTime(getColombiaTime());
    setReturnedUniform(null);
    setItemQtys(
      items.map((item) => ({
        collaboratorItemId: item.id,
        returnedQuantity: 0,
        usedQuantity: 0,
        damagedQuantity: 0,
      }))
    );
  }, [open, collab]);

  // Autocompleta el resto para que las tres casillas siempre sumen lo pendiente,
  // que es lo que el check-out exige para cerrar.
  const updateItemQty = (idx, field, value) => {
    const pending = items[idx]?.pending ?? 0;
    setItemQtys((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (field === 'returnedQuantity') {
          const used = Math.max(0, pending - value - q.damagedQuantity);
          return { ...q, returnedQuantity: value, usedQuantity: used };
        }
        if (field === 'usedQuantity') {
          const damaged = Math.max(0, pending - q.returnedQuantity - value);
          return { ...q, usedQuantity: value, damagedQuantity: damaged };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const handleConfirm = async () => {
    if (!exitTime) {
      toast.error('Ingresa la hora de salida');
      return;
    }
    if (holding && returnedUniform === null) {
      toast.error('Indica si devolvió el uniforme');
      return;
    }
    setSaving(true);
    const res = await checkoutService({
      attendanceId,
      returnedUniform,
      exitTime: colombiaTimeToISO(exitTime),
      createdBy: user?.userId,
      items: declaredSomething ? itemQtys : undefined,
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

          {/* Uniforme — solo si tiene uno en su poder */}
          {holding && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5" />
                ¿Devuelve el uniforme hoy?
              </p>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Talla{' '}
                <span className="font-semibold">{holding.size ?? '—'}</span>
                {holding.deliveredOn && (
                  <>
                    {' '}
                    · entregado el{' '}
                    <span className="capitalize">
                      {formatDateRegisterLong(holding.deliveredOn)}
                    </span>
                  </>
                )}
                . Puede conservarlo y devolverlo otro día.
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
                  Sí, lo devuelve
                </button>
                <button
                  onClick={() => setReturnedUniform(false)}
                  className={`h-11 rounded-xl font-semibold text-sm border-2 transition-all ${
                    returnedUniform === false
                      ? 'bg-[#234465] border-[#234465] text-white'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Se lo lleva
                </button>
              </div>
            </div>
          )}

          {/* Inventario — devolucion opcional, sobre lo pendiente */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Inventario pendiente
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Distribuye lo pendiente entre devuelto, usado y dañado. El
                  check-out no se cierra hasta cuadrarlo.
                </p>
              </div>

              {items.map((item, idx) => {
                const q = itemQtys[idx] ?? {
                  returnedQuantity: 0,
                  usedQuantity: 0,
                  damagedQuantity: 0,
                };
                const declared =
                  q.returnedQuantity + q.usedQuantity + q.damagedQuantity;
                const excess = declared - item.pending;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 space-y-3 transition-colors ${
                      excess > 0
                        ? 'border-destructive/50 bg-destructive/5'
                        : declared > 0
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.itemName}
                        </p>
                        {item.dateRegister && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Entregado el {item.dateRegister}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#234465] dark:text-[#7493B2] shrink-0 bg-[#234465]/10 dark:bg-[#7493B2]/15 px-2.5 py-1 rounded-lg">
                        Pendiente: {item.pending}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground font-medium text-center">
                          Devuelto
                        </p>
                        <QtyControl
                          value={q.returnedQuantity}
                          max={item.pending}
                          onChange={(v) =>
                            updateItemQty(idx, 'returnedQuantity', v)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground font-medium text-center">
                          Usado
                        </p>
                        <QtyControl
                          value={q.usedQuantity}
                          max={item.pending}
                          onChange={(v) =>
                            updateItemQty(idx, 'usedQuantity', v)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-destructive font-medium text-center">
                          Dañado
                        </p>
                        <QtyControl
                          value={q.damagedQuantity}
                          max={item.pending}
                          onChange={(v) =>
                            updateItemQty(idx, 'damagedQuantity', v)
                          }
                        />
                      </div>
                    </div>

                    {excess > 0 ? (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px] font-semibold">
                          Excede lo pendiente por {excess} unidad
                          {excess > 1 ? 'es' : ''}
                        </p>
                      </div>
                    ) : declared === item.pending ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px] font-semibold">
                          Queda saldado
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px] font-semibold">
                          Faltan {item.pending - declared} unidad
                          {item.pending - declared > 1 ? 'es' : ''} por
                          distribuir
                        </p>
                      </div>
                    )}
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
            disabled={saving || !allItemsReady}
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
