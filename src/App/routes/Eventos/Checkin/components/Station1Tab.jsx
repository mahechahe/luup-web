import { useState } from 'react';
import {
  Check, Loader2, Shirt, ChevronDown, ChevronUp, UserCheck, Clock,
} from 'lucide-react';
import { upsertAttendanceService } from '@/App/routes/Eventos/services/eventServices';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}
function roleLabel(role) {
  return { supervisor: 'Supervisor', coordinador: 'Coordinador', colaborador: 'Colaborador' }[role] ?? role;
}

function CollabCard({ collab, eventId, onAttendanceUpdated, onUniformSaved }) {
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [showUniform, setShowUniform] = useState(false);
  const [selectedSize, setSelectedSize] = useState(collab.uniformSize ?? '');
  const [savingUniform, setSavingUniform] = useState(false);

  const attended = collab.attendance?.attended;
  const entryTime = formatTime(collab.attendance?.entryTime);
  const uniformDone = !!collab.uniformSize;

  const handleAttendance = async () => {
    setSavingAttendance(true);
    const body = {
      eventId: Number(eventId), userId: collab.userId, attended: !attended,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: collab.attendance?.notes ?? null,
    };
    const res = await upsertAttendanceService(body);
    if (res.status) onAttendanceUpdated(collab.userId, { ...body, attended: !attended });
    setSavingAttendance(false);
  };

  const handleSaveUniform = async () => {
    if (!selectedSize) return;
    setSavingUniform(true);
    // TODO: conectar con saveUniformSizeService
    await new Promise((r) => setTimeout(r, 600));
    onUniformSaved(collab.userId, selectedSize);
    setSavingUniform(false);
    setShowUniform(false);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${attended ? 'border-emerald-200' : 'border-border'}`}>
      <div className={`h-1 ${attended ? 'bg-emerald-500' : 'bg-muted'}`} />
      <div className="p-3">
        <div className="flex items-start gap-3">
          <Avatar firstName={collab.firstName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{collab.firstName} {collab.lastName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{collab.cedula} · {collab.phone ?? '—'}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {collab.zones?.map((z, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]">{z}</span>
              ))}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(collab.role)}`}>
                {roleLabel(collab.role)}
              </span>
            </div>
          </div>
          {entryTime && (
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <Clock className="w-3 h-3" />{entryTime}
              </div>
              <p className="text-[10px] text-muted-foreground">entrada</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 mb-3">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${attended ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
            <Check className="w-3 h-3" />Check-in
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${uniformDone ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
            <Shirt className="w-3 h-3" />
            {uniformDone ? `Uniforme · ${collab.uniformSize}` : 'Uniforme pendiente'}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleAttendance} disabled={savingAttendance}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              attended ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            }`}
          >
            {savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : attended ? (
              <><Check className="w-4 h-4" strokeWidth={3} /> Asistió</>
            ) : (
              <><div className="w-4 h-4 rounded border-2 border-muted-foreground/40" /> No asistió</>
            )}
          </button>
          <button onClick={() => setShowUniform((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all border ${
              uniformDone ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-white border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Shirt className="w-4 h-4" />Uniforme
            {showUniform ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showUniform && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            <p className="text-xs font-semibold text-foreground">Seleccionar talla</p>
            <div className="grid grid-cols-6 gap-1.5">
              {SIZES.map((size) => (
                <button key={size} onClick={() => setSelectedSize(size)}
                  className={`h-9 rounded-lg text-xs font-bold transition-all border-2 ${
                    selectedSize === size ? 'bg-[#234465] border-[#234465] text-white' : 'bg-white border-border text-foreground hover:border-[#234465]/50'
                  }`}
                >{size}</button>
              ))}
            </div>
            <button onClick={handleSaveUniform} disabled={!selectedSize || savingUniform}
              className="w-full h-9 rounded-xl bg-[#234465] text-white text-sm font-semibold hover:bg-[#234465]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {savingUniform ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar entrega'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Station1Tab({ collaborators, loading, eventId, pageSize, currentPage, filter, onAttendanceUpdated, onUniformSaved }) {
  const filtered = collaborators.filter((c) => {
    const done = !!c.attendance?.attended;
    if (filter === 'done') return done;
    if (filter === 'pending') return !done;
    return true;
  });

  const startIdx = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  const stats = {
    total: collaborators.length,
    checked: collaborators.filter((c) => c.attendance?.attended).length,
    uniform: collaborators.filter((c) => c.uniformSize).length,
  };

  return (
    <div className="space-y-4">
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.checked}</p>
            <p className="text-[11px] text-emerald-600/70 mt-0.5">Check-in</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.uniform}</p>
            <p className="text-[11px] text-blue-600/70 mt-0.5">Uniformes</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-3 animate-pulse space-y-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-full w-36" />
                  <div className="h-3 bg-muted rounded-full w-24" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 h-10 bg-muted rounded-xl" />
                <div className="flex-1 h-10 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Sin resultados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((collab) => (
            <CollabCard
              key={collab.userId}
              collab={collab}
              eventId={eventId}
              onAttendanceUpdated={onAttendanceUpdated}
              onUniformSaved={onUniformSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}