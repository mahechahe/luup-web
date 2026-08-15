import { useState } from 'react';
import {
  Check,
  Loader2,
  Briefcase,
  UtensilsCrossed,
  Cookie,
  UserCheck,
  ClipboardCheck,
  X,
} from 'lucide-react';
import {
  updateDeliveryService,
  confirmAssignmentService,
} from '@/App/routes/Eventos/services/eventServices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CollabIdentity, CollabNote } from './CollabIdentity';
import { StageBadge } from './StageBadge';
import { STAGES, getStage, isPastStage } from '../utils/stages';

// key = clave local en station2 | type = valor que espera la API
// El color de acento solo identifica la categoría en estado pendiente;
// "completado" siempre se ve en verde esmeralda, igual que en el resto de la app.
const ACTIONS = [
  {
    key: 'suitcase',
    type: 'suitcase',
    Icon: Briefcase,
    label: 'Maleta',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconText: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'lunch',
    type: 'lunch',
    Icon: UtensilsCrossed,
    label: 'Almuerzo',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'snack',
    type: 'snack',
    Icon: Cookie,
    label: 'Refrigerio',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconText: 'text-rose-600 dark:text-rose-400',
    requiresDetail: true,
  },
];

function CollabCard({ collab, isAdmin, onActionSaved, onTimeline }) {
  const [saving, setSaving] = useState(null);
  const [showSnackDetail, setShowSnackDetail] = useState(false);
  const [snackDetail, setSnackDetail] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Normaliza: después de guardar localmente usa collab.station2;
  // en la carga inicial lee los campos que devuelve el API.
  const station2 = {
    suitcase: collab.attendance?.receivedSuitcase ?? false,
    lunch: collab.attendance?.receivedLunch ?? false,
    snack: collab.attendance?.receivedSnack ?? false,
    snackDetail: collab.attendance?.snackDetail ?? null,
  };
  const attendanceId = collab.attendance?.id ?? collab.attendance?.attendanceId;
  // Ya pasó de la Estación 2: la tarjeta queda en modo consulta.
  const assignConfirmed = isPastStage(getStage(collab), STAGES.ESTACION_2);
  const allDone = !!station2.snack;
  const doneCount = ACTIONS.filter(({ key }) => !!station2[key]).length;
  const notes = collab.attendance?.notes ?? collab.notes ?? null;

  const handleToggle = async (key, type) => {
    // Refrigerio sin marcar → abrir modal de detalle
    if (key === 'snack' && !station2.snack) {
      setShowSnackDetail(true);
      return;
    }

    setSaving(key);
    const newReceived = !station2[key];
    const res = await updateDeliveryService({
      attendanceId,
      type,
      received: newReceived,
    });
    if (res.status) {
      onActionSaved(
        collab.userId,
        type,
        snackDetail.trim() || null,
        newReceived
      );
    }
    setSaving(null);
  };

  const handleConfirmSnack = async () => {
    setSaving('snack');
    const res = await updateDeliveryService({
      attendanceId,
      type: 'snack',
      received: true,
      snackDetail: snackDetail.trim() || undefined,
    });
    if (res.status) {
      onActionSaved(collab.userId, 'snack', snackDetail.trim() || null);
      setShowSnackDetail(false);
    }
    setSaving(null);
  };

  const handleConfirmAssignment = async () => {
    setSaving('confirm');
    const res = await confirmAssignmentService(attendanceId);
    if (res.status) {
      onActionSaved(collab.userId, 'confirm', null);
      setShowConfirm(false);
    }
    setSaving(null);
  };

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        assignConfirmed
          ? 'border-emerald-200 dark:border-emerald-800'
          : allDone
            ? 'border-[#DD7419]/30'
            : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${
          assignConfirmed
            ? 'bg-emerald-500'
            : allDone
              ? 'bg-[#DD7419]'
              : 'bg-muted'
        }`}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CollabIdentity collab={collab} />
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <StageBadge
              stage={getStage(collab)}
              onClick={onTimeline && (() => onTimeline(collab))}
            />
            {assignConfirmed && (
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Entregas
            </span>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                doneCount === ACTIONS.length
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {doneCount}/{ACTIONS.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ACTIONS.map(({ key, type, Icon, label, requiresDetail, iconBg, iconText }) => {
              const done = !!station2[key];
              const isSaving = saving === key;
              const canUndo = done && !assignConfirmed;
              return (
                <button
                  key={key}
                  onClick={() => handleToggle(key, type)}
                  disabled={!isAdmin || !!saving || assignConfirmed}
                  className={`relative flex items-center gap-1.5 h-11 px-2 rounded-xl border font-semibold text-[11px] leading-tight transition-all ${
                    isSaving ? 'opacity-60' : ''
                  } ${
                    done
                      ? `bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/25 dark:border-emerald-800 dark:text-emerald-300 ${
                          canUndo ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40' : 'cursor-default'
                        }`
                      : 'bg-card border-border text-foreground hover:border-muted-foreground/30 hover:bg-muted active:scale-95'
                  }`}
                >
                  {requiresDetail && !done && !isSaving && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                  {canUndo && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                      {isSaving ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <X className="w-2.5 h-2.5" strokeWidth={3} />
                      )}
                    </span>
                  )}
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      done ? 'bg-emerald-500 text-white' : `${iconBg} ${iconText}`
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : done ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          {station2.snack && station2.snackDetail && (
            <div className="flex items-center gap-1.5">
              <Cookie className="w-3 h-3 text-red-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {station2.snackDetail}
              </span>
            </div>
          )}
        </div>

        {/* Confirmar asignación */}
        <button
          onClick={() => {
            if (isAdmin && allDone && !assignConfirmed && !saving) setShowConfirm(true);
          }}
          disabled={!isAdmin || !allDone || assignConfirmed || !!saving}
          className={`w-full h-9 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition border-2 ${
            assignConfirmed
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 cursor-default'
              : !allDone
                ? 'bg-muted border-border text-muted-foreground opacity-40 cursor-not-allowed'
                : 'bg-[#234465] text-white hover:bg-[#234465]/90 border-transparent'
          }`}
        >
          {saving === 'confirm' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : assignConfirmed ? (
            <>
              <Check className="w-4 h-4" strokeWidth={3} />
              Asignación confirmada
            </>
          ) : (
            <>
              <ClipboardCheck className="w-4 h-4" />
              Confirmar asignación
            </>
          )}
        </button>

        <CollabNote note={notes} />

        <Dialog
          open={showSnackDetail}
          onOpenChange={(open) => {
            if (!open && saving !== 'snack') {
              setShowSnackDetail(false);
              setSnackDetail('');
            }
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-red-600" />
                Registrar refrigerio
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <p className="text-sm text-muted-foreground">
                Colaborador:{' '}
                <span className="font-semibold text-foreground">
                  {collab.firstName} {collab.lastName}
                </span>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Detalle{' '}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: jugo + galletas…"
                  value={snackDetail}
                  onChange={(e) => setSnackDetail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmSnack();
                  }}
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                onClick={() => {
                  setShowSnackDetail(false);
                  setSnackDetail('');
                }}
                disabled={saving === 'snack'}
                className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSnack}
                disabled={saving === 'snack'}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1.5"
              >
                {saving === 'snack' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showConfirm}
          onOpenChange={(open) => {
            if (!open && saving !== 'confirm') setShowConfirm(false);
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#234465]" />
                ¿Confirmar asignación de la Estación 2?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                {collab.firstName} {collab.lastName}
              </span>{' '}
              será habilitado para la Estación 3 y ya no podrá ser gestionado
              aquí.
            </p>
            <DialogFooter>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving === 'confirm'}
                className="w-full py-3 sm:py-2 sm:px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={saving === 'confirm'}
                className="w-full py-3 sm:py-2 sm:px-4 rounded-lg bg-[#234465] text-white text-sm font-semibold hover:bg-[#234465]/90 transition flex items-center justify-center gap-1.5"
              >
                {saving === 'confirm' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function Station2Tab({
  collaborators,
  loading,
  isAdmin = true,
  onActionSaved,
  onTimeline,
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border p-3 animate-pulse space-y-3"
            >
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-full w-40" />
                <div className="h-3 bg-muted rounded-full w-28" />
                <div className="h-3 bg-muted rounded-full w-24" />
                <div className="h-3 bg-muted rounded-full w-20" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-11 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nadie ha completado el check-in aún
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Las personas aparecerán aquí una vez pasen por Estación 1.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <CollabCard
              key={collab.userId}
              collab={collab}
              isAdmin={isAdmin}
              onActionSaved={onActionSaved}
              onTimeline={onTimeline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
