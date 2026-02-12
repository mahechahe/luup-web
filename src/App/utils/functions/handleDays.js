const order = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const orderEnglish = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function maskToDaysArray(mask) {
  return mask
    .split('')
    .map((bit, index) => (bit === '1' ? order[index] : null))
    .filter(Boolean);
}

export function maskToDaysArrayEnglish(mask) {
  return mask
    .split('')
    .map((bit, index) => (bit === '1' ? orderEnglish[index] : null))
    .filter(Boolean);
}

export function daysArrayToMask(days) {
  // Normaliza y genera bits
  const mask = orderEnglish.map((day) =>
    days.map((d) => d.toLowerCase()).includes(day) ? '1' : '0',
  );
  return mask.join('');
}
