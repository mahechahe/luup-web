import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatColombiaLongDate } from '@/App/utils/functions/colombiaDate';
import {
  AlertCircle,
  CalendarClock,
  IdCard,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';

/**
 * Estructura común de las 4 estaciones: banner con la fecha de hoy (hora Colombia)
 * y botón de recarga, barra de filtros nombre/cédula, y aviso de error de carga.
 *
 * `filters` y `loading` vienen tal cual de `useStationList`.
 */
export function StationLayout({
  station,
  title,
  loading,
  error,
  onRefresh,
  filters,
  shiftId = '',
  shiftOptions = [],
  onShiftChange,
  headerActions,
  day,
  isToday = true,
  children,
}) {
  const dayDate = day?.date
    ? formatColombiaLongDate(`${day.date}T12:00:00-05:00`)
    : formatColombiaLongDate();

  const shiftLabel = (shift) => {
    const hours =
      shift.startTime && shift.endTime
        ? ` · ${shift.startTime}–${shift.endTime}`
        : '';
    return `${shift.name}${hours}`;
  };

  return (
    <>
      {/* Banner */}
      <div className="rounded-2xl bg-[#234465] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            {station}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            {title}
          </h2>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide mb-0.5">
              {day ? `Día ${day.dayNumber}` : 'Fecha de hoy'}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#DD7419] capitalize leading-snug">
              {dayDate}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
            {headerActions}
          </div>
        </div>
      </div>

      {/* Aviso de jornada distinta a hoy — evita registrar el día equivocado */}
      {!isToday && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-[#DD7419] bg-[#DD7419]/10 px-4 py-3">
          <CalendarClock className="w-4 h-4 text-[#DD7419] shrink-0 mt-0.5" />
          <p className="text-xs text-[#DD7419] leading-relaxed">
            <span className="font-bold">Estás viendo otra jornada.</span> Lo que
            registres aquí queda en el{' '}
            <span className="font-bold capitalize">{dayDate}</span>, no en el
            día de hoy.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card rounded-xl border border-border p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={filters.input.name}
              onChange={(e) => filters.setField('name', e.target.value)}
              onKeyDown={filters.onKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
            />
          </div>

          <div className="relative w-40 shrink-0">
            <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cédula…"
              value={filters.input.cedula}
              onChange={(e) => filters.setField('cedula', e.target.value)}
              onKeyDown={filters.onKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
            />
          </div>

          <div className="w-full shrink-0 sm:w-56">
            <Select
              value={shiftId || '__all__'}
              onValueChange={(value) =>
                onShiftChange?.(value === '__all__' ? '' : value)
              }
            >
              <SelectTrigger
                className="h-9 w-full"
                aria-label="Filtrar por turno"
              >
                <SelectValue placeholder="Todos los turnos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los turnos</SelectItem>
                {shiftOptions.map((shift) => (
                  <SelectItem key={shift.shiftId} value={String(shift.shiftId)}>
                    {shiftLabel(shift)}
                    {!shift.isActive ? ' · Inactivo' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={filters.submit}
            disabled={!filters.hasActive || loading}
            className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </Button>

          {filters.hasActive && (
            <Button
              variant="outline"
              onClick={filters.clear}
              className="h-9 gap-1.5 text-muted-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-xs">Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error de carga — antes fallaba en silencio y la estación se veía vacía */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-destructive">
              No se pudieron cargar los registros
            </p>
            <p className="text-[11px] text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
