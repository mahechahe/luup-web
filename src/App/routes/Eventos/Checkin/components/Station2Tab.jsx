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

const AVATAR_COLORS = [
  'from-[#234465] to-[#3a6b9f]',
  'from-[#DD7419] to-[#f59e0b]',
  'from-[#059669] to-[#34d399]',
  'from-[#7c3aed] to-[#a78bfa]',
  'from-[#dc2626] to-[#f87171]',
  'from-[#0891b2] to-[#67e8f9]',
];

function Avatar({ firstName }) {
  const c =
    AVATAR_COLORS[(firstName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center shrink-0`}
    >
      <span className="text-white font-bold text-sm">
        {(firstName?.[0] ?? '?').toUpperCase()}
      </span>
    </div>
  );
}

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
    activeBg: 'bg-rose-500',
    doneBg: 'bg-rose-50',
    doneText: 'text-rose-700',
    doneBorder: 'border-rose-200',
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
      onActionSaved(collab.userId, { ...station2, [key]: newReceived });
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
      onActionSaved(collab.userId, {
        ...station2,
        snack: true,
        snackDetail: snackDetail.trim() || null,
      });
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
      <div className="p-3 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar firstName={collab.firstName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {collab.firstName} {collab.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {collab.cedula} · {collab.phone ?? '—'}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {collab.zones?.map((z, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]"
                >
                  {z}
                </span>
              ))}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(
                  collab.role
                )}`}
              >
                {roleLabel(collab.role)}
              </span>
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
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
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
                      <span>
                        {done ? labelDone : label}{' '}
                        {requiresDetail && !done && (
                          <span className="text-[9px] text-rose-500 font-bold leading-none">
                            (Obligatorio)
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            }
          )}
        </div>

        {station2.snack && station2.snackDetail && (
          <p className="text-[11px] text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5 italic">
            Refrigerio: {station2.snackDetail}
          </p>
        )}

        {showSnackDetail && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Detalle del refrigerio{' '}
              <span className="font-normal text-muted-foreground">
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
                className="flex-1 h-9 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition flex items-center justify-center gap-1.5"
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

export function Station2Tab({ collaborators, loading, filter, onActionSaved }) {
  const eligible = collaborators.filter((c) => c.attendance?.attended);
  const notCheckedIn = collaborators.length - eligible.length;

  const isSnackDone = (c) => !!(c.station2?.snack ?? c.receivedSnack);

  const filtered = eligible.filter((c) => {
    if (filter === 'done') return isSnackDone(c);
    if (filter === 'pending') return !isSnackDone(c);
    return true;
  });

  const stats = {
    total: eligible.length,
    done: eligible.filter(isSnackDone).length,
    pending: eligible.filter((c) => !isSnackDone(c)).length,
  };

  return (
    <div className="space-y-4">
      {!loading && notCheckedIn > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            <span className="font-bold">{notCheckedIn}</span>{' '}
            {notCheckedIn === 1 ? 'persona no ha' : 'personas no han'}{' '}
            completado el check-in en Estación 1.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border p-3 animate-pulse space-y-3"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-full w-36" />
                  <div className="h-3 bg-muted rounded-full w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-16 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : eligible.length === 0 ? (
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Sin resultados para este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((collab) => (
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
