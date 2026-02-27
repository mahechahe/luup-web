// ─── CollaboratorCard.jsx ─────────────────────────────────────────────────────
import { User, Phone, CreditCard, Plus, History, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function CollaboratorCard({ person, incident, onAddIncident, onViewHistory, onTransfer }) {
  return (
    <div className="rounded-xl bg-[#7493B2]/8 border border-[#7493B2]/15 overflow-hidden">
      {/* Info personal */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 bg-[#7493B2]/20">
          <User className="w-4 h-4 text-[#7493B2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">
            {person.firstName} {person.lastName}
          </p>
          <a
            href={`tel:${person.phone}`}
            className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 hover:text-[#7493B2] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            {person.phone}
          </a>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CreditCard className="w-2.5 h-2.5 shrink-0" />
            CC {person.cedula}
          </p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 border-t border-[#7493B2]/15">
        <IncidentBadge incident={incident} />

        {/* Botones — más grandes en móvil */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onTransfer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTransfer}
                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center text-muted-foreground hover:bg-[#7493B2]/20 active:bg-[#7493B2]/30 transition"
                  aria-label="Trasladar a zona"
                >
                  <ArrowRightLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Trasladar a zona</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onViewHistory}
                className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center text-muted-foreground hover:bg-[#7493B2]/20 active:bg-[#7493B2]/30 transition"
                aria-label="Ver historial de incidencias"
              >
                <History className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Ver historial de incidencias</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddIncident}
                className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center bg-[#7493B2]/15 hover:bg-[#7493B2]/25 active:bg-[#7493B2]/35 text-[#7493B2] transition"
                aria-label="Registrar nueva incidencia"
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Registrar nueva incidencia</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}