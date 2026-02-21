import { Users, FileText, Shield, Crown, Trash2, Weight, Plus, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RoleSectionLabel } from './RoleSectionLabel';
import { SupervisorCard } from './SupervisorCard';
import { CoordinatorCard } from './CoordinatorCard';
import { CollaboratorCard } from './CollaboratorCard';

const CATEGORY_STYLE = {
  general: 'bg-[#234465]/10 text-[#234465]',
  acopio: 'bg-[#DD7419]/10 text-[#DD7419]',
};

const CATEGORY_LABEL = {
  general: 'Zona general',
  acopio: 'Centro de Acopio',
};

export function ZoneCard({ zone, incidents = {}, wasteEntries = [], onAddIncident, onViewHistory, onAddWaste }) {
  const staffCount =
    (zone.supervisor ? 1 : 0) +
    (zone.coordinator ? 1 : 0) +
    zone.collaborators.length;

  const getLatest = (userId) => {
    const arr = incidents[userId] ?? [];
    return arr.length > 0 ? arr[arr.length - 1] : null;
  };

  const totalWasteQty = wasteEntries.reduce((sum, e) => sum + (e.quantity ?? 0), 0);
  const totalWasteKg = wasteEntries.reduce((sum, e) => sum + (e.weightKg ?? 0), 0);
  const hasWasteKg = wasteEntries.some((e) => e.weightKg != null);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Barra de color superior */}
      <div className="h-1.5 shrink-0" style={{ backgroundColor: zone.color }} />

      {/* Header de la zona */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Nombre + swatch */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-xl shrink-0 shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: zone.color }}
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight truncate">
                {zone.name}
              </h3>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              className={`text-xs border-0 font-medium ${CATEGORY_STYLE[zone.category] ?? 'bg-muted text-foreground'}`}
            >
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
        </div>

        {/* Notas */}
        {zone.notes && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50">
            <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{zone.notes}</p>
          </div>
        )}
      </div>

      {/* Divisor */}
      <div className="mx-6 border-t border-border" />

      {/* Límites de acopio */}
      {zone.category === 'acopio' && (zone.wasteLimit != null || zone.weightLimit != null) && (
        <>
          <div className="px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
            {zone.wasteLimit != null && (
              <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#DD7419]">
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Límite basuras</span>
                </div>
                <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">
                  {zone.wasteLimit}
                </p>
                <p className="text-xs text-[#DD7419]/60 font-medium">unidades</p>
              </div>
            )}
            {zone.weightLimit != null && (
              <div className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#DD7419]">
                  <Weight className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Límite de peso</span>
                </div>
                <p className="text-3xl font-bold text-[#DD7419] leading-none mt-1">
                  {zone.weightLimit}
                </p>
                <p className="text-xs text-[#DD7419]/60 font-medium">kilogramos</p>
              </div>
            )}
          </div>
          <div className="mx-6 border-t border-border" />
        </>
      )}

      {/* Conteo de basuras — solo acopio */}
      {zone.category === 'acopio' && (
        <>
          <div className="px-6 py-4 space-y-3">
            {/* Título + botón registrar */}
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

            {/* Totales */}
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

            {/* Últimas entradas */}
            {wasteEntries.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Últimas entradas
                </p>
                {[...wasteEntries].reverse().slice(0, 3).map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#DD7419] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium">
                        {entry.quantity} {entry.quantity === 1 ? 'unidad' : 'unidades'}
                        {entry.weightKg != null && (
                          <span className="text-muted-foreground font-normal"> · {entry.weightKg} kg</span>
                        )}
                      </p>
                      {entry.note && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {wasteEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-1">
                Sin registros aún
              </p>
            )}
          </div>
          <div className="mx-6 border-t border-border" />
        </>
      )}

      {/* Personal */}
      <div className="px-6 py-5 flex-1 space-y-5">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{staffCount}</span>{' '}
          {staffCount === 1 ? 'persona asignada' : 'personas asignadas'}
        </p>

        {zone.supervisor && (
          <div>
            <RoleSectionLabel icon={Shield} label="Supervisor" colorClass="text-[#234465]" />
            <SupervisorCard
              person={zone.supervisor}
              zoneColor={zone.color}
              incident={getLatest(zone.supervisor.userId)}
              onAddIncident={() => onAddIncident(zone.supervisor)}
              onViewHistory={() => onViewHistory(zone.supervisor)}
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
  );
}
