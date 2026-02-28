import { useState } from 'react';
import { Check, Loader2, Briefcase, UtensilsCrossed, Cookie, Search, X, Lock, UserCheck } from 'lucide-react';

const AVATAR_COLORS = [
  'from-[#234465] to-[#3a6b9f]', 'from-[#DD7419] to-[#f59e0b]',
  'from-[#059669] to-[#34d399]', 'from-[#7c3aed] to-[#a78bfa]',
  'from-[#dc2626] to-[#f87171]', 'from-[#0891b2] to-[#67e8f9]',
];

function Avatar({ firstName }) {
  const c = AVATAR_COLORS[(firstName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold text-sm">{(firstName?.[0] ?? '?').toUpperCase()}</span>
    </div>
  );
}

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}
function roleLabel(role) {
  return { supervisor: 'Supervisor', coordinador: 'Coordinador', colaborador: 'Colaborador' }[role] ?? role;
}

const ACTIONS = [
  { key: 'bag',   Icon: Briefcase,      label: 'Maleta',      labelDone: 'Maleta recibida',   color: 'indigo', activeBg: 'bg-indigo-500',  doneBg: 'bg-indigo-50',   doneText: 'text-indigo-700',  doneBorder: 'border-indigo-200' },
  { key: 'lunch', Icon: UtensilsCrossed, label: 'Almuerzo',    labelDone: 'Almuerzo recibido', color: 'amber',  activeBg: 'bg-amber-500',   doneBg: 'bg-amber-50',    doneText: 'text-amber-700',   doneBorder: 'border-amber-200'  },
  { key: 'snack', Icon: Cookie,          label: 'Refrigerio',  labelDone: 'Refrigerio dado',   color: 'rose',   activeBg: 'bg-rose-500',    doneBg: 'bg-rose-50',     doneText: 'text-rose-700',    doneBorder: 'border-rose-200'   },
];

/* ── Card ── */
function CollabCard({ collab, onActionSaved }) {
  const [saving, setSaving] = useState(null); // key del action que está guardando
  const [showSnackDetail, setShowSnackDetail] = useState(false);
  const [snackDetail, setSnackDetail] = useState('');

  const station2 = collab.station2 ?? {};

  const handleToggle = async (key) => {
    if (key === 'snack' && !station2.snack) {
      setShowSnackDetail((v) => !v);
      return;
    }
    setSaving(key);
    // TODO: conectar con saveStation2ActionService(collab.userId, key, !station2[key])
    await new Promise((r) => setTimeout(r, 500));
    onActionSaved(collab.userId, { ...station2, [key]: !station2[key] });
    setSaving(null);
  };

  const handleConfirmSnack = async () => {
    setSaving('snack');
    await new Promise((r) => setTimeout(r, 500));
    onActionSaved(collab.userId, { ...station2, snack: true, snackDetail: snackDetail.trim() || null });
    setSaving(null);
    setShowSnackDetail(false);
  };

  const allDone = ACTIONS.every((a) => station2[a.key]);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      allDone ? 'border-emerald-200' : 'border-border'
    }`}>
      <div className={`h-1 ${allDone ? 'bg-emerald-500' : 'bg-muted'}`} />

      <div className="p-3 space-y-3">
        {/* Info */}
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
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]">{z}</span>
              ))}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(collab.role)}`}>
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

        {/* 3 botones de acción */}
        <div className="grid grid-cols-3 gap-1.5">
          {ACTIONS.map(({ key, Icon, label, labelDone, activeBg, doneBg, doneText, doneBorder }) => {
            const done = !!station2[key];
            const isSaving = saving === key;
            return (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                disabled={!!saving}
                className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 font-semibold text-[11px] transition-all active:scale-95 ${
                  done
                    ? `${doneBg} ${doneText} ${doneBorder}`
                    : 'bg-white border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? activeBg : 'bg-muted'}`}>
                      <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    {done ? labelDone : label}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel detalle refrigerio */}
        {showSnackDetail && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">Detalle del refrigerio <span className="font-normal text-muted-foreground">(opcional)</span></p>
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
                {saving === 'snack' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tab completo Estación 2 ── */
export function Station2Tab({ collaborators, loading, onActionSaved }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'done'

  // Solo muestra quienes pasaron estación 1 (attended = true)
  const eligible = collaborators.filter((c) => c.attendance?.attended);

  const filtered = eligible.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.cedula?.toLowerCase().includes(q);

    const allDone = ['bag', 'lunch', 'snack'].every((k) => c.station2?.[k]);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'done' ? allDone :
      !allDone;

    return matchSearch && matchFilter;
  });

  const stats = {
    total: eligible.length,
    done: eligible.filter((c) => ['bag', 'lunch', 'snack'].every((k) => c.station2?.[k])).length,
    pending: eligible.filter((c) => !['bag', 'lunch', 'snack'].every((k) => c.station2?.[k])).length,
  };

  const notCheckedIn = collaborators.length - eligible.length;

  return (
    <div className="space-y-4">
      {/* Aviso si hay personas sin check-in */}
      {!loading && notCheckedIn > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            <span className="font-bold">{notCheckedIn}</span> {notCheckedIn === 1 ? 'persona no ha' : 'personas no han'} completado el check-in en Estación 1.
          </p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Con check-in</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-[11px] text-amber-600/70 mt-0.5">Pendientes</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
            <p className="text-[11px] text-emerald-600/70 mt-0.5">Completados</p>
          </div>
        </div>
      )}

      {/* Buscador + filtro */}
      {!loading && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar nombre o cédula…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
            {[['all', 'Todos'], ['pending', 'Pendientes'], ['done', 'Listos']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  filter === val ? 'bg-[#234465] text-white' : 'bg-white text-foreground hover:bg-muted'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-3 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-full w-36" />
                  <div className="h-3 bg-muted rounded-full w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((j) => <div key={j} className="h-16 bg-muted rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : eligible.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nadie ha completado el check-in aún</p>
          <p className="text-xs text-muted-foreground mt-1">Las personas aparecerán aquí una vez pasen por Estación 1.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Sin resultados para tu búsqueda.</p>
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