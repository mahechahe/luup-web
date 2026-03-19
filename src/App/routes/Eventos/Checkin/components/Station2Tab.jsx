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
import { updateDeliveryService, confirmAssignmentService } from '@/App/routes/Eventos/services/eventServices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465] dark:bg-[#234465]/20 dark:text-[#7493B2]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}
function roleLabel(role) {
  return (
    {
      supervisor: 'Supervisor',
      coordinador: 'Coordinador',
      colaborador: 'Colaborador',
    }[role] ?? role
  );
}

// key = clave local en station2 | type = valor que espera la API
const ACTIONS = [
  {
    key: 'suitcase',
    type: 'suitcase',
    Icon: Briefcase,
    label: 'Maleta',
    labelDone: 'Maleta recibida',
    activeBg: 'bg-indigo-500',
    doneBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    doneText: 'text-indigo-700 dark:text-indigo-300',
    doneBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    key: 'lunch',
    type: 'lunch',
    Icon: UtensilsCrossed,
    label: 'Almuerzo',
    labelDone: 'Almuerzo recibido',
    activeBg: 'bg-amber-500',
    doneBg: 'bg-amber-50 dark:bg-amber-900/30',
    doneText: 'text-amber-700 dark:text-amber-300',
    doneBorder: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'snack',
    type: 'snack',
    Icon: Cookie,
    label: 'Refrigerio',
    labelDone: 'Refrigerio dado',
    activeBg: 'bg-red-600',
    doneBg: 'bg-red-50 dark:bg-red-900/30',
    doneText: 'text-red-700 dark:text-red-300',
    doneBorder: 'border-red-300 dark:border-red-800',
    requiresDetail: true,
  },
];

function CollabCard({ collab, onActionSaved }) {
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
  const assignConfirmed = collab.attendance?.confirmStation2 === true;
  const allDone = !!station2.snack;
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
      onActionSaved(collab.userId, type, snackDetail.trim() || null, newReceived);
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
      <div className={`h-1 ${assignConfirmed ? 'bg-emerald-500' : allDone ? 'bg-[#DD7419]' : 'bg-muted'}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">
              {collab.firstName} {collab.lastName}
            </p>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Cédula:</span>{' '}
                <span className="font-semibold">{collab.cedula}</span>
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Celular:</span>{' '}
                <span className="font-semibold">{collab.phone ?? '—'}</span>
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Zonas:</span>{' '}
                <span className="font-semibold">
                  {collab.zones?.join(', ') || '—'}
                </span>
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Rol:</span>{' '}
                <span
                  className={`font-semibold text-[11px] px-2 py-0.5 rounded-md ${roleBadgeClass(
                    collab.role
                  )}`}
                >
                  {roleLabel(collab.role)}
                </span>
              </p>
            </div>
          </div>
          {assignConfirmed && (
            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {ACTIONS.map(({ key, type, Icon, label, requiresDetail, doneBg, doneText, doneBorder }) => {
            const done = !!station2[key];
            const isSaving = saving === key;
            const canUndo = done && !assignConfirmed;
            return (
              <button
                key={key}
                onClick={() => handleToggle(key, type)}
                disabled={!!saving || assignConfirmed}
                className={`relative flex items-center gap-2 h-10 px-4 rounded-xl border-2 font-semibold text-xs transition-all group ${
                  done
                    ? `${doneBg} ${doneText} ${doneBorder} ${canUndo ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'}`
                    : 'bg-card border-border text-muted-foreground hover:bg-muted active:scale-95'
                }`}
              >
                {requiresDetail && !done && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600" />
                )}
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : done ? (
                  <>
                    <Check className="w-4 h-4 group-hover:hidden" strokeWidth={3} />
                    {canUndo && <X className="w-4 h-4 hidden group-hover:block" />}
                  </>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span>{label}</span>
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
          onClick={() => { if (allDone && !assignConfirmed && !saving) setShowConfirm(true); }}
          disabled={!allDone || assignConfirmed || !!saving}
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

        {notes && (
          <p
            className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 italic mb-2"
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold not-italic">Nota: </span>
            {notes}
          </p>
        )}

        <Dialog open={showSnackDetail} onOpenChange={(open) => { if (!open && saving !== 'snack') { setShowSnackDetail(false); setSnackDetail(''); } }}>
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
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: jugo + galletas…"
                  value={snackDetail}
                  onChange={(e) => setSnackDetail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSnack(); }}
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                onClick={() => { setShowSnackDetail(false); setSnackDetail(''); }}
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

        <Dialog open={showConfirm} onOpenChange={(open) => { if (!open && saving !== 'confirm') setShowConfirm(false); }}>
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
              será habilitado para la Estación 3 y ya no podrá ser gestionado aquí.
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

export function Station2Tab({ collaborators, loading, onActionSaved }) {
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
                  <div key={j} className="h-16 bg-muted rounded-xl" />
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
              onActionSaved={onActionSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
