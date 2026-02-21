import { Shield, Phone, CreditCard, Plus, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function SupervisorCard({ person, zoneColor, incident, onAddIncident, onViewHistory }) {
  return (
    <div
      className="rounded-xl border-l-4 overflow-hidden"
      style={{ backgroundColor: zoneColor + '12', borderLeftColor: zoneColor }}
    >
      {/* Info principal */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: zoneColor + '28' }}
        >
          <Shield className="w-5 h-5" style={{ color: zoneColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            {person.firstName} {person.lastName}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {person.phone}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-3 h-3 shrink-0" />
              CC {person.cedula}
            </span>
          </div>
        </div>
      </div>

      {/* Fila de incidencia */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-black/5">
        <IncidentBadge incident={incident} />
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onViewHistory}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-black/10 transition"
              >
                <History className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Ver historial de incidencias</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddIncident}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-black/10 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Registrar nueva incidencia</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
