export function RoleSectionLabel({ icon: Icon, label, count, colorClass }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
      <span className={`text-[11px] font-bold uppercase tracking-widest ${colorClass}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-muted-foreground font-medium">({count})</span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
