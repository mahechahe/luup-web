/**
 * Fecha y hora ancladas a Colombia (America/Bogota — UTC-5 fijo, sin horario de verano).
 *
 * Regla del módulo de estaciones: NADA que viaje al API o que se muestre como "hoy"
 * puede depender del reloj ni de la zona horaria del dispositivo. Las tablets de campo
 * llegan con fecha/zona mal configuradas y eso vaciaba el tablero de las Estaciones 2-4
 * (el backend filtra por `date_register`). Todo pasa por aquí.
 */

export const COLOMBIA_TZ = 'America/Bogota';

/** Colombia no aplica DST: el offset es constante todo el año. */
export const COLOMBIA_UTC_OFFSET = '-05:00';

const pad = (n) => String(n).padStart(2, '0');

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: COLOMBIA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Descompone un instante en sus partes de calendario tal como se ven en Colombia.
 * @returns {{year: string, month: string, day: string, hour: string, minute: string, second: string}}
 */
export const getColombiaParts = (date = new Date()) => {
  const parts = partsFormatter
    .formatToParts(date)
    .reduce((acc, { type, value }) => ({ ...acc, [type]: value }), {});

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Algunos motores devuelven "24" para la medianoche en hour12: false
    hour: parts.hour === '24' ? '00' : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
};

/** Fecha de hoy en Colombia como "YYYY-MM-DD" (formato de inventario y ratings). */
export const getColombiaDateISO = (date = new Date()) => {
  const { year, month, day } = getColombiaParts(date);
  return `${year}-${month}-${day}`;
};

/** Fecha de hoy en Colombia como "MM-DD-YYYY" (formato que esperan los endpoints de asistencia). */
export const getColombiaDateRegister = (date = new Date()) => {
  const { year, month, day } = getColombiaParts(date);
  return `${month}-${day}-${year}`;
};

/**
 * Convierte "YYYY-MM-DD" a "MM-DD-YYYY". Cualquier otro valor (incluido null/undefined)
 * se devuelve intacto, para poder encadenarlo con un fallback.
 */
export const toDateRegister = (isoDate) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate ?? '')) return isoDate;
  return `${isoDate.slice(5, 7)}-${isoDate.slice(8, 10)}-${isoDate.slice(
    0,
    4
  )}`;
};

/** Hora actual en Colombia como "HH:mm". */
export const getColombiaTime = (date = new Date()) => {
  const { hour, minute } = getColombiaParts(date);
  return `${hour}:${minute}`;
};

/** Hora actual en Colombia como "HH:mm", redondeada al múltiplo de 5 minutos más cercano. */
export const getColombiaTimeRounded = (date = new Date()) => {
  const { hour, minute } = getColombiaParts(date);
  const rounded = Math.round(Number(minute) / 5) * 5;
  const h = rounded === 60 ? (Number(hour) + 1) % 24 : Number(hour);
  const m = rounded === 60 ? 0 : rounded;
  return `${pad(h)}:${pad(m)}`;
};

/**
 * "HH:mm" → ISO con el offset de Colombia, sobre la fecha indicada (hoy en Colombia por defecto).
 * Ej: "08:30" → "2026-08-10T08:30:00-05:00".
 */
export const colombiaTimeToISO = (timeStr, isoDate = getColombiaDateISO()) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return `${isoDate}T${pad(hours)}:${pad(minutes)}:00${COLOMBIA_UTC_OFFSET}`;
};

/** ISO → "HH:mm" leído en hora Colombia (para inputs de hora). */
export const isoToColombiaTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return getColombiaTime(date);
};

const timeDisplayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/** ISO → "08:30 a. m." en hora Colombia. Devuelve null si la fecha es inválida. */
export const formatColombiaTime = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return timeDisplayFormatter.format(date);
};

const longDateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** "lunes, 10 de agosto de 2026" en hora Colombia. */
export const formatColombiaLongDate = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return longDateFormatter.format(value);
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/** "10 ago 2026, 08:30 a. m." en hora Colombia. */
export const formatColombiaDateTime = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeFormatter.format(date);
};

/**
 * "YYYY-MM-DD" (fecha sin hora, como `dateRegister`) → "lunes, 10 de agosto de 2026".
 * Se ancla al mediodía de Colombia para que la zona del dispositivo no corra el día.
 */
export const formatDateRegisterLong = (isoDate) => {
  if (!isoDate) return null;
  return formatColombiaLongDate(colombiaTimeToISO('12:00', isoDate));
};

const shortWeekdayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

/**
 * "YYYY-MM-DD" (fecha sin hora, como `dateRegister`) → "lun 10 ago".
 * Se ancla al mediodía de Colombia para que la zona del dispositivo no corra el día.
 */
export const formatDateRegisterShort = (isoDate) => {
  if (!isoDate) return null;
  const value = new Date(colombiaTimeToISO('12:00', isoDate));
  if (Number.isNaN(value.getTime())) return null;
  return shortWeekdayFormatter.format(value);
};

const shortDateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** "10 de agosto de 2026" en hora Colombia. Devuelve null si la fecha es inválida. */
export const formatColombiaDate = (date) => {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return shortDateFormatter.format(value);
};

/**
 * Segundos → "1h 15m" / "45m" / "2m" / "30s".
 * Para los tiempos de cola por estación, que se leen mejor redondeados.
 */
export const formatDuration = (seconds) => {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};
