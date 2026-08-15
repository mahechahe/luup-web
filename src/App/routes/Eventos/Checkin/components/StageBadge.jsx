import { stageMeta } from '../utils/stages';

/**
 * Indicador de en qué estación va un colaborador.
 *
 * Con `onClick` se vuelve el acceso a la bitácora del día: el badge dice dónde
 * está y al pulsarlo se ve cómo llegó ahí.
 */
export function StageBadge({ stage, full = false, className = '', onClick }) {
  const meta = stageMeta(stage);
  const label = full ? meta.label : meta.short;

  const base = `inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${meta.badgeClass} ${className}`;

  if (!onClick) {
    return (
      <span className={base} title={meta.label}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${meta.label} — ver bitácora`}
      className={`${base} hover:opacity-80 transition cursor-pointer`}
    >
      {label}
    </button>
  );
}
