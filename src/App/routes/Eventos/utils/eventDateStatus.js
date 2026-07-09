// Días de gracia tras la fecha (o fecha fin) del evento en los que aún se
// permite el ingreso. Ej: evento hasta el 12 → se bloquea hasta el 14.
const GRACE_PERIOD_DAYS = 1;

function todayDateOnly() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Suma días a una fecha "YYYY-MM-DD" tratándola como fecha local (evita
// corrimientos por zona horaria que ocurrirían con `new Date(dateStr)`).
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// 'active' | 'upcoming' | 'ended' | 'unknown'
// single_date usa `date`; stages usa el rango `startDate`–`endDate`.
// Incluye un día de gracia después de la fecha (o fecha fin) antes de
// marcar el evento como finalizado.
export function getEventDateStatus(event) {
  if (!event) return 'unknown';
  const today = todayDateOnly();

  if (event.dateType === 'stages') {
    if (!event.startDate || !event.endDate) return 'unknown';
    if (today < event.startDate) return 'upcoming';
    const graceEnd = addDays(event.endDate, GRACE_PERIOD_DAYS);
    if (today > graceEnd) return 'ended';
    return 'active';
  }

  if (!event.date) return 'unknown';
  if (today < event.date) return 'upcoming';
  const graceEnd = addDays(event.date, GRACE_PERIOD_DAYS);
  if (today > graceEnd) return 'ended';
  return 'active';
}
