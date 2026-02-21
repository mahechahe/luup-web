import { User, Phone, CreditCard, Plus, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function CollaboratorCard({ person, incident, onAddIncident, onViewHistory }) {
  return (
    <div className="rounded-xl bg-[#7493B2]/8 border border-[#7493B2]/15 overflow-hidden">
      {/* Info principal */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#7493B2]/20">
          <User className="w-4 h-4 text-[#7493B2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">
            {person.firstName} {person.lastName}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="w-2.5 h-2.5 shrink-0" />
            {person.phone}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CreditCard className="w-2.5 h-2.5 shrink-0" />
            CC {person.cedula}
          </p>
        </div>
      </div>

      {/* Fila de incidencia */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-[#7493B2]/15">
        <IncidentBadge incident={incident} />
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onViewHistory}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-[#7493B2]/20 transition"
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
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-[#7493B2]/20 transition"
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
