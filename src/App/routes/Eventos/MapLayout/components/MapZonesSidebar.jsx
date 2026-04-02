import { Layers, MapPin } from 'lucide-react';
import { useState } from 'react';
import { ZoneAccordionItem } from '../../Canvas/components/ZoneAccordionItem';
import { ZoneDetailModal } from '../../Canvas/components/ZoneDetailModal';

export function MapZonesSidebar({
  isOpen,
  zones,
  selectedId,
  isAdmin,
  onSelectZone,
  onUpdateZone,
  onAddPeople,
  onRemovePerson,
  onDeleteRequest,
}) {
  const [detailZoneId, setDetailZoneId] = useState(null);
  const detailZone = zones.find((z) => z.id === detailZoneId);

  const allAssignedPeopleIds = new Set(
    zones.flatMap((z) => z.people.map((p) => p.id))
  );

  return (
    <>
      {detailZone && (
        <ZoneDetailModal
          zone={detailZone}
          zones={zones}
          isAdmin={isAdmin}
          allAssignedPeopleIds={allAssignedPeopleIds}
          onUpdate={onUpdateZone}
          onAddPeople={onAddPeople}
          onRemovePerson={onRemovePerson}
          onDeleteRequest={onDeleteRequest}
          onClose={() => setDetailZoneId(null)}
        />
      )}

      <aside
        className={`shrink-0 flex flex-col border-l border-border bg-card transition-all duration-300 overflow-hidden ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        <div className="w-80 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#DD7419]/10 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-[#DD7419]" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Zonas del mapa</h2>
            </div>
          </div>

          {/* Instrucción */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usa el botón de polígono en el mapa para dibujar nuevas zonas. Haz clic en una zona para seleccionarla.
            </p>
          </div>

          {/* Lista de zonas */}
          <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#DD7419] flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-semibold text-foreground">Zonas</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                {zones.length}
              </span>
            </div>

            {zones.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">
                Sin zonas registradas
              </p>
            ) : (
              zones.map((zone) => (
                <ZoneAccordionItem
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedId === zone.id}
                  onSelect={onSelectZone}
                  onViewDetails={setDetailZoneId}
                />
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
