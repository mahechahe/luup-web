export function getIncidentStyle(name) {
  const n = (name ?? '').toLowerCase();
  if (n === 'break')
    return { bg: 'bg-[#7493B2]/15', text: 'text-[#7493B2]', dot: 'bg-[#7493B2]' };
  if (n === 'almuerzo')
    return { bg: 'bg-[#DD7419]/15', text: 'text-[#DD7419]', dot: 'bg-[#DD7419]' };
  if (n === 'activo')
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  return { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground/50' };
}

export function IncidentBadge({ incident }) {
  if (!incident)
    return <span className="text-[11px] text-muted-foreground">Sin incidencias</span>;

  const style = getIncidentStyle(incident.name);
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {incident.name}
      {incident.time && (
        <span className="opacity-70 font-normal">· {incident.time}</span>
      )}
    </div>
  );
}
