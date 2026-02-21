import { Eye, Users } from 'lucide-react';
import { CATEGORIES } from './constants';

export function ZoneAccordionItem({
  zone,
  isSelected,
  onSelect,
  onViewDetails,
}) {
  return (
    <div
      onClick={() => onSelect(zone.id)}
      className={`rounded-lg border bg-white overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#234465] shadow-md'
          : 'border-border shadow-sm hover:shadow-md hover:border-[#234465]/30'
      }`}
    >
      <div className="p-3 flex items-center justify-between gap-3">
        {/* Información de la zona */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 self-start mt-1"
            style={{ backgroundColor: zone.color }}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-xs text-foreground truncate">
              {zone.name}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium self-start ${
                CATEGORIES.find((c) => c.id === (zone.category || 'general'))
                  ?.color
              }`}
            >
              {
                CATEGORIES.find((c) => c.id === (zone.category || 'general'))
                  ?.label
              }
            </span>
          </div>
        </div>

        {/* Capacidad y botón */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {zone.people.length}/{zone.maxCapacity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(zone.id);
            }}
            className="flex items-center gap-1 bg-[#234465] hover:bg-[#234465]/90 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition"
          >
            <Eye className="w-3 h-3" />
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  );
}
