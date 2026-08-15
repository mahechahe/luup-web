import { Calendar, Loader2 } from 'lucide-react';
import { COLOMBIA_TZ } from '@/App/utils/functions/colombiaDate';

const shortDayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

/** "2026-08-10" → "lun 10 ago", anclado a mediodía Colombia para no correr el día. */
const shortDay = (isoDate) =>
  shortDayFormatter.format(new Date(`${isoDate}T12:00:00-05:00`));

/**
 * Días del evento. Un evento puede durar varias jornadas y cada una es un
 * recorrido completo por las 4 estaciones, así que el día seleccionado manda
 * sobre las cuatro pestañas a la vez.
 */
export function DaySelector({ days, loading, selected, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando días…
      </div>
    );
  }

  // Un solo día: no hay nada que elegir.
  if (!days || days.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex gap-1.5">
        {days.map((day) => {
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className={`shrink-0 px-3 py-1.5 rounded-lg border text-left transition ${
                isSelected
                  ? 'bg-[#234465] border-[#234465] text-white'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold leading-none">
                  Día {day.dayNumber}
                </span>
                {day.isToday && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    HOY
                  </span>
                )}
              </span>
              <span
                className={`block text-[10px] mt-0.5 capitalize leading-none ${
                  isSelected ? 'text-white/70' : 'text-muted-foreground'
                }`}
              >
                {shortDay(day.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
