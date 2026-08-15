import { Shield, Phone, CreditCard, Plus, History, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function SupervisorCard({ person, zoneColor, incident, onAddIncident, onViewHistory, onTransfer }) {
  // Versiones con opacidad para los botones
  const colorBg12 = zoneColor + '1F'; // ~12%
  const colorBg25 = zoneColor + '40'; // ~25%
  const colorBorder = zoneColor + '40';

  return (
    <div
      className="rounded-xl border-l-4 overflow-hidden"
      style={{ backgroundColor: zoneColor + '12', borderLeftColor: zoneColor }}
    >
      {/* Info */}
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

      {/* Badge + botones */}
      <div className="border-t border-black/5 px-4 pt-2 pb-3 space-y-2">
        <IncidentBadge incident={incident} />

        <div className="flex items-center gap-1.5">
          {onTransfer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTransfer}
                  aria-label="Trasladar a zona"
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold leading-none">Trasladar</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Trasladar a zona</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onViewHistory}
                aria-label="Ver historial"
                className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition"
                style={{
                  backgroundColor: colorBg12,
                  border: `1px solid ${colorBorder}`,
                  color: zoneColor,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorBg25}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBg12}
              >
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold leading-none">Historial</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Ver historial de incidencias</TooltipContent>
          </Tooltip>

          {onAddIncident && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAddIncident}
                  aria-label="Registrar incidencia"
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl text-white transition shadow-sm"
                  style={{ backgroundColor: zoneColor }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold leading-none">Incidencia</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Registrar nueva incidencia</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}