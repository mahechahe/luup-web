import { useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  GlassWater,
  MapPin,
  Package,
  Shirt,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { formatDateRegisterShort } from '@/App/utils/functions/colombiaDate';

const ROLE_LABELS = {
  supervisor: 'Supervisor',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
  responsable_acopio: 'Resp. Acopio',
};

const ROLE_COLORS = {
  supervisor: 'bg-brand/10 text-brand dark:bg-brand/15',
  coordinador:
    'bg-luup-blue-dark/10 text-luup-blue-dark dark:bg-luup-blue-light/15 dark:text-luup-blue-light',
  colaborador: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  responsable_acopio:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const ROLE_ACCENT = {
  supervisor: 'border-l-brand',
  coordinador: 'border-l-luup-blue-dark',
  colaborador: 'border-l-zinc-300 dark:border-l-zinc-600',
  responsable_acopio: 'border-l-amber-400 dark:border-l-amber-600',
};

const AVATAR_GRADIENTS = {
  supervisor: 'bg-gradient-to-br from-chart-1 to-brand text-white',
  coordinador:
    'bg-gradient-to-br from-luup-blue-light to-luup-blue-dark text-white',
  colaborador:
    'bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-800 text-white',
  responsable_acopio:
    'bg-gradient-to-br from-amber-300 to-amber-600 text-white',
};

function formatTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Un registro cuenta como "actividad real" del día: llegó, o quedó marcado explícitamente como ausente. */
function hasRealActivity(attendance) {
  if (!attendance) return false;
  return (
    attendance.attended === false ||
    attendance.attended === true ||
    !!attendance.entryTime
  );
}

function StatusPill({ icon: Icon, label, active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
        active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground opacity-50'
      }`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

function DayBadge({ dayNumber, tone }) {
  const toneClasses = {
    emerald: 'bg-emerald-500 text-white',
    red: 'bg-red-500 text-white',
    neutral: 'bg-card border border-border text-muted-foreground',
    empty: 'border border-dashed border-border text-muted-foreground/50',
  };

  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${toneClasses[tone]}`}
    >
      {dayNumber ?? ''}
    </div>
  );
}

function NoRecordBlock({ date, dayNumber }) {
  const dayLabel = formatDateRegisterShort(date);

  return (
    <div className="p-3 rounded-xl border border-dashed border-border/70 flex items-center gap-2">
      <DayBadge dayNumber={dayNumber} tone="empty" />
      {dayLabel && (
        <span className="text-[11px] font-semibold text-muted-foreground/60 capitalize shrink-0">
          {dayLabel}
        </span>
      )}
      <span className="text-xs text-muted-foreground/60 italic ml-auto flex items-center gap-1">
        <CalendarX2 className="w-3 h-3" />
        Sin registro
      </span>
    </div>
  );
}

function AttendanceBlock({ attendance, date, dayNumber }) {
  const entryTime = formatTime(attendance.entryTime);
  const exitTime = formatTime(attendance.exitTime);
  const didNotAttend = attendance.attended === false;
  const isActive =
    !didNotAttend && !!attendance.entryTime && !attendance.exitTime;
  const dayLabel = formatDateRegisterShort(date ?? attendance.dateRegister);
  const snackLabel = attendance.snackDetail
    ? `Snack: ${attendance.snackDetail}`
    : 'Snack';

  return (
    <div
      className={`p-3 rounded-xl flex flex-col gap-2 ${
        didNotAttend ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <DayBadge
          dayNumber={dayNumber}
          tone={didNotAttend ? 'red' : isActive ? 'emerald' : 'neutral'}
        />
        {dayLabel && (
          <span className="text-[11px] font-semibold text-muted-foreground capitalize shrink-0">
            {dayLabel}
          </span>
        )}

        <div className="flex items-center gap-2 text-sm flex-1 min-w-0 justify-end">
          {didNotAttend ? (
            <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
              No asistió
            </span>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground tabular-nums">
                {entryTime ?? '—'}
              </span>
              <span className="text-muted-foreground">→</span>
              {isActive ? (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  En evento
                </span>
              ) : (
                <span className="font-semibold text-foreground tabular-nums">
                  {exitTime ?? '—'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {!didNotAttend && (
        <div className="flex flex-wrap gap-1.5 pl-7">
          <StatusPill
            icon={Briefcase}
            label="Maletín"
            active={!!attendance.receivedSuitcase}
          />
          <StatusPill
            icon={UtensilsCrossed}
            label="Almuerzo"
            active={!!attendance.receivedLunch}
          />
          <StatusPill
            icon={GlassWater}
            label={snackLabel}
            active={!!attendance.receivedSnack}
          />
          <StatusPill
            icon={Shirt}
            label="Uniforme devuelto"
            active={!!attendance.returnedUniform}
          />
        </div>
      )}

      {attendance.notes && (
        <p className="text-xs text-muted-foreground italic pl-7 border-l-2 border-border">
          {attendance.notes}
        </p>
      )}
    </div>
  );
}

export default function AttendanceCollaboratorCard({
  collaborator,
  eventDays = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const hasUniform = collaborator.attendances.some((a) => a.uniform);
  const uniformSize = collaborator.attendances.find(
    (a) => a.uniformSize
  )?.uniformSize;
  const uniformReturned =
    hasUniform &&
    collaborator.attendances
      .filter((a) => a.uniform)
      .every((a) => a.returnedUniform);
  const hasInventory = collaborator.inventoryItems.length > 0;

  const dayEntries = useMemo(() => {
    if (eventDays.length === 0) {
      return collaborator.attendances
        .filter(hasRealActivity)
        .map((attendance) => ({
          key: attendance.id,
          date: attendance.dateRegister,
          dayNumber: null,
          attendance,
        }));
    }

    return eventDays.map((day) => {
      const attendance = collaborator.attendances.find(
        (a) => a.dateRegister === day.date
      );
      return {
        key: day.date,
        date: day.date,
        dayNumber: day.dayNumber,
        attendance: hasRealActivity(attendance) ? attendance : null,
      };
    });
  }, [eventDays, collaborator.attendances]);

  const attendedDaysCount = dayEntries.filter(
    (entry) => entry.attendance && entry.attendance.attended !== false
  ).length;
  const totalDays = eventDays.length > 0 ? eventDays.length : dayEntries.length;
  const notAttendedCount =
    eventDays.length > 0
      ? totalDays - attendedDaysCount
      : dayEntries.filter((entry) => entry.attendance?.attended === false)
          .length;
  const lunchCount = dayEntries.filter(
    (entry) => entry.attendance?.receivedLunch
  ).length;

  const initials = `${collaborator.firstName?.[0] ?? ''}${
    collaborator.lastName?.[0] ?? ''
  }`.toUpperCase();
  const role = collaborator.role ?? 'colaborador';

  return (
    <div
      className={`group bg-card border border-border border-l-4 ${
        ROLE_ACCENT[role] ?? ROLE_ACCENT.colaborador
      } rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:border-l-[6px]`}
    >
      <div className="p-4 flex items-start gap-3.5">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold tracking-wide shrink-0 shadow-sm ring-2 ring-card ${
            AVATAR_GRADIENTS[role] ?? AVATAR_GRADIENTS.colaborador
          }`}
        >
          {initials || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-[15px] text-foreground leading-tight tracking-tight capitalize truncate">
                {collaborator.firstName} {collaborator.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
                    ROLE_COLORS[role] ?? ROLE_COLORS.colaborador
                  }`}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums truncate">
                  CC {collaborator.cedula}
                </span>
              </div>
            </div>
          </div>

          {collaborator.zones.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {collaborator.zones.join(' · ')}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                attendedDaysCount > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {attendedDaysCount > 0 ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {eventDays.length > 0
                ? `${attendedDaysCount} de ${totalDays} días`
                : attendedDaysCount > 0
                  ? `${attendedDaysCount} registro${
                      attendedDaysCount > 1 ? 's' : ''
                    }`
                  : 'Sin registro'}
            </span>

            {notAttendedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <XCircle className="w-3 h-3" />
                {notAttendedCount} no asistió
              </span>
            )}

            {attendedDaysCount > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  lunchCount > 0
                    ? 'bg-brand/10 text-brand dark:bg-brand/15'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <UtensilsCrossed className="w-3 h-3" />
                Almuerzo {lunchCount}/{attendedDaysCount}
              </span>
            )}

            {hasUniform && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  uniformReturned
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                }`}
              >
                <Shirt className="w-3 h-3" />
                {uniformReturned ? 'Devuelto' : 'Uniforme pendiente'}
                {uniformSize ? ` ${uniformSize}` : ''}
              </span>
            )}

            {hasInventory && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-luup-blue-dark/10 text-luup-blue-dark dark:bg-luup-blue-light/15 dark:text-luup-blue-light">
                <Package className="w-3 h-3" />
                {collaborator.inventoryItems.length} ítem
                {collaborator.inventoryItems.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded((value) => !value)}
        className={`w-full flex items-center justify-center gap-1.5 py-2 border-t text-xs font-medium transition-colors ${
          expanded
            ? 'border-border bg-muted/40 text-foreground'
            : 'border-border/70 text-muted-foreground hover:text-brand hover:bg-brand/5'
        }`}
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> Ocultar detalle
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> Ver detalle
          </>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-5 bg-muted/20">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Asistencia
            </p>
            {dayEntries.length > 0 ? (
              <div className="flex flex-col gap-2">
                {dayEntries.map((entry) =>
                  entry.attendance ? (
                    <AttendanceBlock
                      key={entry.key}
                      attendance={entry.attendance}
                      date={entry.date}
                      dayNumber={entry.dayNumber}
                    />
                  ) : (
                    <NoRecordBlock
                      key={entry.key}
                      date={entry.date}
                      dayNumber={entry.dayNumber}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin registros de asistencia.
              </p>
            )}
          </div>

          {hasInventory && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Inventario asignado
              </p>
              <div className="flex flex-col gap-1.5">
                {collaborator.inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground truncate pr-3">
                      {item.itemName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {item.quantity} asig.
                      </span>
                      {item.returnedQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                          {item.returnedQuantity} dev.
                        </span>
                      )}
                      {item.usedQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
                          {item.usedQuantity} usad.
                        </span>
                      )}
                      {item.damagedQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">
                          {item.damagedQuantity} dañ.
                        </span>
                      )}
                      {item.pendingQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                          {item.pendingQuantity} pend.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
