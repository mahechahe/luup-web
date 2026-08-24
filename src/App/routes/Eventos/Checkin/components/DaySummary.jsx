import { STAGES } from '../utils/stages';

/**
 * Qué pasó en la jornada seleccionada, de un vistazo.
 *
 * Es el embudo del día: cuántos no han llegado, cuántos están en alguna
 * estación, cuántos cerraron y cuántos no asistieron. Sale del mismo endpoint
 * que alimenta el selector, sin consultas extra.
 *
 * Respeta el turno filtrado: `useEventDays` le pasa el `shiftId` al API, así
 * que estos números son siempre los mismos que ve el usuario en las listas de
 * las cuatro estaciones. Cuando hay turno activo se dice explícitamente.
 *
 * La cifra va ARRIBA y la etiqueta debajo a propósito: así una etiqueta que
 * ocupe dos líneas no desalinea los números entre sí.
 */

/** Ancho del segmento, con piso visible para que un 1 entre 300 no desaparezca. */
const barWidth = (value, total) =>
  value === 0 ? 0 : Math.max((value / total) * 100, 1.5);

export function DaySummary({ day, loading = false, shiftLabel = null }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="h-2 w-full bg-muted rounded-full mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-10 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!day) return null;

  const c = day.counts ?? {};
  const sinLlegar = c[STAGES.ESTACION_1] ?? 0;
  const est2 = c[STAGES.ESTACION_2] ?? 0;
  const est3 = c[STAGES.ESTACION_3] ?? 0;
  const est4 = c[STAGES.ESTACION_4] ?? 0;
  const enEstaciones = est2 + est3 + est4;
  const finalizaron = c[STAGES.FINALIZADO] ?? 0;
  const noAsistio = c[STAGES.NO_ASISTIO] ?? 0;
  const total = day.total ?? 0;

  // Sin nadie vinculado se mantiene la tarjeta (vacía pero presente) para que
  // el contenido de abajo no salte al cambiar de día o de turno.
  if (total === 0) {
    return (
      <div className="bg-card rounded-xl border border-border px-3 py-4 sm:px-4 text-center">
        <p className="text-xs text-muted-foreground">
          {shiftLabel
            ? `Nadie vinculado a esta jornada en el turno ${shiftLabel}.`
            : 'Nadie vinculado a esta jornada todavía.'}
        </p>
      </div>
    );
  }

  // El avance se mide contra quienes se esperaban: los ausentes no cuentan
  // como pendientes, o la jornada nunca llegaría al 100%.
  const esperados = total - noAsistio;
  const avance =
    esperados > 0 ? Math.round((finalizaron / esperados) * 100) : null;

  const cells = [
    {
      key: 'sin-llegar',
      label: 'Sin llegar',
      value: sinLlegar,
      hint: 'esperan en Estación 1',
      dot: 'bg-muted-foreground/50',
      text: 'text-foreground',
    },
    {
      key: 'en-estaciones',
      label: 'En estaciones',
      value: enEstaciones,
      hint:
        enEstaciones > 0
          ? `E2 ${est2} · E3 ${est3} · E4 ${est4}`
          : 'nadie en curso',
      dot: 'bg-[#DD7419]',
      text: 'text-[#DD7419]',
    },
    {
      key: 'finalizaron',
      label: 'Finalizaron',
      value: finalizaron,
      hint: 'jornada cerrada',
      dot: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'no-asistio',
      label: 'No asistió',
      value: noAsistio,
      hint: 'marcados ausentes',
      dot: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
      {/* ── Encabezado: de cuánta gente hablamos y cuánto se ha avanzado ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            <span className="tabular-nums">{total}</span>{' '}
            {total === 1 ? 'colaborador vinculado' : 'colaboradores vinculados'}
          </p>
          {shiftLabel && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Solo turno{' '}
              <span className="font-semibold text-foreground">
                {shiftLabel}
              </span>
            </p>
          )}
        </div>

        {avance !== null && (
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
              {avance}%
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-1">
              completaron
            </p>
          </div>
        )}
      </div>

      {/* ── El embudo, en proporción ── */}
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Sin llegar ${sinLlegar}, en estaciones ${enEstaciones}, finalizaron ${finalizaron}, no asistió ${noAsistio}, de ${total} vinculados.`}
      >
        {cells.map(({ key, label, value, dot }) => (
          <div
            key={key}
            className={dot}
            style={{ width: `${barWidth(value, total)}%` }}
            title={`${label}: ${value}`}
          />
        ))}
      </div>

      {/* ── Desglose ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-3">
        {cells.map(({ key, label, value, hint, dot, text }) => (
          <div key={key} className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
              <span
                className={`text-xl font-bold leading-none tabular-nums ${text}`}
              >
                {value}
              </span>
            </div>
            <p className="text-[11px] font-medium text-foreground leading-tight mt-1.5 pl-3.5">
              {label}
            </p>
            {hint && (
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 pl-3.5">
                {hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
