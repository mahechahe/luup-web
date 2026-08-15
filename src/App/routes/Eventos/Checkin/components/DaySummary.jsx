import { STAGES } from '../utils/stages';

/**
 * Qué pasó en la jornada seleccionada, de un vistazo.
 *
 * Es el embudo del día: cuántos no han llegado, cuántos están en alguna
 * estación, cuántos cerraron y cuántos no asistieron. Sale del mismo endpoint
 * que alimenta el selector, sin consultas extra.
 */
export function DaySummary({ day }) {
  if (!day || day.total === 0) return null;

  const c = day.counts ?? {};
  const inStations =
    (c[STAGES.ESTACION_2] ?? 0) +
    (c[STAGES.ESTACION_3] ?? 0) +
    (c[STAGES.ESTACION_4] ?? 0);

  const cells = [
    {
      label: 'Vinculados',
      value: day.total,
      className: 'text-foreground',
    },
    {
      label: 'Sin llegar',
      value: c[STAGES.ESTACION_1] ?? 0,
      className: 'text-muted-foreground',
    },
    {
      label: 'En estaciones',
      value: inStations,
      className: 'text-[#DD7419]',
    },
    {
      label: 'Finalizaron',
      value: c[STAGES.FINALIZADO] ?? 0,
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'No asistió',
      value: c[STAGES.NO_ASISTIO] ?? 0,
      className: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5 bg-card rounded-xl border border-border p-2">
      {cells.map(({ label, value, className }) => (
        <div key={label} className="text-center py-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">
            {label}
          </p>
          <p className={`text-lg font-bold leading-none ${className}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
