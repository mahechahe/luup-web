import { eventStatusDotClass } from './eventStatus';

/**
 * Control compacto del estado operativo del evento: punto de color + etiqueta.
 * Vive separado del resto de badges del header (Activo, Etapas) a propósito,
 * como su propio elemento a la derecha, para no amontonar toda la
 * información en la misma línea de texto.
 */
export function EventStatusBadge({ status, onClick, className = '' }) {
  const label = status || 'Sin estado';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} — cambiar estado del evento`}
      className={`shrink-0 flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-lg border border-border bg-background hover:bg-muted transition text-xs font-semibold text-foreground ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventStatusDotClass(
          status
        )}`}
      />
      {label}
    </button>
  );
}
