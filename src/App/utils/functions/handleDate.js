import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (isoDate) => {
  const date = new Date(isoDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexed
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
};

export const dateString = (date) => {
  if (!date) return '';

  // Verifica si ya es un objeto Date, si no, intenta parsearlo
  const parsedDate = date instanceof Date ? date : parseISO(date);
  const formattedDate = format(parsedDate, 'd MMMM yyyy', { locale: es });

  return formattedDate;
};

export const isEndTimeEarlier = (startTime, endTime) => {
  // Convertir ambos tiempos en minutos desde la medianoche
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  // Comparar los minutos
  return endMinutes <= startMinutes;
};

export const isEndDateEarlier = ({ startDate, endDate }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end.getTime() < start.getTime()) {
    return true;
  }

  return false;
};

const options = {
  weekday: 'long', // lunes, martes, etc.
  day: 'numeric', // 1, 2, 15...
  month: 'long', // enero, febrero, ...
  year: 'numeric', // 2024, 2025...
};

export const convertDateToText = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const text = new Intl.DateTimeFormat('es-CO', options).format(date);
  return text;
};

export const returnHourFromISO = (iso) => {
  try {
    const hhmmCO = new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
    return hhmmCO;
  } catch (error) {
    return '';
  }
};
