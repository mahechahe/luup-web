import { useState } from 'react';
import {
  Check,
  Loader2,
  Briefcase,
  UtensilsCrossed,
  Cookie,
  Lock,
  UserCheck,
} from 'lucide-react';
import { updateDeliveryService } from '@/App/routes/Eventos/services/eventServices';

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
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
    doneBg: 'bg-indigo-50',
    doneText: 'text-indigo-700',
    doneBorder: 'border-indigo-200',
  },
  {
    key: 'lunch',
    type: 'lunch',
    Icon: UtensilsCrossed,
    label: 'Almuerzo',
    labelDone: 'Almuerzo recibido',
    activeBg: 'bg-amber-500',
    doneBg: 'bg-amber-50',
    doneText: 'text-amber-700',
    doneBorder: 'border-amber-200',
  },
  {
    key: 'snack',
    type: 'snack',
    Icon: Cookie,
    label: 'Refrigerio',
    labelDone: 'Refrigerio dado',
    activeBg: 'bg-red-600',
    doneBg: 'bg-red-50',
    doneText: 'text-red-700',
    doneBorder: 'border-red-300',
    requiresDetail: true,
  },
];

function CollabCard({ collab, onActionSaved }) {
  const [saving, setSaving] = useState(null);
  const [showSnackDetail, setShowSnackDetail] = useState(false);
  const [snackDetail, setSnackDetail] = useState('');

  // Normaliza: después de guardar localmente usa collab.station2;
  // en la carga inicial lee los campos que devuelve el API.
  const station2 = {
    suitcase: collab.attendance?.receivedSuitcase ?? false,
    lunch: collab.attendance?.receivedLunch ?? false,
    snack: collab.attendance?.receivedSnack ?? false,
    snackDetail: collab.attendance?.snackDetail ?? null,
  };
  const attendanceId = collab.attendance?.id ?? collab.attendance?.attendanceId;
  const allDone = !!station2.snack;
  const notes = collab.attendance?.notes ?? collab.notes ?? null;

  const handleToggle = async (key, type) => {
    // Refrigerio sin marcar → pedir detalle primero
    if (key === 'snack' && !station2.snack) {
      setShowSnackDetail((v) => !v);
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
      onActionSaved(collab.userId, type, snackDetail.trim() || null);
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

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        allDone ? 'border-emerald-200' : 'border-border'
      }`}
    >
      <div className={`h-1 ${allDone ? 'bg-emerald-500' : 'bg-muted'}`} />
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
          {allDone && (
            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {ACTIONS.map(
            ({
              key,
              type,
              Icon,
              label,
              labelDone,
              requiresDetail,
              activeBg,
              doneBg,
              doneText,
              doneBorder,
            }) => {
              const done = !!station2[key];
              const isSaving = saving === key;
              return (
                <button
                  key={key}
                  onClick={() => handleToggle(key, type)}
                  disabled={!!saving || done}
                  className={`relative flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 font-semibold text-[11px] transition-all ${
                    done
                      ? `${doneBg} ${doneText} ${doneBorder} cursor-default opacity-80`
                      : 'bg-white border-border text-muted-foreground hover:bg-muted active:scale-95'
                  }`}
                >
                  {requiresDetail && !done && (
                    <span className="absolute top-1 right-1 text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full leading-none tracking-wide">
                      Obligatorio
                    </span>
                  )}
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          done ? activeBg : 'bg-muted'
                        }`}
                      >
                        {done ? (
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        ) : (
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="leading-tight text-center">
                        {done ? labelDone : label}
                      </span>
                    </>
                  )}
                </button>
              );
            }
          )}
        </div>

        {notes && (
          <p
            className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 italic mb-2"
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold not-italic">Nota: </span>
            {notes}
          </p>
        )}

        {station2.snack && station2.snackDetail && (
          <p className="text-[11px] text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5 italic">
            Refrigerio: {station2.snackDetail}
          </p>
        )}

        {showSnackDetail && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground ">
              Detalle del refrigerio{' '}
              <span
                className="font-normal text-muted-foreground"
                style={{
                  marginTop: '10px',
                }}
              >
                (opcional)
              </span>
            </p>
            <input
              type="text"
              placeholder="Ej: jugo + galletas…"
              value={snackDetail}
              onChange={(e) => setSnackDetail(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSnackDetail(false)}
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
            </div>
          </div>
        )}
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
              className="bg-white rounded-2xl border p-3 animate-pulse space-y-3"
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
