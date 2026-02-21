/* ── Constantes y helpers compartidos de EventoDetail ─── */

export const COLORS = [
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Púrpura', hex: '#a855f7' },
];

export const CATEGORIES = [
  { id: 'general', label: 'Zona General',     color: 'bg-slate-100 text-slate-700' },
  { id: 'acopio',  label: 'Centro de Acopio', color: 'bg-amber-100 text-amber-800' },
];

export const ZONE_ROLES = [
  { id: 'supervisor', label: 'Supervisor de Zona', maxCount: 1 },
  { id: 'coordinador', label: 'Coordinador', maxCount: 1 },
  { id: 'colaborador', label: 'Colaborador', maxCount: null }, // null = sin límite
];

export const DATE_TYPE_LABEL = { single_date: 'Fecha única', stages: 'Etapas' };

// TODO: reemplazar con el rol real del usuario autenticado
export const IS_ADMIN = true;

/* ── Pure helpers ─────────────────────────────────────── */
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getCenter = (zone) => {
  if (zone.type === 'rect') {
    return { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
  }
  const x = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length;
  const y = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length;
  return { x, y };
};

export const getStatusColor = (current, max) => {
  const r = current / max;
  if (r > 1) return '#ef4444';
  if (r >= 0.8) return '#eab308';
  return '#22c55e';
};

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.toString().replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
