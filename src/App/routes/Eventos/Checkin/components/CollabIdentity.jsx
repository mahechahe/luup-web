import { Clock, IdCard, MapPin, Phone } from 'lucide-react';
import { roleBadgeClass, roleLabel } from '../utils/collaborators';

/** "17:51:00" → "17:51". Los turnos sin horario no muestran rango. */
const hhmm = (time) => (time ? String(time).slice(0, 5) : null);

/**
 * Bloque nombre + cédula + celular + zonas + turno + rol, común a las 4
 * estaciones.
 *
 * El turno es el del DÍA que se está viendo, no el turno "de siempre": el API
 * ya resuelve el override de la jornada. Puede venir `null` (sin asignación de
 * zona, o turno borrado), y en ese caso se dice explícitamente en vez de
 * dejar el renglón vacío.
 */
export function CollabIdentity({ collab }) {
  const zones = collab.zones?.length > 0 ? collab.zones.join(', ') : null;
  const shift = collab.shift ?? null;
  const shiftStart = hhmm(shift?.startTime);
  const shiftEnd = hhmm(shift?.endTime);
  const shiftHours =
    shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : null;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-[15px] font-bold text-foreground leading-tight tracking-tight capitalize">
          {collab.firstName} {collab.lastName}
        </p>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${roleBadgeClass(
            collab.role
          )}`}
        >
          {roleLabel(collab.role)}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <IdCard className="w-3.5 h-3.5 shrink-0" />
        <span className="text-foreground font-medium tabular-nums">
          {collab.cedula}
        </span>
        <span className="text-border">·</span>
        <Phone className="w-3.5 h-3.5 shrink-0" />
        <span className="text-foreground font-medium tabular-nums">
          {collab.phone ?? '—'}
        </span>
      </div>

      <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        {zones ? (
          <span className="text-foreground font-medium">{zones}</span>
        ) : (
          <span>—</span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {shift ? (
          <>
            <span className="text-foreground font-medium">{shift.name}</span>
            {shiftHours && <span className="tabular-nums">· {shiftHours}</span>}
          </>
        ) : (
          <span className="italic">Sin turno asignado</span>
        )}
      </div>
    </div>
  );
}

/** Nota de la asistencia (resaltada en ámbar). No renderiza nada si no hay nota. */
export function CollabNote({ note }) {
  if (!note) return null;

  return (
    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 italic">
      <span className="font-semibold not-italic">Nota: </span>
      {note}
    </p>
  );
}
