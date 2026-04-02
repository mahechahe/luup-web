export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function genderLabel(gender) {
  const map = { male: 'M', female: 'F', other: 'Otro' };
  return map[gender] ?? null;
}

export function genderBadgeClass(gender) {
  if (gender === 'female') return 'bg-pink-100 text-pink-600 border-pink-200';
  if (gender === 'male') return 'bg-sky-100 text-sky-600 border-sky-200';
  return null;
}

export function activeBarClass(isActive) {
  return isActive ? 'bg-emerald-500' : 'bg-red-400';
}
