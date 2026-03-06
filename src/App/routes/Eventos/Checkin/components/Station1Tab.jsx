import { upsertAttendanceService } from '@/App/routes/Eventos/services/eventServices';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Shirt,
  SquarePlus,
  UserCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
  return (
    {
      supervisor: 'Supervisor',
      coordinador: 'Coordinador',
      colaborador: 'Colaborador',
    }[role] ?? role
  );
}

function CollabCard({
  collab,
  eventId,
  onAttendanceUpdated,
  onUniformSaved,
  onEdit,
}) {
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [showUniform, setShowUniform] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    collab.uniformSize ?? collab.attendance?.uniformSize ?? ''
  );
  const [savingUniform, setSavingUniform] = useState(false);

  // Sincroniza el selector si el prop cambia (ej. tras guardar desde el modal)
  useEffect(() => {
    setSelectedSize(collab.uniformSize ?? collab.attendance?.uniformSize ?? '');
  }, [collab.uniformSize, collab.attendance?.uniformSize]);

  const attended = collab.attendance?.attended;
  const entryTime = formatTime(collab.attendance?.entryTime);
  const notes = collab.attendance?.notes;
  // Uniforme puede venir al nivel del colaborador o anidado en attendance
  const uniformSize =
    collab.uniformSize ?? collab.attendance?.uniformSize ?? null;
  const uniformDone =
    collab.uniform ||
    !!collab.uniformSize ||
    collab.attendance?.uniform ||
    !!collab.attendance?.uniformSize;

  const handleAttendance = async () => {
    setSavingAttendance(true);
    const body = {
      eventId: Number(eventId),
      userId: collab.userId,
      attended: !attended,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: collab.attendance?.notes ?? null,
    };
    const res = await upsertAttendanceService(body);

    if (res.status)
      // res.data es el objeto completo de la API: { id, attended, entryTime, ... }
      onAttendanceUpdated(collab.userId, res.data?.data);
    setSavingAttendance(false);
  };

  const handleSaveUniform = async () => {
    if (!selectedSize) return;
    setSavingUniform(true);
    const body = {
      eventId: Number(eventId),
      userId: collab.userId,
      attended: collab.attendance?.attended ?? false,
      entryTime: collab.attendance?.entryTime ?? null,
      exitTime: collab.attendance?.exitTime ?? null,
      notes: collab.attendance?.notes ?? null,
      uniform: true,
      uniformSize: selectedSize,
    };
    const res = await upsertAttendanceService(body);
    if (res.status) {
      onAttendanceUpdated(collab.userId, res.data?.data);
      onUniformSaved(collab.userId, selectedSize);
      setShowUniform(false);
    }
    setSavingUniform(false);
  };

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        attended ? 'border-emerald-200' : 'border-border'
      }`}
    >
      <div className={`h-1 ${attended ? 'bg-emerald-500' : 'bg-muted'}`} />
      <div className="p-4">
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
          <div className="shrink-0 flex flex-col items-end gap-2">
            {attended ? (
              entryTime ? (
                <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 min-w-[64px]">
                  <Clock className="w-4 h-4 text-emerald-500 mb-1" />
                  <span className="text-[13px] font-extrabold text-emerald-700 leading-none">
                    {entryTime}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-500 mt-1">
                    Check-in
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 min-w-[64px]">
                  <Clock className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="text-[11px] font-bold text-amber-700 leading-tight text-center">
                    Sin hora
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 mt-1">
                    Check-in
                  </span>
                </div>
              )
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(collab)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
              title="Editar asistencia"
            >
              <SquarePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              attended
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Check className="w-3 h-3" />
            Check-in
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              uniformDone
                ? 'bg-blue-100 text-blue-700'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Shirt className="w-3 h-3" />
            {uniformDone ? `Uniforme · ${uniformSize}` : 'Uniforme pendiente'}
          </div>
        </div>

        {notes && (
          <p
            className="text-[11px] text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5 mb-3 italic"
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold">Nota: </span>
            {notes}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAttendance}
            disabled={savingAttendance}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              attended
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            }`}
          >
            {savingAttendance ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : attended ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} /> Asistió
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded border-2 border-muted-foreground/40" />{' '}
                No asistió
              </>
            )}
          </button>
          <button
            onClick={() => setShowUniform((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all border ${
              uniformDone
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-white border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Uniforme
            {showUniform ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showUniform && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Seleccionar talla
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-9 rounded-lg text-xs font-bold transition-all border-2 ${
                    selectedSize === size
                      ? 'bg-[#234465] border-[#234465] text-white'
                      : 'bg-white border-border text-foreground hover:border-[#234465]/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveUniform}
              disabled={!selectedSize || savingUniform}
              className="w-full h-9 rounded-xl bg-[#234465] text-white text-sm font-semibold hover:bg-[#234465]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {savingUniform ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar entrega'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Station1Tab({
  collaborators,
  loading,
  eventId,
  pageSize,
  currentPage,
  filter,
  onAttendanceUpdated,
  onUniformSaved,
  onEdit,
}) {
  const filtered = collaborators.filter((c) => {
    const done = !!c.attendance?.attended;
    if (filter === 'done') return done;
    if (filter === 'pending') return !done;
    return true;
  });

  const startIdx = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-3 animate-pulse space-y-2"
            >
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-full w-40" />
                <div className="h-3 bg-muted rounded-full w-28" />
                <div className="h-3 bg-muted rounded-full w-24" />
                <div className="h-3 bg-muted rounded-full w-20" />
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 h-10 bg-muted rounded-xl" />
                <div className="flex-1 h-10 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No hay registros de Check-in para esta fecha
          </p>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
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
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
