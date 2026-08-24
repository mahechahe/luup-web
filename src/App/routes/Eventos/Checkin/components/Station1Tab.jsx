import { upsertAttendanceService } from '@/App/routes/Eventos/services/eventServices';
import {
  formatColombiaTime,
  formatDateRegisterLong,
} from '@/App/utils/functions/colombiaDate';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Loader2,
  Shirt,
  SquarePlus,
  UserCheck,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { CollabIdentity } from './CollabIdentity';
import { MarkAbsentModal } from './MarkAbsentModal';
import { MarkAttendedModal } from './MarkAttendedModal';
import { StageBadge } from './StageBadge';
import { getStage, isFinished } from '../utils/stages';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function CollabCard({
  collab,
  eventId,
  dateRegister,
  isAdmin,
  onAttendanceUpdated,
  onUniformSaved,
  onEdit,
  onTimeline,
}) {
  // Quien todavía no tiene fila de asistencia no trae fecha en `attendance`:
  // manda la del día abierto en el tablero, o el registro se crearía suelto.
  const targetDate = collab.attendance?.dateRegister ?? dateRegister;
  const [attendedModalOpen, setAttendedModalOpen] = useState(false);
  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  const [showUniform, setShowUniform] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    collab.uniformSize ?? collab.attendance?.uniformSize ?? ''
  );
  const [savingUniform, setSavingUniform] = useState(false);

  // Sincroniza el selector si el prop cambia (ej. tras guardar desde el modal)
  useEffect(() => {
    setSelectedSize(collab.uniformSize ?? collab.attendance?.uniformSize ?? '');
  }, [collab.uniformSize, collab.attendance?.uniformSize]);

  const stage = getStage(collab);
  // La jornada ya cerró: la tarjeta pasa a consulta en vez de ofrecer check-in.
  const finished = isFinished(stage);
  const attended = collab.attendance?.attended;
  const entryTime = formatColombiaTime(collab.attendance?.entryTime);
  const exitTime = formatColombiaTime(collab.attendance?.exitTime);
  const notes = collab.attendance?.notes;
  // El uniforme es estado del EVENTO: se entrega un día y se devuelve otro.
  // `uniformHolding` viene del API ya resuelto a lo largo de todos los días.
  const holding = collab.uniformHolding ?? null;
  const uniformSize =
    holding?.size ??
    collab.uniformSize ??
    collab.attendance?.uniformSize ??
    null;
  const uniformDone = !!holding || !!uniformSize;
  // Se le entregó hoy mismo (vs. lo trae de un día anterior)
  const deliveredToday =
    collab.uniform === true || collab.attendance?.uniform === true;
  const holdingFromPreviousDay = !!holding && !deliveredToday;
  const holdingDate = formatDateRegisterLong(holding?.deliveredOn);
  // No tiene sentido entregar uniforme a quien no asistió, ni entregar uno
  // nuevo a quien ya tiene uno en su poder de un día anterior: generaría dos
  // uniformes asignados. El cambio/devolución de talla se maneja aparte.
  const canRegisterUniform = attended !== false && !holdingFromPreviousDay;

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
      dateRegister: targetDate,
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
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        attended === true
          ? 'border-emerald-200 dark:border-emerald-800'
          : attended === false
            ? 'border-rose-200 dark:border-rose-900'
            : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${
          attended === true
            ? 'bg-emerald-500'
            : attended === false
              ? 'bg-rose-400'
              : 'bg-muted'
        }`}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <CollabIdentity collab={collab} />
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <StageBadge
                stage={stage}
                onClick={onTimeline && (() => onTimeline(collab))}
              />
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(collab)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
                  title="Editar asistencia"
                >
                  <SquarePlus className="w-5 h-5" />
                </button>
              )}
            </div>
            {attended === true &&
              (entryTime ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[12px] font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
                    {entryTime}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-none">
                    Sin hora
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              attended === true
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : attended === false
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {attended === true ? (
              <Check className="w-3 h-3" strokeWidth={3} />
            ) : attended === false ? (
              <X className="w-3 h-3" strokeWidth={3} />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {attended === true
              ? 'Asistió'
              : attended === false
                ? 'No asistió'
                : 'Pendiente'}
          </div>
          {(attended !== false || uniformDone) && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                uniformDone
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Shirt className="w-3 h-3" />
              {uniformDone
                ? `Uniforme · ${uniformSize}`
                : finished
                  ? 'Sin uniforme'
                  : 'Uniforme pendiente'}
            </div>
          )}
        </div>

        {notes && (
          <p
            className={`text-[11px] rounded-lg px-2.5 py-1.5 mb-3 italic ${
              attended === false
                ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20'
                : 'text-muted-foreground bg-muted/60'
            }`}
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold not-italic">
              {attended === false ? 'Motivo: ' : 'Nota: '}
            </span>
            {notes}
          </p>
        )}

        {holdingFromPreviousDay && (
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 mb-3">
            <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-snug">
                Ya tiene uniforme en su poder
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Talla <span className="font-bold">{holding.size ?? '—'}</span>
                {holdingDate && (
                  <>
                    {' '}
                    · entregado el{' '}
                    <span className="capitalize">{holdingDate}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {finished ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <Check
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                strokeWidth={3}
              />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Jornada finalizada
              </span>
            </div>
            <div className="grid grid-cols-2 border-t border-emerald-200/70 dark:border-emerald-800/70 divide-x divide-emerald-200/70 dark:divide-emerald-800/70">
              <div className="px-3 py-2 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">
                  Check-in
                </p>
                <p className="text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
                  {entryTime ?? '—'}
                </p>
              </div>
              <div className="px-3 py-2 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">
                  Check-out
                </p>
                <p className="text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
                  {exitTime ?? '—'}
                </p>
              </div>
            </div>
            {onTimeline && (
              <button
                type="button"
                onClick={() => onTimeline(collab)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-t border-emerald-200/70 dark:border-emerald-800/70 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 transition"
              >
                <History className="w-3.5 h-3.5" />
                Ver bitácora completa del día
              </button>
            )}
          </div>
        ) : !isAdmin ? (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            {attended === undefined || attended === null
              ? 'Aún sin registrar'
              : 'Registrado por el equipo del evento'}
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAttendedModalOpen(true)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 border-2 ${
                  attended === true
                    ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-card border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-800 dark:hover:text-emerald-400'
                }`}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
                Asistió
              </button>
              <button
                type="button"
                onClick={() => setAbsentModalOpen(true)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 border-2 ${
                  attended === false
                    ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600'
                    : 'bg-card border-border text-muted-foreground hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-900 dark:hover:text-rose-400'
                }`}
              >
                <X className="w-4 h-4" strokeWidth={3} />
                No asistió
              </button>
            </div>
            {canRegisterUniform ? (
              <button
                type="button"
                onClick={() => setShowUniform((v) => !v)}
                className={`w-full flex items-center justify-center gap-2 h-9 rounded-xl font-semibold text-xs transition-all border ${
                  uniformDone
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                {uniformDone
                  ? `Uniforme · ${uniformSize}`
                  : 'Registrar uniforme'}
                {showUniform ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-1">
                {holdingFromPreviousDay
                  ? 'Ya tiene uniforme en su poder: no se puede registrar otro'
                  : 'No aplica entrega de uniforme: no asistió'}
              </p>
            )}
          </div>
        )}

        {showUniform && canRegisterUniform && (
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
                      ? 'bg-[#DD7419] border-[#DD7419] text-white'
                      : 'bg-card border-border text-foreground hover:border-[#DD7419]/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveUniform}
              disabled={!selectedSize || savingUniform}
              className="w-full h-9 rounded-xl bg-[#DD7419] text-white text-sm font-semibold hover:bg-[#DD7419]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
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

      <MarkAttendedModal
        open={attendedModalOpen}
        onClose={() => setAttendedModalOpen(false)}
        collab={collab}
        eventId={eventId}
        dateRegister={targetDate}
        onUpdated={onAttendanceUpdated}
        onUniformSaved={onUniformSaved}
      />
      <MarkAbsentModal
        open={absentModalOpen}
        onClose={() => setAbsentModalOpen(false)}
        collab={collab}
        eventId={eventId}
        dateRegister={targetDate}
        onUpdated={onAttendanceUpdated}
      />
    </div>
  );
}

export function Station1Tab({
  collaborators,
  loading,
  eventId,
  dateRegister,
  isAdmin = true,
  onAttendanceUpdated,
  onUniformSaved,
  onEdit,
  onTimeline,
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-3 animate-pulse space-y-2"
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
      ) : collaborators.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No hay colaboradores vinculados al evento
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            La Estación 1 lista a todo el personal asignado. Revisa las
            asignaciones de zona, o el filtro de turno si tienes uno activo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <CollabCard
              key={collab.userId}
              collab={collab}
              eventId={eventId}
              dateRegister={dateRegister}
              isAdmin={isAdmin}
              onAttendanceUpdated={onAttendanceUpdated}
              onUniformSaved={onUniformSaved}
              onEdit={onEdit}
              onTimeline={onTimeline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
