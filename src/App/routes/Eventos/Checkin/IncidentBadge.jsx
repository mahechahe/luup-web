export function getIncidentStyle(name) {
  const n = (name ?? '').toLowerCase();
  if (n.includes('regres') || n.includes('volvi'))
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  if (n.includes('emergencia'))
    return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
  if (n.includes('almuerzo') || n.includes('comida'))
    return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
  if (n.includes('descanso'))
    return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (n.includes('fuera') || n.includes('zona'))
    return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
  return { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground/50' };
}

export function IncidentBadge({ incident }) {
  if (!incident) return <span className="text-xs text-muted-foreground">—</span>;

  const style = getIncidentStyle(incident.name);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {incident.name}
    </div>
  );
}
