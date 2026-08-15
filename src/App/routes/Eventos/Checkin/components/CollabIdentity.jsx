import { IdCard, MapPin, Phone } from 'lucide-react';
import { roleBadgeClass, roleLabel } from '../utils/collaborators';

/** Bloque nombre + cédula + celular + zonas + rol, común a las 4 estaciones. */
export function CollabIdentity({ collab }) {
  const zones = collab.zones?.length > 0 ? collab.zones.join(', ') : null;

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
