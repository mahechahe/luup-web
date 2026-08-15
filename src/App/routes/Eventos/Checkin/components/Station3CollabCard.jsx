import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CornerUpLeft,
  DoorOpen,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatColombiaTime } from '@/App/utils/functions/colombiaDate';
import { getItemQuantities } from '../utils/collaborators';
import { CollabIdentity, CollabNote } from './CollabIdentity';
import { InventoryItemStats } from './InventoryItemStats';
import { StageBadge } from './StageBadge';
import {
  STAGES,
  getStage,
  isFinished,
  isPastStage,
  previousStage,
  stageMeta,
} from '../utils/stages';

function ItemHeader({ item, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-[#DD7419]/10 flex items-center justify-center shrink-0">
          <Package className="w-3 h-3 text-[#DD7419]" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground truncate">
            {item.itemName}
          </p>
          {item.dateRegister && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                Fecha de registro: {item.dateRegister}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{children}</div>
    </div>
  );
}

/**
 * Tarjeta de colaborador de la Estación 3 (dotación e insumos):
 * asignar inventario, registrar devoluciones parciales y confirmar la asignación.
 */
export function Station3CollabCard({
  collab,
  isAdmin,
  onAssign,
  onRequestConfirm,
  onAddMore,
  onDeleteItem,
  onEditItem,
  onRevert,
  onTimeline,
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const items = collab.inventoryItems ?? [];
  const hasItems = items.length > 0;
  const pendingItems = items.filter(
    (item) => getItemQuantities(item).pending > 0
  );
  const hiddenCount = items.length - pendingItems.length;

  const allReturned =
    hasItems && items.every((i) => i.returnedQuantity >= i.quantity);
  const entryTime = formatColombiaTime(collab.attendance?.entryTime);
  const exitTime = formatColombiaTime(collab.attendance?.exitTime);
  const stage = getStage(collab);
  const hasCheckout = isFinished(stage);
  // Ya pasó de la Estación 3: el inventario queda cerrado.
  const isConfirmed = isPastStage(stage, STAGES.ESTACION_3);

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        isConfirmed
          ? 'border-[#234465]/30 dark:border-[#7493B2]/30'
          : allReturned
            ? 'border-emerald-200 dark:border-emerald-800'
            : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${
          isConfirmed
            ? 'bg-[#234465] dark:bg-[#7493B2]'
            : allReturned
              ? 'bg-emerald-500'
              : hasItems
                ? 'bg-[#234465]'
                : 'bg-muted'
        }`}
      />
      <div className="p-4 space-y-3">
        {/* Cabecera colaborador */}
        <div className="flex items-start justify-between gap-3">
          <CollabIdentity collab={collab} />
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              {isAdmin && onRevert && previousStage(stage) && (
                <button
                  onClick={() => onRevert(collab)}
                  title={`Devolver a ${stageMeta(previousStage(stage)).short}`}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-[#DD7419]/10 hover:text-[#DD7419] transition"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <StageBadge
                stage={stage}
                onClick={onTimeline && (() => onTimeline(collab))}
              />
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                hasItems
                  ? allReturned
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-[#DD7419]/10 text-[#DD7419]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
        </div>

        {(collab.attendance?.notes ?? collab.notes) && (
          <div className="pb-2">
            <CollabNote note={collab.attendance?.notes ?? collab.notes} />
          </div>
        )}

        {/* Inventario */}
        {hasItems ? (
          <div>
            <div
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition cursor-pointer"
              onClick={() => setItemsExpanded((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">
                  {itemsExpanded ? 'Ocultar ítems' : 'Ver ítems'}
                </span>
                {pendingItems.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                    {pendingItems.length} pendiente
                    {pendingItems.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hiddenCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllItems(true);
                    }}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition"
                  >
                    Ver todos ({items.length})
                  </button>
                )}
                <ChevronDown
                  className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                  style={{
                    transform: itemsExpanded
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                  }}
                />
              </div>
            </div>

            {itemsExpanded && (
              <div className="mt-2 space-y-2">
                {pendingItems.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                      Todos los ítems están completos
                    </p>
                  </div>
                ) : (
                  pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-muted/40 px-3 py-3 space-y-2.5"
                    >
                      <ItemHeader item={item}>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Pendiente
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() =>
                              onEditItem({ collabUserId: collab.userId, item })
                            }
                            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-[#DD7419]/10 hover:text-[#DD7419] transition"
                            title="Registrar devolución"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {isAdmin && !isConfirmed && (
                          <button
                            onClick={() =>
                              onDeleteItem({
                                collabUserId: collab.userId,
                                itemId: item.id,
                                itemName: item.itemName,
                              })
                            }
                            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition"
                            title="Eliminar asignación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </ItemHeader>
                      <InventoryItemStats item={item} />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Modal — todos los ítems */}
            <Dialog open={showAllItems} onOpenChange={setShowAllItems}>
              <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base">
                    Todos los ítems — {collab.firstName} {collab.lastName}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-muted/40 px-3 py-3 space-y-2.5"
                    >
                      <ItemHeader item={item}>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            getItemQuantities(item).complete
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {getItemQuantities(item).complete
                            ? 'Completo'
                            : 'Pendiente'}
                        </span>
                      </ItemHeader>
                      <InventoryItemStats item={item} />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5">
            <PackageOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground italic">
              Sin inventario asignado
            </p>
          </div>
        )}

        {/* Footer: check-out registrado o botones */}
        <div className="pt-1">
          {hasCheckout ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide font-semibold leading-none">
                    Check-in
                  </p>
                  <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                    {entryTime ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-1 bg-[#DD7419]/5 border border-[#DD7419]/20 rounded-lg px-3 py-2">
                <DoorOpen className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <div>
                  <p className="text-[9px] text-[#DD7419]/60 uppercase tracking-wide font-semibold leading-none">
                    Check-out
                  </p>
                  <p className="text-[12px] font-bold text-[#DD7419]">
                    {exitTime}
                  </p>
                </div>
              </div>
            </div>
          ) : isConfirmed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[#234465]/8 dark:bg-[#7493B2]/10 border border-[#234465]/20 dark:border-[#7493B2]/25 px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#234465] dark:text-[#7493B2] shrink-0" />
                <p className="text-xs font-bold text-[#234465] dark:text-[#7493B2] leading-none">
                  Asignación confirmada
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => onAddMore(collab)}
                  className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold text-[#DD7419] border border-[#DD7419]/25 hover:bg-[#DD7419]/5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Reasignación de inventario
                </button>
              )}
            </div>
          ) : isAdmin ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAssign(collab)}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold text-[#DD7419] border border-[#DD7419]/25 hover:bg-[#DD7419]/5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Asignar inventario
              </button>
              <button
                onClick={() => onRequestConfirm(collab)}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold text-[#234465] dark:text-[#7493B2] border border-[#234465]/25 dark:border-[#7493B2]/30 hover:bg-[#234465]/5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar asignación
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-1">
              Sin inventario asignado aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
