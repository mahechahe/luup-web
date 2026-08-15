import {
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  Cookie,
  CornerUpLeft,
  DoorOpen,
  Package,
  PackageOpen,
  Shirt,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { formatColombiaTime } from '@/App/utils/functions/colombiaDate';
import { getItemQuantities } from '../utils/collaborators';
import { CollabIdentity, CollabNote } from './CollabIdentity';
import { InventoryItemStats } from './InventoryItemStats';
import { StageBadge } from './StageBadge';
import {
  getStage,
  isFinished,
  previousStage,
  stageMeta,
} from '../utils/stages';

function AttendancePill({ icon: Icon, label, received, detail }) {
  const active = received === true;
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
        active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
          : 'bg-muted/50 border-border text-muted-foreground'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {active && detail && (
        <span className="text-[10px] font-normal opacity-75">· {detail}</span>
      )}
    </div>
  );
}

function CheckinStamp({ attended, entryTime }) {
  if (!attended) {
    return (
      <div className="flex flex-col items-center bg-muted border border-border rounded-2xl px-3 py-2 min-w-[64px]">
        <Clock className="w-4 h-4 text-muted-foreground mb-1" />
        <span className="text-[11px] font-bold text-muted-foreground leading-tight text-center">
          Sin registro
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-1">
          Check-in
        </span>
      </div>
    );
  }

  if (!entryTime) {
    return (
      <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-3 py-2 min-w-[64px]">
        <Clock className="w-4 h-4 text-amber-500 mb-1" />
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-tight text-center">
          Sin hora
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400 mt-1">
          Check-in
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-3 py-2 min-w-[64px]">
      <Clock className="w-4 h-4 text-emerald-500 mb-1" />
      <span className="text-[13px] font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
        {entryTime}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mt-1">
        Check-in
      </span>
    </div>
  );
}

/** Tarjeta de colaborador de la Estación 4 (check-out y calificación). */
export function Station4CollabCard({
  collab,
  onCheckout,
  onRate,
  onRevert,
  onTimeline,
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const att = collab.attendance ?? {};
  const items = collab.inventoryItems ?? [];
  const entryTime = formatColombiaTime(att.entryTime);
  const exitTime = formatColombiaTime(att.exitTime);
  const stage = getStage(collab);
  const isCheckedOut = isFinished(stage);
  const uniformReceived = att.uniform ?? collab.uniform ?? false;
  const uniformSize = att.uniformSize ?? collab.uniformSize ?? null;

  const totalPending = items.reduce(
    (acc, i) => acc + (i.quantity - (i.returnedQuantity ?? 0)),
    0
  );
  const allReturned = items.length > 0 && totalPending === 0;

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        allReturned
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${allReturned ? 'bg-emerald-500' : 'bg-[#DD7419]'}`}
      />
      <div className="p-4 space-y-3">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <CollabIdentity collab={collab} />
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              {onRevert && previousStage(stage) && (
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
            <CheckinStamp attended={att.attended} entryTime={entryTime} />
          </div>
        </div>

        {(att.notes ?? collab.notes) && (
          <div className="pb-2">
            <CollabNote note={att.notes ?? collab.notes} />
          </div>
        )}

        {/* Recibió: Uniforme, Maleta, Almuerzo, Refrigerio */}
        <div className="flex flex-wrap gap-1.5">
          <AttendancePill
            icon={Shirt}
            label="Uniforme"
            received={uniformReceived}
            detail={uniformSize}
          />
          <AttendancePill
            icon={Briefcase}
            label="Maleta"
            received={att.receivedSuitcase}
          />
          <AttendancePill
            icon={UtensilsCrossed}
            label="Almuerzo"
            received={att.receivedLunch}
          />
          <AttendancePill
            icon={Cookie}
            label="Refrigerio"
            received={att.receivedSnack}
            detail={att.snackDetail}
          />
        </div>

        {/* Inventario */}
        {items.length > 0 ? (
          <div>
            <button
              onClick={() => setItemsExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">
                  {itemsExpanded ? 'Ocultar ítems' : 'Ver ítems'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    allReturned
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-[#DD7419]/10 text-[#DD7419]'
                  }`}
                >
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <ChevronDown
                className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                style={{
                  transform: itemsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {itemsExpanded && (
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-muted/40 px-3 py-3 space-y-2.5"
                  >
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
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          getItemQuantities(item).complete
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {getItemQuantities(item).complete
                          ? 'Completo'
                          : 'Pendiente'}
                      </span>
                    </div>
                    <InventoryItemStats item={item} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <PackageOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground italic">
              Sin inventario asignado
            </p>
          </div>
        )}

        {/* Checkout + Calificar */}
        <div className="flex items-center gap-2">
          {isCheckedOut ? (
            <div className="flex items-center gap-2 flex-1 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-3 py-2.5 min-w-0">
              <DoorOpen className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Check-out registrado
                </p>
                <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 truncate">
                  Salida: {exitTime}
                  {att.returnedUniform != null && (
                    <>
                      {' '}
                      · Unif.: {att.returnedUniform ? 'devuelto' : 'no dev.'}
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            onCheckout && (
              <button
                onClick={() => onCheckout(collab)}
                className="flex-1 h-10 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <DoorOpen className="w-4 h-4" />
                Checkout
              </button>
            )
          )}
          {onRate && (
            <button
              onClick={() => onRate(collab)}
              className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-semibold transition flex items-center gap-1.5 shrink-0"
            >
              <Star className="w-3.5 h-3.5" />
              Calificar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
