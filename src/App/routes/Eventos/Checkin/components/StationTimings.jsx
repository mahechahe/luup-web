import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Timer, Users } from 'lucide-react';
import { formatDuration } from '@/App/utils/functions/colombiaDate';
import { getStationTimingsService } from '../../services/eventServices';
import { STAGES, stageMeta } from '../utils/stages';

/** Acento de color por estación, a tono con `badgeClass` de stageMeta. */
const ACCENT = {
  [STAGES.ESTACION_1]: {
    border: 'border-l-slate-300 dark:border-l-slate-600',
    text: 'text-muted-foreground',
  },
  [STAGES.ESTACION_2]: {
    border: 'border-l-indigo-400 dark:border-l-indigo-600',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  [STAGES.ESTACION_3]: {
    border: 'border-l-violet-400 dark:border-l-violet-600',
    text: 'text-violet-600 dark:text-violet-400',
  },
  [STAGES.ESTACION_4]: {
    border: 'border-l-rose-400 dark:border-l-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
  },
};
const DEFAULT_ACCENT = ACCENT[STAGES.ESTACION_1];

/**
 * Cuánto se demora la fila de cada estación en la jornada seleccionada.
 *
 * Sale de las diferencias entre transiciones del `event_attendance_log`, que ya
 * se venía llenando. Solo cuenta a quienes ya salieron de la estación, para que
 * los que siguen esperando no distorsionen el promedio.
 */
export function StationTimings({ eventId, date }) {
  const [timings, setTimings] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !date) return;

    setLoaded(false);
    getStationTimingsService(eventId, date).then((res) => {
      setTimings(res.status ? res.data?.timings ?? [] : []);
      setLoaded(true);
    });
  }, [open, eventId, date]);

  // Cambiar de día invalida lo cargado.
  useEffect(() => {
    setLoaded(false);
  }, [date]);

  const withData = timings.filter((t) => t.completed > 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/50 transition"
      >
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#DD7419]/10 flex items-center justify-center shrink-0">
            <Timer className="w-3.5 h-3.5 text-[#DD7419]" />
          </span>
          <span className="text-xs font-semibold text-foreground">
            Tiempos por estación
          </span>
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0.5 border-t border-border">
          {!loaded ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <p className="text-xs">Cargando…</p>
            </div>
          ) : withData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
              <Timer className="w-5 h-5 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Todavía nadie ha completado una estación en esta jornada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
              {withData.map((t) => {
                const accent = ACCENT[t.stage] ?? DEFAULT_ACCENT;
                return (
                  <div
                    key={t.stage}
                    className={`bg-muted/30 rounded-lg border-l-4 ${accent.border} px-3 py-2.5`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide leading-none ${accent.text}`}
                    >
                      {stageMeta(t.stage).short}
                    </p>
                    <p className="text-xl font-extrabold text-foreground mt-1.5 leading-none tabular-nums">
                      {formatDuration(t.avgSeconds)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground leading-none">
                      <span>máx {formatDuration(t.maxSeconds)}</span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {t.completed}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
