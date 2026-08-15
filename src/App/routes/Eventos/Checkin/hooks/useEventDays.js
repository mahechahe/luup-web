import { useCallback, useEffect, useState } from 'react';
import { getAttendanceDaysService } from '../../services/eventServices';
import {
  getColombiaDateISO,
  toDateRegister,
} from '@/App/utils/functions/colombiaDate';

/**
 * Días del evento y el día seleccionado en el tablero.
 *
 * Siempre arranca en hoy. Si hoy no es una jornada del evento (ya terminó o aún
 * no empieza) cae al día más cercano dentro del rango, para no dejar el tablero
 * en una fecha sin registros.
 */
export function useEventDays(eventId) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(getColombiaDateISO());

  const load = useCallback(
    async ({ resetSelection = true } = {}) => {
      setLoading(true);
      const res = await getAttendanceDaysService(eventId);
      setLoading(false);

      if (!res.status || !res.data) return;

      const list = res.data.days ?? [];
      setDays(list);

      if (list.length === 0) return;

      // Un refresco (p. ej. tras registrar un check-in) no debe mover al
      // usuario del día que tiene abierto, solo trae los conteos al día.
      if (!resetSelection) return;

      const today = getColombiaDateISO();
      const hasToday = list.some((d) => d.date === today);

      if (hasToday) {
        setSelected(today);
        return;
      }

      // Evento pasado → último día. Evento futuro → primero.
      const isPastEvent = list[list.length - 1].date < today;
      setSelected(isPastEvent ? list[list.length - 1].date : list[0].date);
    },
    [eventId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(
    () => load({ resetSelection: false }),
    [load]
  );

  const selectedDay = days.find((d) => d.date === selected) ?? null;

  return {
    days,
    loading,
    /** YYYY-MM-DD */
    selected,
    /** MM-DD-YYYY, que es lo que esperan los endpoints de asistencia. */
    selectedDateRegister: toDateRegister(selected),
    selectedDay,
    isToday: selected === getColombiaDateISO(),
    setSelected,
    refresh,
  };
}
