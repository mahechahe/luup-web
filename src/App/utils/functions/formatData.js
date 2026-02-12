/* eslint-disable radix */
export const formatPrice = (price) => {
  if (typeof price === 'string' && !/^\d+(\.\d+)?$/.test(price.trim())) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(0);
  }

  const parsed = Number.parseFloat(price);

  if (Number.isNaN(parsed)) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(0);
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(parsed);
};

export const formatDuration = (duration) => {
  const [hours, minutes] = duration.split(':');
  if (hours === '00') return `${Number.parseInt(minutes)} min`;
  if (minutes === '00') return `${Number.parseInt(hours)} h`;
  return `${Number.parseInt(hours)}h ${Number.parseInt(minutes)}m`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatNumberToDecimals = (input) => {
  if (!/^\d+$/.test(input)) {
    return 'Número agregado erróneamente';
  }

  return input.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export function formatToHHMM(time) {
  const [hh, mm] = time.split(':');
  return `${hh}:${mm}`;
}
