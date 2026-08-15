/**
 * Espejo en el frontend del paso explícito del API
 * (`luup-api/src/modules/events/utils/attendance-flow.ts`).
 *
 * Aquí solo vive la presentación: etiquetas y colores. Las reglas de avance
 * son del backend — el frontend nunca decide si alguien puede pasar de estación.
 */

export const STAGES = {
  ESTACION_1: 'estacion_1',
  ESTACION_2: 'estacion_2',
  ESTACION_3: 'estacion_3',
  ESTACION_4: 'estacion_4',
  FINALIZADO: 'finalizado',
  NO_ASISTIO: 'no_asistio',
};

const STAGE_META = {
  [STAGES.ESTACION_1]: {
    order: 1,
    short: 'Estación 1',
    label: 'En Estación 1 · Check-in',
    badgeClass: 'bg-muted text-muted-foreground border border-border',
  },
  [STAGES.ESTACION_2]: {
    order: 2,
    short: 'Estación 2',
    label: 'En Estación 2 · Maleta, almuerzo y refrigerio',
    badgeClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  [STAGES.ESTACION_3]: {
    order: 3,
    short: 'Estación 3',
    label: 'En Estación 3 · Dotación e insumos',
    badgeClass:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  [STAGES.ESTACION_4]: {
    order: 4,
    short: 'Estación 4',
    label: 'En Estación 4 · Check-out',
    badgeClass:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
  [STAGES.FINALIZADO]: {
    order: 5,
    short: 'Finalizado',
    label: 'Jornada finalizada',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  [STAGES.NO_ASISTIO]: {
    order: 0,
    short: 'No asistió',
    label: 'No asistió',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

const FALLBACK = STAGE_META[STAGES.ESTACION_1];

/**
 * Paso de un colaborador.
 *
 * La Estación 1 lo manda al nivel superior (porque su `attendance` puede venir
 * en null); las demás listas lo traen dentro de `attendance`.
 */
export const getStage = (collab) =>
  collab?.stage ?? collab?.attendance?.stage ?? STAGES.ESTACION_1;

export const stageMeta = (stage) => STAGE_META[stage] ?? FALLBACK;

export const stageOrder = (stage) => stageMeta(stage).order;

/** ¿Ya pasó de esta estación? Sirve para bloquear acciones de la estación actual. */
export const isPastStage = (stage, reference) =>
  stageOrder(stage) > stageOrder(reference);

export const isFinished = (stage) => stage === STAGES.FINALIZADO;

export const isAbsent = (stage) => stage === STAGES.NO_ASISTIO;

/** Estaciones que forman la fila, en orden. */
const STATION_STAGES = [
  STAGES.ESTACION_1,
  STAGES.ESTACION_2,
  STAGES.ESTACION_3,
  STAGES.ESTACION_4,
];

/**
 * Estación inmediatamente anterior, o `null` si no hay a dónde devolver.
 * Espejo de `previousStage` del API, que es quien valida de verdad.
 */
export const previousStage = (stage) => {
  const order = stageOrder(stage);
  if (stage === STAGES.NO_ASISTIO) return null;
  return STATION_STAGES.find((s) => stageOrder(s) === order - 1) ?? null;
};
