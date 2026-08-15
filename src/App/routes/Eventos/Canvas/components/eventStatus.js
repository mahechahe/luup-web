/**
 * Estado operativo del evento: texto libre en el API (`events.status`), sin
 * lista cerrada de valores. Aquí solo viven las 3 sugerencias que muestra la
 * UI como accesos rápidos y su presentación — cualquier otro texto también
 * es válido y se muestra con un estilo neutro.
 */

export const SUGGESTED_EVENT_STATUSES = [
  {
    value: 'Montaje',
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  {
    value: 'Ejecución',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  {
    value: 'Desmontaje',
    badgeClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    dotClass: 'bg-indigo-500',
  },
];

const FALLBACK_BADGE_CLASS =
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
const FALLBACK_DOT_CLASS = 'bg-violet-500';

export const eventStatusBadgeClass = (status) => {
  const found = SUGGESTED_EVENT_STATUSES.find(
    (s) => s.value.toLowerCase() === status?.toLowerCase()
  );
  return found?.badgeClass ?? FALLBACK_BADGE_CLASS;
};

/** Color del punto de estado usado en el control compacto del header. */
export const eventStatusDotClass = (status) => {
  if (!status) return 'bg-muted-foreground/40';
  const found = SUGGESTED_EVENT_STATUSES.find(
    (s) => s.value.toLowerCase() === status.toLowerCase()
  );
  return found?.dotClass ?? FALLBACK_DOT_CLASS;
};

/**
 * Siguiente estado sugerido según el orden Montaje → Ejecución → Desmontaje.
 * Solo es una sugerencia visual (botón resaltado): el backend no valida
 * transiciones, así que cualquier estado puede marcarse en cualquier momento.
 */
export const suggestedNextStatus = (current) => {
  if (!current) return SUGGESTED_EVENT_STATUSES[0].value;
  const idx = SUGGESTED_EVENT_STATUSES.findIndex(
    (s) => s.value.toLowerCase() === current.toLowerCase()
  );
  if (idx === -1 || idx === SUGGESTED_EVENT_STATUSES.length - 1) return null;
  return SUGGESTED_EVENT_STATUSES[idx + 1].value;
};
