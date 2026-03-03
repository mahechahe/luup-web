import { useState } from 'react';
import {
  Users, UserCheck, UserX, Utensils, Coffee,
  FileText, Shield, Crown, Trash2, Weight,
  Plus, ClipboardList, History, ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleSectionLabel } from './RoleSectionLabel';
import { SupervisorCard } from './SupervisorCard';
import { CoordinatorCard } from './CoordinatorCard';
import { CollaboratorCard } from './CollaboratorCard';
import { WasteHistoryModal } from './WasteHistoryModal';

const CATEGORY_STYLE = {
  general: 'bg-[#234465]/10 text-[#234465]',
  acopio: 'bg-[#DD7419]/10 text-[#DD7419]',
};

const CATEGORY_LABEL = {
  general: 'Zona general',
  acopio: 'Centro de Acopio',
};

function MiniStat({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  );
}

export function ZoneCard({
  zone,
  incidents = {},
  wasteEntries = [],
  wasteLoading = false,
  onAddIncident,
  onViewHistory,
  onAddWaste,
  onTransfer,
  eventRole,
}) {
  const [showWasteHistory, setShowWasteHistory] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allPeople = [
    ...(zone.coordinator ? [zone.coordinator] : []),
    ...(zone.supervisor ? [zone.supervisor] : []),
    ...zone.collaborators,
  ];

  const staffCount =
    (zone.supervisor ? 1 : 0) +
    (zone.coordinator ? 1 : 0) +
    zone.collaborators.length;

  const getLatest = (userId) => {
    const arr = incidents[userId] ?? [];
    return arr.length > 0 ? arr[arr.length - 1] : null;
  };

  const activeCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return !inc || inc.name?.toLowerCase() === 'activo';
  }).length;

  const lunchCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'almuerzo';
  }).length;

  const breakCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'break';
  }).length;

  const inactiveCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'inactivo';
  }).length;

  const totalWasteQty = wasteEntries.reduce((sum, e) => sum + (e.quantity ?? 0), 0);
  const totalWasteKg = wasteEntries.reduce((sum, e) => sum + (e.weightKg ?? 0), 0);
  const hasWasteKg = wasteEntries.some((e) => e.weightKg != null);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="h-1.5 shrink-0" style={{ backgroundColor: zone.color }} />

      {/* Header — clickable para expandir/colapsar */}
      <div
        className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: zone.color }}
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                {zone.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{staffCount}</span>{' '}
                {staffCount === 1 ? 'persona' : 'personas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              <Badge className={`text-xs border-0 font-medium ${CATEGORY_STYLE[zone.category] ?? 'bg-muted text-foreground'}`}>
                {CATEGORY_LABEL[zone.category] ?? zone.category}
              </Badge>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: zone.color }}
              >
                <Users className="w-3 h-3" />
                <span>Máx. {zone.maxCapacity}</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50">
              <ChevronDown
                className="w-4 h-4 text-muted-foreground transition-transform duration-300"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </div>
          </div>
        </div>

        {zone.notes && !expanded && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50">
            <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{zone.notes}</p>
          </div>
        )}
      </div>

      {/* Vista colapsada — 5 mini stats */}
      {!expanded && (
        <>
          <div className="mx-4 sm:mx-6 border-t border-border mb-3" />
          <div className="px-4 sm:px-6 pb-4">
            <div className="grid grid-cols-5 gap-1.5 bg-muted/30 rounded-2xl px-3 py-3">
              <MiniStat icon={Users}      value={staffCount}    label="Total"     color="text-foreground" />
              <MiniStat icon={UserCheck}  value={activeCount}   label="Activos"   color="text-emerald-600" />
              <MiniStat icon={Utensils}   value={lunchCount}    label="Almuerzo"  color="text-[#DD7419]" />
              <MiniStat icon={Coffee}     value={breakCount}    label="Break"     color="text-[#7493B2]" />
              <MiniStat icon={UserX}      value={inactiveCount} label="Inactivos" color="text-slate-500" />
            </div>
          </div>
        </>
      )}

      {/* Contenido expandido */}
      {expanded && (
        <div>
          <div className="mx-4 sm:mx-6 border-t border-border" />

          {zone.notes && (
            <div className="mx-4 sm:mx-6 mt-4">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50">
                <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{zone.notes}</p>
              </div>
            </div>
          )}

          {/* Límites de acopio */}
          {zone.category === 'acopio' && (zone.wasteLimit != null || zone.weightLimit != null) && (
            <>
              <div className="px-4 sm:px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
                {zone.wasteLimit != null && (
                  <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[#DD7419]">
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Límite basuras</span>
                    </div>
                    <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">{zone.wasteLimit}</p>
                    <p className="text-xs text-[#DD7419]/60 font-medium">unidades</p>
                  </div>
                )}
                {zone.weightLimit != null && (
                  <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[#DD7419]">
                      <Weight className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Límite de peso</span>
                    </div>
                    <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">{zone.weightLimit}</p>
                    <p className="text-xs text-[#DD7419]/60 font-medium">kilogramos</p>
                  </div>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Conteo de basuras */}
          {zone.category === 'acopio' && (
            <>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#DD7419]">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm font-bold">Conteo de basuras</span>
                  </div>
                  <button
                    onClick={onAddWaste}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DD7419] text-white text-xs font-semibold hover:bg-[#DD7419]/90 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar
                  </button>
                </div>
                {wasteLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3">
                        <Skeleton className="h-2.5 w-28 bg-[#DD7419]/20" />
                        <Skeleton className="h-8 w-10 mt-1 bg-[#DD7419]/20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#DD7419]/70 uppercase tracking-wide flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Total registradas
                        </p>
                        <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">{totalWasteQty}</p>
                        <p className="text-xs text-[#DD7419]/50 mt-0.5">unidades</p>
                      </div>
                      <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#DD7419]/70 uppercase tracking-wide flex items-center gap-1">
                          <Weight className="w-3 h-3" /> Peso total
                        </p>
                        <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">
                          {hasWasteKg ? totalWasteKg.toFixed(1) : '—'}
                        </p>
                        <p className="text-xs text-[#DD7419]/50 mt-0.5">kilogramos</p>
                      </div>
                    </div>
                    {wasteEntries.length > 0 ? (
                      <button
                        onClick={() => setShowWasteHistory(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#DD7419]/30 text-[#DD7419] text-xs font-semibold hover:bg-[#DD7419]/8 transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        Ver historial · {wasteEntries.length} {wasteEntries.length === 1 ? 'entrada' : 'entradas'}
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-1">Sin registros aún</p>
                    )}
                  </>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Personal */}
          <div className="px-4 sm:px-6 py-5 flex-1 space-y-5">
            {zone.supervisor && (
              <div>
                <RoleSectionLabel icon={Shield} label="Supervisor" colorClass="text-[#234465]" />
                <SupervisorCard
                  person={zone.supervisor}
                  zoneColor={zone.color}
                  incident={getLatest(zone.supervisor.userId)}
                  onAddIncident={() => onAddIncident(zone.supervisor)}
                  onViewHistory={() => onViewHistory(zone.supervisor)}
                  onTransfer={onTransfer ? () => onTransfer(zone.supervisor, zone.id) : undefined}
                />
              </div>
            )}

            {zone.coordinator && (
              <div>
                <RoleSectionLabel icon={Crown} label="Coordinador" colorClass="text-[#DD7419]" />
                <CoordinatorCard
                  person={zone.coordinator}
                  incident={getLatest(zone.coordinator.userId)}
                  onAddIncident={() => onAddIncident(zone.coordinator)}
                  onViewHistory={() => onViewHistory(zone.coordinator)}
                  onTransfer={
                    onTransfer && eventRole !== 'coordinator'
                      ? () => onTransfer(zone.coordinator, zone.id)
                      : undefined
                  }
                />
              </div>
            )}

            {zone.collaborators.length > 0 && (
              <div>
                <RoleSectionLabel
                  icon={Users}
                  label="Colaboradores"
                  count={zone.collaborators.length}
                  colorClass="text-[#7493B2]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zone.collaborators.map((c, i) => (
                    <CollaboratorCard
                      key={i}
                      person={c}
                      incident={getLatest(c.userId)}
                      onAddIncident={() => onAddIncident(c)}
                      onViewHistory={() => onViewHistory(c)}
                      onTransfer={onTransfer ? () => onTransfer(c, zone.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {staffCount === 0 && (
              <p className="text-sm text-muted-foreground italic">Sin personal asignado</p>
            )}
          </div>
        </div>
      )}

      <WasteHistoryModal
        open={showWasteHistory}
        onClose={() => setShowWasteHistory(false)}
        zone={zone}
        entries={wasteEntries}
      />
    </div>
  );
}