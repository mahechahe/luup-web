import { Shield, Phone, CreditCard, Plus, History, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function SupervisorCard({ person, zoneColor, incident, onAddIncident, onViewHistory, onTransfer }) {
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
            <a
              href={`tel:${person.phone}`}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3 shrink-0" />
              {person.phone}
            </a>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-3 h-3 shrink-0" />
              CC {person.cedula}
            </span>
          </div>
        </div>
      </div>

      {/* Fila de incidencia + botones */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 sm:py-1.5 border-t border-black/5">
        <IncidentBadge incident={incident} />
        <div className="flex items-center gap-1.5 shrink-0">
          {onTransfer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTransfer}
                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center text-muted-foreground hover:bg-black/10 active:bg-black/15 transition"
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
                className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center text-muted-foreground hover:bg-black/10 active:bg-black/15 transition"
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
                className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg sm:rounded-md flex items-center justify-center transition"
                style={{
                  backgroundColor: zoneColor + '25',
                  color: zoneColor,
                }}
                aria-label="Registrar nueva incidencia"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = zoneColor + '40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = zoneColor + '25'}
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