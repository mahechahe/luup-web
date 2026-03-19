import {
  User,
  Phone,
  CreditCard,
  Plus,
  History,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IncidentBadge } from './IncidentBadge';

export function CollaboratorCard({
  person,
  incident,
  onAddIncident,
  onViewHistory,
  onTransfer,
}) {
  const isActive = incident?.name?.toLowerCase() === 'activo';
  const hasIncident = !!incident;

  return (
    <div
      className={`rounded-xl bg-[#7493B2]/8 border overflow-hidden ${
        !hasIncident
          ? 'border-[#7493B2]/15'
          : isActive
            ? 'border-emerald-300 dark:border-emerald-700'
            : 'border-[#DD7419]/40'
      }`}
    >
      {/* Barra de estado */}
      <div
        className={`h-1 ${
          !hasIncident
            ? 'bg-[#7493B2]/20'
            : isActive
              ? 'bg-emerald-500'
              : 'bg-[#DD7419]'
        }`}
      />

      {/* Info personal */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#7493B2]/20">
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

      {/* Badge + botones */}
      <div className="border-t border-border px-3 pt-2 pb-2.5 space-y-2">
        <IncidentBadge incident={incident} />

        <div className="flex items-center gap-1.5">
          {onTransfer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTransfer}
                  aria-label="Trasladar a zona"
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl border border-[#234465]/20 bg-[#234465]/8 hover:bg-[#234465]/15 active:bg-[#234465]/20 text-[#234465] dark:border-[#7493B2]/30 dark:bg-[#7493B2]/10 dark:hover:bg-[#7493B2]/20 dark:text-[#7493B2] transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold leading-none">
                    Trasladar
                  </span>
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
                className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl border border-[#7493B2]/30 bg-[#7493B2]/10 hover:bg-[#7493B2]/20 active:bg-[#7493B2]/30 text-[#7493B2] transition"
              >
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold leading-none">
                  Historial
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Ver historial de incidencias
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddIncident}
                aria-label="Registrar incidencia"
                className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 active:bg-[#DD7419]/80 text-white transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold leading-none">
                  Incidencia
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Registrar nueva incidencia
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
